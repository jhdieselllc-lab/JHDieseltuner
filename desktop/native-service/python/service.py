"""Isolated RP1210 worker. JSON-lines stdin/stdout; no network listener or ECU writes.
Vendor DLL calls are serialized. Driver registration is not physical adapter detection.
"""
import configparser
import ctypes
import json
import os
from pathlib import Path
import re
import sys
import time


def read_ini(path):
    parser = configparser.ConfigParser(interpolation=None, strict=False)
    parser.read(path, encoding='utf-8-sig')
    return parser


def discover(root=None):
    if root is None and os.name != 'nt':
        return {'platform': sys.platform, 'drivers': [], 'message': 'Windows is required for vendor drivers.'}
    roots = [Path(root)] if root else list(dict.fromkeys([Path(os.environ['WINDIR']) / 'SysWOW64', Path(os.environ['WINDIR']) / 'System32', Path(os.environ['WINDIR'])]))
    drivers, seen = [], set()
    for folder in roots:
        master = read_ini(folder / 'RP121032.ini')
        for section in master.sections():
            if section.strip().lower() != 'rp1210support':
                continue
            for name in master.get(section, 'APIImplementations', fallback='').split(','):
                name = name.strip()
                if not re.fullmatch(r'[\w-]+', name):
                    continue
                ini = folder / (name + '.ini')
                if not ini.exists():
                    continue
                p = read_ini(ini)
                protocol_names = [p.get(s, 'ProtocolString', fallback='') for s in p.sections() if s.lower().startswith('protocolinformation')]
                for s in p.sections():
                    if not s.lower().startswith('deviceinformation'):
                        continue
                    device = p.getint(s, 'DeviceID', fallback=-1)
                    if not 0 <= device <= 32767:
                        continue
                    key = str(folder / name) + ':' + str(device)
                    if key in seen:
                        continue
                    seen.add(key)
                    drivers.append({'id': key, 'api': name, 'deviceId': device, 'name': p.get(s, 'DeviceName', fallback=name), 'description': p.get(s, 'DeviceDescription', fallback=''), 'dll': str(folder / (name + '.dll')), 'protocols': [x for x in protocol_names if x], 'registered': True, 'physicalPresence': 'not-checked'})
    return {'platform': sys.platform, 'workerBits': ctypes.sizeof(ctypes.c_void_p)*8, 'drivers': drivers, 'message': 'Registered drivers only. Connect must succeed before adapter presence is confirmed.'}


class Worker:
    def __init__(self):
        self.dll = None
        self.client = None
        self.protocol = None

    def disconnect(self):
        if self.client is not None:
            result = self.dll.RP1210_ClientDisconnect(self.client)
            self.client = None
            if result:
                raise RuntimeError('RP1210 disconnect error ' + str(result))
        return {'connected': False}

    def connect(self, args):
        if os.name != 'nt':
            raise ValueError('Windows required')
        if self.client is not None:
            raise ValueError('Disconnect the active session first')
        driver = next((d for d in discover()['drivers'] if d['id'] == args.get('driverId')), None)
        if not driver:
            raise ValueError('Select a registered driver')
        protocol = args.get('protocol')
        # Only exact strings advertised by the vendor INI are accepted.
        if protocol not in driver['protocols'] or protocol.upper() not in ('J1939', 'CAN', 'J1708'):
            raise ValueError('Only advertised J1939, CAN or J1708 capture protocols are enabled')
        dll_path = Path(driver['dll']).resolve(strict=True)
        if not dll_path.is_absolute():
            raise ValueError('Absolute vendor DLL required')
        try:
            self.dll = ctypes.WinDLL(str(dll_path), winmode=0x1100)
        except OSError as exc:
            raise RuntimeError('Driver load failed; match worker Python bitness to vendor DLL: ' + str(exc)) from exc
        short = ctypes.c_short
        self.dll.RP1210_ClientConnect.argtypes = [ctypes.c_void_p, short, ctypes.c_char_p, ctypes.c_long, ctypes.c_long, short]
        self.dll.RP1210_ClientConnect.restype = short
        self.dll.RP1210_ClientDisconnect.argtypes = [short]
        self.dll.RP1210_ClientDisconnect.restype = short
        self.dll.RP1210_ReadMessage.argtypes = [short, ctypes.c_void_p, short, short]
        self.dll.RP1210_ReadMessage.restype = short
        self.dll.RP1210_SendCommand.argtypes = [short, short, ctypes.c_void_p, short]
        self.dll.RP1210_SendCommand.restype = short
        client = self.dll.RP1210_ClientConnect(None, driver['deviceId'], protocol.encode('ascii'), 0, 0, 0)
        if not 0 <= client <= 127:
            raise RuntimeError('RP1210 connect error ' + str(client))
        self.client = client
        self.protocol = protocol
        # RP1210 command 3: set all filters to pass. No SendMessage export is exposed.
        code = self.dll.RP1210_SendCommand(3, client, None, 0)
        if code:
            self.disconnect()
            raise RuntimeError('RP1210 filter setup error ' + str(code))
        return {'connected': True, 'protocol': protocol, 'mode': 'receive-only application', 'message': 'Adapter client opened. This does not identify a vehicle or prove bus traffic. CAN controllers may acknowledge frames.'}

    def poll(self):
        if self.client is None:
            raise ValueError('No active client')
        frames = []
        buf = ctypes.create_string_buffer(2000)
        deadline = time.monotonic() + .08
        while len(frames) < 100 and time.monotonic() < deadline:
            count = self.dll.RP1210_ReadMessage(self.client, buf, 2000, 0)
            if count == 0:
                break
            if count < 0:
                raise RuntimeError('RP1210 read error ' + str(-count))
            if count < 4 or count > 2000:
                raise RuntimeError('Invalid RP1210 message length')
            data = bytes(buf.raw[:count])
            frames.append({'timestampRaw': int.from_bytes(data[:4], 'big'), 'payloadHex': data[4:].hex(), 'protocol': self.protocol, 'receivedAt': time.time()})
        return {'frames': frames, 'identity': None, 'dtcs': None, 'message': 'Raw vendor messages. Timestamp units and payload layout require vendor/profile validation; no decoded vehicle data is inferred.'}

    def dispatch(self, request):
        op = request.get('op')
        if op == 'discover':
            return discover()
        if op == 'connect':
            return self.connect(request.get('args', {}))
        if op == 'poll':
            return self.poll()
        if op == 'disconnect':
            return self.disconnect()
        raise ValueError('Unsupported operation')


if __name__ == '__main__':
    worker = Worker()
    try:
        for line in sys.stdin:
            request = {}
            try:
                if len(line) > 16384:
                    raise ValueError('Request too large')
                request = json.loads(line)
                result = worker.dispatch(request)
                print(json.dumps({'id': request.get('id'), 'ok': True, 'result': result}), flush=True)
            except Exception as exc:
                print(json.dumps({'id': request.get('id'), 'ok': False, 'error': str(exc)}), flush=True)
    finally:
        worker.disconnect()
