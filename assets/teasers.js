// Drawn artwork for photo posts: every function returns SVG markup for a 1080 x 820 art area.
// House colours match the Shorts: gold = the part to look at, teal = the helper, red = blocked / wrong.
const C = { line: '#dfe7f7', dim: '#8a97b8', fill: '#1c2744', fill2: '#263459', gold: '#FFC24B', teal: '#6FF5E4', red: '#FF5A4E', water: '#3fb6ff', ink: '#0a0f1e' };
const TAU = Math.PI * 2;
const f = n => n.toFixed(1);

// ---------- building blocks ----------
function gearPath(cx, cy, N, r, ph) {              // r = pitch radius; trapezoid teeth
  const m = 2 * r / N, ro = r + 0.95 * m, rr = r - 1.15 * m, p = TAU / N; let d = '';
  for (let k = 0; k < N; k++) {
    const a = ph + k * p, pts = [[rr, -0.27], [ro, -0.15], [ro, 0.15], [rr, 0.27]];
    for (const [rad, off] of pts) { const an = a + off * p; d += (d ? 'L' : 'M') + f(cx + rad * Math.cos(an)) + ' ' + f(cy + rad * Math.sin(an)); }
  }
  return d + 'Z';
}
function gear(cx, cy, N, r, ph, o = {}) {
  const col = o.color || C.fill2, hub = Math.max(10, r * 0.16), spokes = o.spokes ?? (r > 70 ? 5 : 0);
  let s = `<g class="gear" data-cx="${f(cx)}" data-cy="${f(cy)}" data-n="${N}">`;        // the website turns these groups
  s += `<path d="${gearPath(cx, cy, N, r, ph)}" fill="${col}" stroke="${o.stroke || C.line}" stroke-width="5" stroke-linejoin="round"/>`;
  if (spokes) for (let k = 0; k < spokes; k++) { const a = ph + k * TAU / spokes + 0.3;
    s += `<circle cx="${f(cx + r * 0.52 * Math.cos(a))}" cy="${f(cy + r * 0.52 * Math.sin(a))}" r="${f(r * 0.15)}" fill="${C.ink}" stroke="${o.stroke || C.line}" stroke-width="4" opacity=".9"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${f(hub)}" fill="${C.ink}" stroke="${o.stroke || C.line}" stroke-width="5"/>`;
  return s + '</g>';
}
// phase of gear 2 so its teeth sit in gear 1's gaps; a = direction from gear 1 to gear 2
function meshPhase(ph1, r1, N2, r2, a) { const p2 = TAU / N2; return a + Math.PI - (r1 / r2) * (ph1 - a) - p2 / 2; }
function tag(x, y, t, o = {}) {                     // round letter badge
  const r = o.r || 38, col = o.color || C.gold;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}" stroke="${col}" stroke-width="5"/><text x="${x}" y="${y + r * 0.36}" text-anchor="middle" font-size="${r * 1.05}" font-weight="700" fill="${col}">${t}</text>`;
}
function arcArrow(cx, cy, r, a0, a1, col = C.gold, w = 9) {     // angles in radians, screen coords (clockwise = increasing)
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const sweep = a1 > a0 ? 1 : 0, large = Math.abs(a1 - a0) > Math.PI ? 1 : 0, dir = a1 > a0 ? 1 : -1;
  const tx = -Math.sin(a1) * dir, ty = Math.cos(a1) * dir, nx = Math.cos(a1), ny = Math.sin(a1), h = w * 2.6;
  const tip = [x1 + tx * h * 0.9, y1 + ty * h * 0.9];
  return `<path d="M${f(x0)} ${f(y0)}A${r} ${r} 0 ${large} ${sweep} ${f(x1)} ${f(y1)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>` +
    `<path d="M${f(tip[0])} ${f(tip[1])}L${f(x1 + nx * h * 0.75)} ${f(y1 + ny * h * 0.75)}L${f(x1 - nx * h * 0.75)} ${f(y1 - ny * h * 0.75)}Z" fill="${col}"/>`;
}
function arrow(x0, y0, x1, y1, col = C.gold, w = 9) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, h = w * 2.6, bx = x1 - ux * h, by = y1 - uy * h;
  return `<path d="M${f(x0)} ${f(y0)}L${f(bx)} ${f(by)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="M${f(x1)} ${f(y1)}L${f(bx - uy * h * 0.7)} ${f(by + ux * h * 0.7)}L${f(bx + uy * h * 0.7)} ${f(by - ux * h * 0.7)}Z" fill="${col}"/>`;
}
const q = (x, y, s = 120, col = C.teal) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s}" font-weight="700" fill="${col}">?</text>`;
const txt = (x, y, t, s = 40, col = C.line, anchor = 'middle', wgt = 700) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${s}" font-weight="${wgt}" fill="${col}">${t}</text>`;
const weight = (x, y, w, h, label) => `<path d="M${x - w / 2 + 14} ${y}L${x + w / 2 - 14} ${y}L${x + w / 2} ${y + h}L${x - w / 2} ${y + h}Z" fill="${C.fill2}" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/><path d="M${x - 16} ${y}v-14a16 16 0 0 1 32 0v14" fill="none" stroke="${C.line}" stroke-width="5"/>${label ? txt(x, y + h * 0.66, label, Math.min(h * 0.42, w / (String(label).length * 0.66))) : ''}`;

