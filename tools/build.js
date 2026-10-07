// node tools/build.js [slug ...]    (the site shows pictures and text only: no videos are copied)
// Builds the site's assets from the Shorts studio next door (../how-it-works-shorts) and writes the catalogue into index.html.
//   assets/posters/<slug>-a.jpg      the object, solid (opening frame, no caption)             540 x 675
//   assets/posters/<slug>-b.jpg      the same object seen through (a frame from the middle)     720 x 900
//   assets/lens/<slug>-a.jpg, -b.jpg matched pair for the hero lens: same camera, solid and see-through, 900 x 1125
// A new Short appears once it has a meta.json and a file in the studio's FINAL/ folder. XRAY picks the moment (percent of
// the Short's length) that shows the inside best; without an entry the middle of the Short is used.
const path = require('path'), fs = require('fs'), http = require('http');
const { execFileSync } = require('child_process');
const SITE = path.join(__dirname, '..'), STUDIO = path.join(SITE, '..', 'how-it-works-shorts');
const { chromium } = require(path.join(STUDIO, 'node_modules', 'playwright-core'));
const args = process.argv.slice(2), dataOnly = args.includes('--data-only'), only = args.filter(a => !a.startsWith('--'));

const XRAY = { lock: 34, jack: 34, speaker: 22, seatbelt: 46, door: 46, windows: 70, bike: 34, elevator: 46, combo: 46, clock: 58, zipper: 46, pen: 46,
  kettle: 58, sprinkler: 34, tape: 58, musicbox: 46, switch: 46, escalator: 34, valve: 34, stapler: 70, pencil: 58, can: 46, nozzle: 58,
  trainwheels: 34, lighter: 70, ballpoint: 46, coincheck: 46, sawbrake: 58, sewing: 58,
  points: 66, teapot: 61, glowstick: 82, starter: 69, greedycup: 72, engine: 85, windows2: 70,
  coupler: 53, differential: 52, stylus: 47, ratchet: 45, torquewrench: 36, doorcloser: 35 };
const ANSWERS = JSON.parse(fs.readFileSync(path.join(__dirname, 'answers.json')));
const SKIP = fs.existsSync(path.join(STUDIO, 'FINAL', 'windows2-reel-9x16.mp4')) ? ['windows'] : ['windows2'];   // one card for the airplane window: the corrected Short once it exists
// hero lens: [slug, label, time while still solid (its camera is used for both pictures), time just after it has gone see-through]
const LENS = [['lock', 'Door lock', 2.5, 3.5], ['combo', 'Combination lock', 2.85, 3.6], ['kettle', 'Kettle', 2.4, 3.35], ['stapler', 'Stapler', 2.55, 3.45]];

const FACTS = ['04-tape-hook', '30-fuel-arrow', '06-sprinkler', '31-fj-bumps', '09-lighter', '33-microwave-mesh', '01-elevator', '34-black-box', '12-can-tab', '32-tape-slot', '22-kettle', '27-train-wheels'];

