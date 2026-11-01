import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from service import discover, Worker

class ServiceTests(unittest.TestCase):
    def test_discovery_is_registration_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/'RP121032.ini').write_text('[RP1210Support ]\nAPIImplementations= test32,, , ../bad, test32\n')
            (root/'test32.ini').write_text('[DeviceInformation1]\nDeviceID=1\nDeviceName=Fixture adapter\n[ProtocolInformation1]\nProtocolString=J1939\n')
            result=discover(tmp)
            self.assertEqual(len(result['drivers']),1)
            self.assertEqual(result['drivers'][0]['physicalPresence'],'not-checked')
            self.assertEqual(result['drivers'][0]['protocols'],['J1939'])
    def test_unknown_operations_rejected(self):
        for op in ['write','flash','unlock','sendMessage']:
            with self.assertRaises(ValueError): Worker().dispatch({'op':op})
    def test_poll_requires_connection(self):
        with self.assertRaises(ValueError): Worker().poll()
    def test_worker_survives_bad_request(self):
        run=subprocess.run([sys.executable,str(Path(__file__).with_name('service.py'))],input='bad json\n'+json.dumps({'id':2,'op':'discover'})+'\n',text=True,capture_output=True,check=True)
        results=[json.loads(x) for x in run.stdout.splitlines()]
        self.assertFalse(results[0]['ok'])
        self.assertTrue(results[1]['ok'])
        self.assertEqual(results[1]['id'],2)
if __name__=='__main__': unittest.main()