// ---------- the drawings ----------
const ART = {
  // five gears in a row: A turns clockwise, which way does E turn?  (answer: clockwise, same as A)
  gearChain() {
    const spec = [[16, 96], [12, 72], [16, 96], [12, 72], [18, 108]], g = []; let x = 150, y = 430;
    spec.forEach(([N, r], i) => { if (i) { const a = (i % 2 ? -1 : 1) * 0.62, d = r + spec[i - 1][1]; x += d * Math.cos(a); y += d * Math.sin(a); } g.push([x, y, N, r]); });
    let ph = 0.1, s = '';
    g.forEach(([x, y, N, r], i) => {
      if (i) { const [px, py, , pr] = g[i - 1]; const a = Math.atan2(y - py, x - px); ph = meshPhase(ph, pr, N, r, a); }
      s += gear(x, y, N, r, ph, i === 0 ? { color: '#5a4416', stroke: C.gold } : i === 4 ? { color: '#17454a', stroke: C.teal } : {});
    });
    s += arcArrow(150, 430, 150, -2.9, -1.5, C.gold) + tag(150, 430, 'A', { r: 30 });
    'BCD'.split('').forEach((t, i) => { s += tag(g[i + 1][0], g[i + 1][1], t, { r: 26, color: C.line }); });
    s += tag(g[4][0], g[4][1], 'E', { r: 30, color: C.teal }) + q(g[4][0] + 40, g[4][1] - 190, 150);
    return s;
  },
  // three gears all touching each other: nothing can turn
  gearTriangle() {
    const R = 150, N = 20, cx = 540, cy = 430, d = R * 2 / Math.sqrt(3);
    const P = [[cx, cy - d], [cx - R, cy + d / 2], [cx + R, cy + d / 2]];
    let s = gear(P[0][0], P[0][1], N, R, Math.PI / 2 + TAU / N / 2, { color: '#5a4416', stroke: C.gold });
    s += gear(P[1][0], P[1][1], N, R, meshPhase(Math.PI / 2 + TAU / N / 2, R, N, R, Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0])));
    s += gear(P[2][0], P[2][1], N, R, meshPhase(Math.PI / 2 + TAU / N / 2, R, N, R, Math.atan2(P[2][1] - P[0][1], P[2][0] - P[0][0])), { color: '#17454a', stroke: C.teal });
    s += arcArrow(P[0][0], P[0][1], 205, -2.35, -0.8, C.gold) + tag(P[0][0], P[0][1], 'A') + tag(P[1][0], P[1][1], 'B', { color: C.line }) + tag(P[2][0], P[2][1], 'C', { color: C.teal });
    return s + q(960, 640, 150);
  },
  // big, medium, small: which spins fastest?
  gearSpeed() {
    const g = [[250, 420, 36, 216], [574, 420, 18, 108], [736, 420, 9, 54]]; let ph = 0, s = '';
    g.forEach(([x, y, N, r], i) => { if (i) ph = meshPhase(ph, g[i - 1][3], N, r, 0); s += gear(x, y, N, r, ph, i === 0 ? { color: '#5a4416', stroke: C.gold } : i === 2 ? { color: '#17454a', stroke: C.teal, spokes: 0 } : {}); });
    s += arcArrow(250, 420, 262, -2.2, -1.1, C.gold) + tag(250, 420, 'A') + tag(574, 420, 'B', { color: C.line }) + tag(736, 420, 'C', { r: 26, color: C.teal });
    s += txt(250, 730, '36 teeth', 38, C.dim) + txt(574, 730, '18 teeth', 38, C.dim) + txt(770, 730, '9 teeth', 38, C.dim);
    return s + q(940, 330, 150);
  },
  // rack - pinion - rack
  racks() {
    const N = 16, r = 128, cx = 540, cy = 410, m = 2 * r / N, p = Math.PI * m; let s = '';
    const rack = (y, dir, off) => { let d = `M60 ${y + dir * 70}L60 ${y}`; for (let x = 60 + off; x < 1020 - p * 0.6; x += p) d += `L${f(x)} ${y}L${f(x + p * 0.12)} ${f(y - dir * 2.1 * m)}L${f(x + p * 0.42)} ${f(y - dir * 2.1 * m)}L${f(x + p * 0.54)} ${y}`; return `<path d="${d}L1020 ${y}L1020 ${y + dir * 70}Z" fill="${C.fill2}" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>`; };
    // rack pitch line is 1 m beyond the tooth base line used above; place so pitch lines touch the gear's pitch circle
    const yTop = cy - r - 1.1 * m, yBot = cy + r + 1.1 * m;
    const ph = -Math.PI / 2;                                   // a tooth points straight up and straight down
    const offTop = ((cx - 60) % p) + p * 0.5 - p * 0.27, offBot = offTop;
    s += rack(yTop, -1, offTop - p * Math.floor(offTop / p)) + rack(yBot, 1, offBot - p * Math.floor(offBot / p));
    s += gear(cx, cy, N, r, ph, { color: '#5a4416', stroke: C.gold }) + arcArrow(cx, cy, 78, -2.6, 0.4, C.gold, 8);
    s += tag(160, yTop - 36, 'A', { r: 30, color: C.teal }) + tag(160, yBot + 36, 'B', { r: 30, color: C.teal });
    s += q(900, yTop - 16, 62) + q(900, yBot + 58, 62);
    return s;
  },
  // belts: A-B open, B-C crossed, C-D open
  belts() {
    const P = [[150, 420, 100], [400, 420, 60], [680, 420, 60], [930, 420, 100]]; let s = '';
    const open = (a, b) => { const [x0, y0, r0] = a, [x1, , r1] = b, k = Math.asin((r0 - r1) / (x1 - x0)), sx = Math.sin(k), cxk = Math.cos(k);
      return `<path d="M${f(x0 + r0 * sx)} ${f(y0 - r0 * cxk)}L${f(x1 + r1 * sx)} ${f(y0 - r1 * cxk)}M${f(x0 + r0 * sx)} ${f(y0 + r0 * cxk)}L${f(x1 + r1 * sx)} ${f(y0 + r1 * cxk)}" stroke="${C.line}" stroke-width="9" fill="none" stroke-linecap="round"/>`; };
    const cross = (a, b) => { const [x0, y0, r0] = a, [x1, , r1] = b, k = Math.asin((r0 + r1) / (x1 - x0)), sx = Math.sin(k), cxk = Math.cos(k);
      return `<path d="M${f(x0 + r0 * sx)} ${f(y0 - r0 * cxk)}L${f(x1 - r1 * sx)} ${f(y0 + r1 * cxk)}" stroke="${C.line}" stroke-width="9" stroke-linecap="round"/><path d="M${f(x0 + r0 * sx)} ${f(y0 + r0 * cxk)}L${f(x1 - r1 * sx)} ${f(y0 - r1 * cxk)}" stroke="${C.line}" stroke-width="9" stroke-linecap="round"/>`; };
    s += open(P[0], P[1]) + cross(P[1], P[2]) + open(P[2], P[3]);
    P.forEach(([x, y, r], i) => { const col = i === 0 ? C.gold : i === 3 ? C.teal : C.line;
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i === 0 ? '#5a4416' : i === 3 ? '#17454a' : C.fill2}" stroke="${col}" stroke-width="6"/><circle cx="${x}" cy="${y}" r="${r - 16}" fill="none" stroke="${col}" stroke-width="3" opacity=".5"/>` + tag(x, y, 'ABCD'[i], { r: 28, color: col }); });
    s += arcArrow(150, 420, 140, -2.4, -0.9, C.gold) + q(930, 250, 130);
    return s;
  },
  // which tank fills first?  (answer: 5)
  tanks() {
    let s = ''; const W = 6;
    const T = { 1: [60, 70], 2: [330, 250], 4: [640, 250], 3: [520, 560], 5: [850, 560] }, tw = 180, th = 180;
    const pipe = d => `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="34" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${C.ink}" stroke-width="22" stroke-linejoin="round"/>`;
    // pipes first (drawn under the tanks, then tank interiors re-open them where there is a real opening)
    s += pipe('M230 222L285 222L285 300L340 300');               // 1 -> 2 (enters high on 2's left wall)
    s += pipe('M500 300L650 300');                               // 2 -> 4 (upper outlet)
    s += pipe('M500 405L560 405L560 520L610 520L610 570');       // 2 -> 3 (lower outlet) ... sealed at tank 3
    s += pipe('M810 412L940 412L940 580');                       // 4 -> 5 (outlet at the very bottom of 4)
    for (const k in T) { const [x, y] = T[k];
      s += `<path d="M${x} ${y}L${x} ${y + th}L${x + tw} ${y + th}L${x + tw} ${y}" fill="${C.ink}" stroke="${C.line}" stroke-width="${W}" stroke-linejoin="round"/>`;
      s += txt(x + tw / 2, y + th / 2 + 26, k, 78, k === '5' || k === '3' ? C.line : C.line); }
    const open = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.ink}"/>`;
    s += open(226, 211, 8, 22) + open(336, 289, 8, 22) + open(496, 289, 8, 22) + open(646, 289, 8, 22) + open(496, 394, 8, 22) + open(806, 401, 8, 22);
    // tank 3: its top is CLOSED where the pipe arrives (a lid across), tank 5 is open and the pipe hangs into it
    s += `<path d="M520 560L700 560" stroke="${C.line}" stroke-width="${W}"/>`;
    // tap and water into tank 1
    s += `<path d="M110 0L110 30L170 30L170 52L196 52L196 0Z" fill="${C.fill2}" stroke="${C.line}" stroke-width="5"/>`;
    s += `<rect x="176" y="54" width="14" height="184" fill="${C.water}"/><path d="M63 250L63 228Q110 218 150 228T237 226L237 250Z" fill="${C.water}"/><rect x="63" y="${70 + th - 14}" width="174" height="11" fill="${C.water}"/>`;
    return s;
  },
  // fixed pulley vs movable pulley
  pulleys() {
    let s = `<rect x="60" y="60" width="960" height="26" rx="6" fill="${C.fill2}" stroke="${C.line}" stroke-width="5"/>`;
    const wheel = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.fill2}" stroke="${C.line}" stroke-width="6"/><circle cx="${x}" cy="${y}" r="9" fill="${C.line}"/>`;
    const rope = d => `<path d="${d}" fill="none" stroke="${C.gold}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
    // A: one fixed pulley. The load hangs on one side, you pull the other.
    s += `<path d="M270 86L270 200" stroke="${C.line}" stroke-width="6"/>` + rope('M210 560L210 200A60 60 0 0 1 330 200L330 470') + wheel(270, 200, 60);
    s += weight(210, 560, 130, 120, '100') + arrow(330, 480, 330, 610, C.teal, 11) + tag(270, 760, 'A', { color: C.gold });
    // B: rope tied to the beam, down round a pulley that carries the load, up over a fixed pulley, down to the pulling side.
    s += `<path d="M780 86L780 170" stroke="${C.line}" stroke-width="6"/>` + rope('M610 86L610 440A55 55 0 0 0 720 440L720 170A60 60 0 0 1 840 170L840 470');
    s += wheel(780, 170, 60) + wheel(665, 440, 55) + `<path d="M665 440L665 560" stroke="${C.line}" stroke-width="6"/>`;
    s += weight(665, 560, 130, 120, '100') + arrow(840, 480, 840, 610, C.teal, 11) + tag(725, 760, 'B', { color: C.gold });
    return s;
  },
  // 100 kg on four strands
  blockTackle() {
    let s = `<rect x="240" y="50" width="600" height="26" rx="6" fill="${C.fill2}" stroke="${C.line}" stroke-width="5"/>`;
    const wheel = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.fill2}" stroke="${C.line}" stroke-width="6"/><circle cx="${x}" cy="${y}" r="8" fill="${C.line}"/>`;
    const rope = d => `<path d="${d}" fill="none" stroke="${C.gold}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
    // rope: tied to the beam, under lower wheel 1, over upper wheel 1, under lower wheel 2, over upper wheel 2, down to the pull.
    // Four strands (x = 350, 450, 550, 650) hold the lower block.
    s += `<path d="M500 76L500 170M700 76L700 170" stroke="${C.line}" stroke-width="6"/>`;
    s += rope('M350 76L350 470A50 50 0 0 0 450 470L450 170A50 50 0 0 1 550 170L550 470A50 50 0 0 0 650 470L650 170A50 50 0 0 1 750 170L750 400');
    s += wheel(500, 170, 50) + wheel(700, 170, 50) + wheel(400, 470, 50) + wheel(600, 470, 50);
    s += `<path d="M400 470L400 560L600 560L600 470M500 560L500 610" fill="none" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>`;
    s += weight(500, 610, 200, 150, '100 kg') + arrow(750, 410, 750, 550, C.teal, 11) + q(860, 540, 130);
    return s;
  },
  // seesaw: 3 blocks at distance 2, 2 blocks at distance 3 -> balanced
  seesaw() {
    let s = `<path d="M540 470L470 620L610 620Z" fill="${C.fill2}" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/><path d="M120 620L960 620" stroke="${C.dim}" stroke-width="5"/>`;
    s += `<rect x="90" y="440" width="900" height="30" rx="8" fill="#5a4416" stroke="${C.gold}" stroke-width="5"/>`;
    for (let k = -3; k <= 3; k++) { const x = 540 + k * 135; s += `<path d="M${x} 440L${x} 470" stroke="${C.gold}" stroke-width="4"/>` + (k ? txt(x, 520, Math.abs(k), 34, C.dim) : ''); }
    const block = (x, y) => `<rect x="${x - 42}" y="${y}" width="84" height="64" rx="8" fill="${C.fill2}" stroke="${C.line}" stroke-width="5"/>`;
    s += block(270, 376) + block(270, 312) + block(270, 248) + block(945, 376) + block(945, 312);
    s += tag(270, 170, 'A', { color: C.teal }) + tag(945, 235, 'B', { color: C.teal });
    return s + q(540, 330, 140);
  },
  // three vessels joined at the bottom
  vessels() {
    let s = `<path d="M110 120L110 660L970 660L970 250L900 250L900 590L620 590L700 150L470 150L550 590L330 590L330 120Z" fill="${C.ink}"/>`;
    s += `<path d="M113 612L967 612L967 657L113 657Z" fill="${C.water}" opacity=".88"/><rect x="212" y="0" width="16" height="614" fill="${C.water}" opacity=".88"/>`;
    for (const d of ['M110 120L110 660L970 660L970 250', 'M900 250L900 590L620 590L700 150', 'M470 150L550 590L330 590L330 120'])
      s += `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += tag(220, 760, 'A', { color: C.gold }) + tag(585, 760, 'B', { color: C.gold }) + tag(935, 760, 'C', { color: C.gold });
    return s;
  },
  // dashboard fuel gauge: the small arrow beside the pump symbol
  fuelGauge() {
    const cx = 540, cy = 470, R = 330; let s = `<circle cx="${cx}" cy="${cy}" r="${R + 40}" fill="${C.ink}" stroke="${C.line}" stroke-width="7"/>`;
    for (let k = 0; k <= 8; k++) { const a = Math.PI * (1.12 + 0.76 * k / 8), big = k % 2 === 0;
      s += `<path d="M${f(cx + (R - (big ? 46 : 26)) * Math.cos(a))} ${f(cy + (R - (big ? 46 : 26)) * Math.sin(a))}L${f(cx + R * Math.cos(a))} ${f(cy + R * Math.sin(a))}" stroke="${k < 2 ? C.red : C.line}" stroke-width="${big ? 9 : 5}" stroke-linecap="round"/>`; }
    s += txt(cx - 250, cy - 20, 'E', 64, C.red) + txt(cx + 250, cy - 20, 'F', 64, C.line);
    const na = Math.PI * 1.62; s += `<path d="M${cx} ${cy}L${f(cx + 250 * Math.cos(na))} ${f(cy + 250 * Math.sin(na))}" stroke="${C.red}" stroke-width="10" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="22" fill="${C.fill2}" stroke="${C.line}" stroke-width="5"/>`;
    // pump symbol
    const px = cx - 20, py = cy + 110;
    s += `<rect x="${px - 44}" y="${py}" width="88" height="130" rx="10" fill="none" stroke="${C.line}" stroke-width="8"/><rect x="${px - 26}" y="${py + 18}" width="52" height="38" rx="4" fill="${C.line}"/><path d="M${px - 60} ${py + 130}L${px + 60} ${py + 130}" stroke="${C.line}" stroke-width="8" stroke-linecap="round"/>`;
    s += `<path d="M${px + 44} ${py + 40}L${px + 70} ${py + 40}L${px + 70} ${py + 96}A14 14 0 0 0 ${px + 98} ${py + 96}L${px + 98} ${py + 34}L${px + 76} ${py + 8}" fill="none" stroke="${C.line}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;
    // the arrow
    s += `<path d="M${px + 150} ${py + 30}L${px + 196} ${py + 64}L${px + 150} ${py + 98}Z" fill="${C.gold}"/><circle cx="${px + 168}" cy="${py + 64}" r="62" fill="none" stroke="${C.gold}" stroke-width="5" stroke-dasharray="12 10"/>`;
    return s;
  },
  // keyboard home row: the bumps on F and J
  keysFJ() {
    let s = ''; const keys = 'DFGHJK'.split(''), w = 150, gap = 22, x0 = 540 - (6 * w + 5 * gap) / 2, y = 250;
    keys.forEach((k, i) => { const x = x0 + i * (w + gap), hot = k === 'F' || k === 'J', col = hot ? C.gold : C.line;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="22" fill="${hot ? '#5a4416' : C.fill2}" stroke="${col}" stroke-width="6"/><rect x="${x + 14}" y="${y + 10}" width="${w - 28}" height="${w - 36}" rx="16" fill="none" stroke="${col}" stroke-width="3" opacity=".45"/>` + txt(x + w / 2, y + 88, k, 76, col);
      if (hot) s += `<rect x="${x + w / 2 - 26}" y="${y + 112}" width="52" height="9" rx="4.5" fill="${C.teal}"/><circle cx="${x + w / 2}" cy="${y + 116}" r="44" fill="none" stroke="${C.teal}" stroke-width="4" stroke-dasharray="10 9"/>`; });
    // row above and below, faint, for context
    for (const [yy, off, n] of [[y - w - gap, -40, 7], [y + w + gap, 50, 6]]) for (let i = 0; i < n; i++) s += `<rect x="${x0 + off + i * (w + gap)}" y="${yy}" width="${w}" height="${w}" rx="22" fill="none" stroke="${C.dim}" stroke-width="4" opacity=".35"/>`;
    return s;
  },
  // microwave door mesh
  microwave() {
    let s = `<rect x="90" y="110" width="900" height="560" rx="34" fill="${C.fill2}" stroke="${C.line}" stroke-width="7"/><rect x="140" y="160" width="610" height="460" rx="20" fill="${C.ink}" stroke="${C.line}" stroke-width="6"/>`;
    for (let r = 0; r < 14; r++) for (let c = 0; c < 19; c++) s += `<circle cx="${172 + c * 30.5 + (r % 2 ? 15 : 0)}" cy="${190 + r * 30.8}" r="6.5" fill="${C.fill2}" opacity=".95"/>`;
    s += `<rect x="790" y="170" width="160" height="80" rx="10" fill="${C.ink}" stroke="${C.line}" stroke-width="4"/>` + txt(870, 226, '2:00', 46, C.teal);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) s += `<rect x="${794 + c * 56}" y="${290 + r * 56}" width="42" height="42" rx="8" fill="none" stroke="${C.line}" stroke-width="4"/>`;
    s += `<rect x="794" y="480" width="154" height="120" rx="14" fill="none" stroke="${C.line}" stroke-width="4"/>`;
    let d = 'M170 390'; for (let x = 0; x <= 560; x += 8) d += `L${170 + x} ${f(390 - 120 * Math.sin(x / 560 * TAU * 1.5))}`;
    s += `<path d="${d}" fill="none" stroke="${C.gold}" stroke-width="10" stroke-linecap="round"/>`;
    s += `<path d="M170 720L543 720" stroke="${C.gold}" stroke-width="5"/><path d="M170 700L170 740M543 700L543 740" stroke="${C.gold}" stroke-width="5"/>` + txt(356, 790, 'one wave: about 12 cm', 40, C.gold);
    s += `<circle cx="660.5" cy="467.2" r="34" fill="none" stroke="${C.teal}" stroke-width="5"/><path d="M688 490L770 720" stroke="${C.teal}" stroke-width="4"/>` + txt(820, 790, 'one hole: 1 to 2 mm', 40, C.teal);
    return s;
  },
  // the "black box" is orange
  blackBox() {
    const O = '#FF7A1A', O2 = '#c9540a';
    let s = `<path d="M150 380L930 380L930 690L150 690Z" fill="${O}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><path d="M150 380L250 300L1010 300L930 380Z" fill="#ff9a4d" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><path d="M930 380L1010 300L1010 610L930 690Z" fill="${O2}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
    s += `<path d="M330 340L330 180A90 34 0 0 1 510 180L510 340A90 34 0 0 1 330 340Z" fill="${O}" stroke="${C.ink}" stroke-width="6"/><ellipse cx="420" cy="180" rx="90" ry="34" fill="#ff9a4d" stroke="${C.ink}" stroke-width="6"/>`;
    for (const x of [230, 800]) s += `<path d="M${x} 380L${x + 70} 380L${x + 70} 690L${x} 690Z" fill="#f4f6fb" stroke="${C.ink}" stroke-width="5"/>`;
    s += txt(540, 520, 'FLIGHT RECORDER', 50, C.ink) + txt(540, 590, 'DO NOT OPEN', 50, C.ink);
    s += `<ellipse cx="540" cy="740" rx="430" ry="26" fill="#000" opacity=".35"/>`;
    return s;
  },
  // toothpaste tube and the coloured square on its seal
  toothpaste() {
    let s = `<path d="M250 250L830 300L830 520L250 570Z" fill="#eef2fb" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><path d="M250 250L250 570L190 548L190 272Z" fill="#cfd8ea" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
    s += `<rect x="96" y="330" width="96" height="160" rx="12" fill="${C.water}" stroke="${C.ink}" stroke-width="6"/>`; for (let k = 0; k < 6; k++) s += `<path d="M${108 + k * 14} 334L${108 + k * 14} 486" stroke="${C.ink}" stroke-width="3" opacity=".5"/>`;
    s += `<path d="M830 286L910 286L910 534L830 534Z" fill="#dfe6f5" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`; for (let k = 0; k < 9; k++) s += `<path d="M836 ${306 + k * 26}L904 ${306 + k * 26}" stroke="${C.ink}" stroke-width="3" opacity=".4"/>`;
    s += `<rect x="846" y="456" width="48" height="60" fill="#18a558" stroke="${C.ink}" stroke-width="4"/><circle cx="870" cy="486" r="78" fill="none" stroke="${C.gold}" stroke-width="6" stroke-dasharray="14 11"/>`;
    s += `<path d="M300 330Q520 300 760 356L760 468Q520 428 300 492Z" fill="${C.water}" opacity=".85"/><path d="M300 372Q520 342 760 398" fill="none" stroke="#fff" stroke-width="10" opacity=".9"/>`;
    const sq = (x, col) => `<rect x="${x}" y="660" width="70" height="70" rx="6" fill="${col}" stroke="${C.line}" stroke-width="4"/>`;
    s += sq(330, '#18a558') + sq(450, '#2b6cff') + sq(570, '#e23b3b') + sq(690, '#111');
    return s;
  },
};
if (typeof module !== 'undefined') module.exports = { ART, C };