const shorts = fs.readdirSync(path.join(STUDIO, 'videos')).map(slug => {
  const m = path.join(STUDIO, 'videos', slug, 'meta.json'), v = path.join(STUDIO, 'FINAL', `${slug}-reel-9x16.mp4`);
  if (!fs.existsSync(m) || !fs.existsSync(v) || SKIP.includes(slug)) return null;
  const meta = JSON.parse(fs.readFileSync(m));
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v]).toString().trim();
  if (!ANSWERS[slug]) throw new Error('no answer text for ' + slug + ' in tools/answers.json');
  return { slug, order: meta.order, name: meta.mech.replace(' (corrected)', ''), q: meta.hook, a: ANSWERS[slug], dur: Math.round(dur * 10) / 10 };
}).filter(Boolean).sort((a, b) => a.order - b.order);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
(async () => {
  for (const d of ['posters', 'lens']) fs.mkdirSync(path.join(SITE, 'assets', d), { recursive: true });
  const srv = http.createServer((req, res) => { const file = path.normalize(path.join(STUDIO, decodeURIComponent(req.url.split('?')[0])));
    fs.readFile(file, (e, buf) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(buf); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const br = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server', '--ignore-gpu-blocklist', '--force-color-profile=srgb', '--hide-scrollbars', '--use-gl=angle', '--use-angle=metal', '--enable-webgl'] });
  const open = async slug => { const page = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${srv.address().port}/index.html?v=${slug}`);
    await page.waitForFunction(() => window.ready === true || window.loadError, null, { timeout: 60000 });
    await page.evaluate(() => setup('reel')); return page; };
  // one frame: camera of time tCam, object state of time tObj, cropped to the top 4:5 and scaled to w
  const shot = (page, tCam, tObj, w, file) => page.evaluate(([tCam, tObj, w]) => {
    const st = window.__studio.state(); renderFrame(tCam); st.S.update(tObj, st.ctx); st.renderer.render(st.scene, st.camera);
    const c = document.createElement('canvas'); c.width = w; c.height = w * 1.25; c.getContext('2d').drawImage(st.renderer.domElement, 0, 40, 1080, 1350, 0, 0, w, w * 1.25);
    return c.toDataURL('image/jpeg', 0.84);
  }, [tCam, tObj, w]).then(d => fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64')));
  for (const s of shorts) {
    if (dataOnly || (only.length && !only.includes(s.slug))) continue;
    const a = path.join(SITE, 'assets', 'posters', `${s.slug}-a.jpg`), b = path.join(SITE, 'assets', 'posters', `${s.slug}-b.jpg`);
    const page = await open(s.slug), tA = s.dur * 0.04, tB = s.dur * (XRAY[s.slug] || 50) / 100;
    await shot(page, tA, tA, 540, a); await shot(page, tB, tB, 720, b);
    const L = LENS.find(l => l[0] === s.slug);
    if (L) { await shot(page, L[2], L[2], 900, path.join(SITE, 'assets', 'lens', `${s.slug}-a.jpg`)); await shot(page, L[2], L[3], 900, path.join(SITE, 'assets', 'lens', `${s.slug}-b.jpg`)); }
    await page.close();
    console.log(s.slug);
  }
  await br.close(); srv.close();
  // brand files, the puzzle drawings and the fact cards come straight from the studio
  const cp = (from, to) => fs.copyFileSync(path.join(STUDIO, from), path.join(SITE, 'assets', to));
  for (const d of ['fonts', 'facts']) fs.mkdirSync(path.join(SITE, 'assets', d), { recursive: true });
  cp('fonts/quicksand.woff2', 'fonts/quicksand.woff2'); cp('brand/out/mark.svg', 'mark.svg'); cp('posts/art.js', 'teasers.js');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(STUDIO, 'brand/out/cover.png'), '-vf', 'scale=1200:-2,crop=1200:630', path.join(SITE, 'assets', 'og.png')]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(STUDIO, 'brand/out/profile.png'), '-vf', 'scale=180:180', path.join(SITE, 'assets', 'apple-touch-icon.png')]);
  for (const f of FACTS) execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(STUDIO, 'posts/out', f + '.jpg'), '-vf', 'scale=720:900:flags=lanczos', '-q:v', '4', path.join(SITE, 'assets', 'facts', f + '.jpg')]);
  const data = { shorts: shorts.map(({ dur, ...r }) => r), lens: LENS.map(([slug, label]) => ({ slug, label })) };
  const file = path.join(SITE, 'index.html');
  if (fs.existsSync(file)) { const html = fs.readFileSync(file, 'utf8'), i = html.indexOf('/*DATA*/'), j = html.indexOf('/*END*/');
    if (i > 0 && j > i) fs.writeFileSync(file, html.slice(0, i) + '/*DATA*/' + JSON.stringify(data) + html.slice(j)); }
  fs.writeFileSync(path.join(SITE, 'assets', 'shorts.json'), JSON.stringify(data, null, 1));
  console.log(shorts.length, 'Shorts in the catalogue');
})();
