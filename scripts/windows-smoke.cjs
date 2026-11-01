const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const output = path.resolve('verification-results');
  await fs.mkdir(output, { recursive: true });
  const errors = [];
  const consoleMessages = [];
  let app;
  try {
    app = await electron.launch({ executablePath: process.argv[2], timeout: 60000 });
    const page = await app.firstWindow({ timeout: 60000 });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      consoleMessages.push({ type: message.type(), text: message.text() });
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.getByRole('heading', { name: 'Good morning. Ready to diagnose?' }).waitFor();
    const runtime = await page.evaluate(() => window.jhDesktop.runtimeInfo());
    assert.equal(runtime.platform, 'win32');
    assert.equal(runtime.packaged, true);
    // Discover installed drivers only. Never connect to an adapter or vehicle.
    const discovery = await page.evaluate(() => window.jhDesktop.discover());
    assert.ok(Array.isArray(discovery.drivers));
    await page.screenshot({ path: path.join(output, 'installed-overview.png'), fullPage: true });
    for (const label of ['Projects & programming', 'Logs & graphs', 'Tune planner', 'Coverage & explanations']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      assert.ok((await page.locator('main').innerText()).length > 100);
    }
    await page.screenshot({ path: path.join(output, 'installed-coverage.png'), fullPage: true });
    await page.getByRole('button', { name: 'Projects & programming', exact: true }).click();
    await page.getByRole('button', { name: 'Load 2004 Eclipse 2.4L profile', exact: true }).click();
    assert.equal(await page.getByLabel('Model year', { exact: true }).inputValue(), '2004');
    assert.equal(await page.getByLabel('Engine', { exact: true }).inputValue(), 'Mitsubishi Eclipse 2.4L (2003–2004)');
    assert.equal(await page.getByRole('button', { name: 'Open PCM Hammer · P01 / P59', exact: true }).isEnabled(), false);
    await page.getByRole('button', { name: 'Save vehicle project', exact: true }).click();
    await page.getByRole('button', { name: 'Airflow & fuel sizing', exact: true }).click();
    await page.getByRole('heading', { name: 'Airflow, turbo & injector sizing', exact: true }).waitFor();
    await page.getByLabel('Target crank horsepower', { exact: true }).fill('400');
    await page.getByText('75.0 lb/hour ·', { exact: false }).waitFor();
    await page.getByLabel('Full compressor blades', { exact: true }).fill('7');
    await page.screenshot({ path: path.join(output, 'installed-airflow.png'), fullPage: true });
    await page.getByRole('button', { name: 'CAN-H / CAN-L', exact: true }).click();
    await page.getByLabel('Import CAN voltage CSV', { exact: true }).setInputFiles({
      name: 'ci-synthetic-voltage.csv', mimeType: 'text/csv',
      buffer: Buffer.from('time_us,can_h_v,can_l_v\n0,2.5,2.5\n0.1,3.5,1.5\n0.2,3.5,1.5\n0.3,2.5,2.5'),
    });
    await page.getByText('4 measured samples.', { exact: false }).waitFor();
    await page.getByLabel('Import CAN frame CSV', { exact: true }).setInputFiles({
      name: 'ci-synthetic-frames.csv', mimeType: 'text/csv',
      buffer: Buffer.from('time_ms,can_id,data_hex\n0,123,AB\n10,123,CD\n35,123,00'),
    });
    await page.getByLabel('Module label 0x123', { exact: true }).fill('CI synthetic message source');
    await page.getByLabel('Expected period 0x123', { exact: true }).fill('10');
    await page.getByText('Recorded gap > 2× expected', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'installed-can.png'), fullPage: true });
    await page.getByRole('button', { name: 'OEM updates', exact: true }).click();
    await page.getByLabel('VIN / vehicle reference', { exact: true }).fill('CI-SYNTHETIC-VEHICLE');
    await page.getByLabel('Current calibration / ROM ID', { exact: true }).fill('TEST-A');
    await page.getByLabel('OEM-listed target ID (if verified)', { exact: true }).fill('TEST-B');
    await page.getByRole('button', { name: 'Save module record', exact: true }).click();
    await page.getByRole('cell', { name: 'Different IDs; applicability still needs OEM verification', exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'installed-oem.png'), fullPage: true });
    await page.getByRole('button', { name: 'Projects & programming', exact: true }).click();
    assert.equal(await page.getByLabel('Model year', { exact: true }).inputValue(), '2004');
    await page.getByRole('button', { name: 'DEF & emissions', exact: true }).click();
    await page.getByLabel('DEF / SCR dosing system requested configuration', { exact: true }).selectOption('Disable requested — definition / write support unavailable');
    await page.getByRole('button', { name: 'Save emissions worksheet', exact: true }).click();
    await page.getByText('Worksheet saved on this device. No DEF or emissions settings were written to a vehicle.', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'installed-emissions.png'), fullPage: true });
    await page.getByRole('button', { name: 'OEM updates', exact: true }).click();
    await page.getByRole('button', { name: 'DEF & emissions', exact: true }).click();
    assert.equal(await page.getByLabel('DEF / SCR dosing system requested configuration', { exact: true }).inputValue(), 'Disable requested — definition / write support unavailable');
    await assert.rejects(page.evaluate(() => window.jhDesktop.openOemPortal('file:///C:/Windows/system32/cmd.exe')), /Unknown OEM portal/);
    const images = await page.locator('img').evaluateAll(items => items.map(img => ({ src: img.src, loaded: img.complete && img.naturalWidth > 0 })));
    assert.ok(images.every(img => img.loaded), 'An application image failed to load');
    assert.deepEqual(errors, [], 'Renderer errors must be resolved');
    await fs.writeFile(path.join(output, 'launch.json'), JSON.stringify({ passed: true, runtime, discovery, images, consoleMessages }, null, 2));
  } catch (error) {
    await fs.writeFile(path.join(output, 'launch-error.json'), JSON.stringify({ error: error.stack, errors, consoleMessages }, null, 2));
    throw error;
  } finally {
    if (app) await app.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
