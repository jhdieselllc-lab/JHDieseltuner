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
