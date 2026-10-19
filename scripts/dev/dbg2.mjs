import { chromium } from 'playwright';
import { createServer } from '/home/user/Claude-animations/scripts/serve.js';
const server = createServer(); await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForFunction(() => window.__animReady === true);
console.log(await page.evaluate(() => {
  __anim.seek(0);
  const s = __dbg.scene; const out = { children: s.children.map(c => [c.name, c.visible, c.children.length]), info: JSON.stringify(__dbg.renderer.info.render), gl: !!__dbg.renderer.getContext() };
  const sg = s.getObjectByName('scene_surface'); let meshes = 0, vis = 0; sg.traverse(o => { if (o.isMesh) { meshes++; let v = o.visible; o.traverseAncestors(a => { if (!a.visible) v = false; }); if (v) vis++; } });
  out.meshes = meshes; out.vis = vis;
  const a = sg.getObjectByName('astronaut'); out.astro = a ? [a.visible, a.userData.kind, a.position.toArray()] : null;
  return out;
}));
await browser.close(); server.close();
