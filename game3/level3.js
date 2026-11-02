/* Zacky's Lava Quest, level 3 (lava chase). Loaded after the main script in index.html, so it shares its globals
   (stage, showScreen, keys, sfx, playMusic, L3_CFG ...). All coordinates are 1920x1080 stage pixels. */
const L3_BG_VP = { x: 968, y: 344 };     // the vanishing point of the path in volcano_chase_bg_v2.jpg (crater at 966,281)
const L3_VP = { x: 960 + (L3_BG_VP.x - 960) * 1.03, y: 540 + (L3_BG_VP.y - 540) * 1.03 };   // the backdrop is drawn at scale 1.03 (so the bob never shows an edge), so the vanishing point on the stage is here
const L3_FOOT = 1000;                    // where Zacky's feet are (he never moves up or down)
const L3_SZ = (L3_FOOT - L3_VP.y) / (1080 - L3_VP.y);   // perspective scale (0 at the vanishing point, 1 at the bottom edge) at Zacky's feet
const L3_SC = 0.537;                     // Zacky's run frames are 140x350 but about half the scale of Zacky_stand (about 188px of him on the stage)
const L3_FRAMES = { run: ['Zacky_run_front_1.png', 'Zacky_run_front_2.png', 'Zacky_run_front_3.png', 'Zacky_run_front_4.png'], jump: 'Zacky_jump_front.png', stumble: 'Zacky_stumble_front.png' };
const L3_SIZE = { run: [140, 350], jump: [218, 321], stumble: [238, 343] };
const L3_RUN_FRAME_MS = 110;
const L3_SLIDE_MS = 150;                 // a lane change takes this long
const L3_TRAVEL = L3_CFG.itemVisibleS;   // seconds of running an item is visible for, from the vanishing point to Zacky (set in the L3_CFG block in index.html)
const L3_PERSP = 1.8;                    // how fast things grow as they come closer
const L3_ITEM = { g: { src: 'gem.png', w: 68, h: 80, sc: 1.7, lift: 34 }, R: { src: 'lava_rock.png', w: 300, h: 266, sc: 0.8, lift: 133, spin: true } };   // R sits on its centre (lift = half its height) so it can spin
/* The fixed, hand-written item list: [slot, lane, type]; slot * spawnGapMs is the moment the item reaches Zacky. g = gem, R = lava rock (dodge it with the arrows, or jump right over it).
   Lanes 0, 1, 2 = left, middle, right. Every run has exactly this layout; there is nothing random in level 3. Every rock row leaves at least one free lane, and rock rows are at least 1.5s apart. */
const L3_LIST = [
  [4, 1, 'g'], [6, 1, 'g'], [8, 1, 'g'],              // three gems straight ahead: the first one reaches him at 2.0s, a free start (every slot moved one on when items became visible for 2.5s, so nothing starts mid-path)
  [13, 1, 'R'],                                        // the first rock, in the middle lane at 6.5s (the dodge hint shows just before it)
  [17, 0, 'g'], [19, 0, 'g'],
  [22, 2, 'R'],                                        // a rock off to the side
  [25, 0, 'R'], [25, 1, 'R'],                          // two rocks side by side: the right lane is free
  [29, 2, 'g'], [31, 2, 'g'], [33, 2, 'g'],
  [37, 1, 'R'],
  [40, 0, 'R'], [40, 2, 'R'],                          // the middle lane is free
  [43, 1, 'g'], [45, 1, 'g'],
  [48, 2, 'R'],
  [51, 1, 'R'], [51, 2, 'R'],                          // the left lane is free
  [54, 0, 'g'], [56, 0, 'g'],
  [59, 1, 'R'], [62, 0, 'R'], [62, 1, 'R']             // the last rocks (30.0s and 31.5s, the right lane free at the end), then the donut
];
const L3_JUMP_CLEAR = 0.3;               // a rock is cleared while the jump is above this fraction of its peak (about 80% of the jump)
const L3_JUMP_PEAK = 190;                // px a jump rises
const L3_HIT_WIN = 0.13;                 // a rock counts while it is within this many run seconds of Zacky
const L3_GEM_WIN = 0.22;                 // a gem is picked up within this many run seconds (even in the air)
const L3_STUMBLE_S = 0.55;               // the stumble pose lasts this long (he never stops running)
const L3_WAVE_MAX = 440;                 // px of the lava wave showing when it has caught up (1.0)
const L3_BOUNCE_S = 1.3;                 // the soft bounce back to the checkpoint takes this long
const L3_CAR = { w: 600, h: 553, base: 545, seatX: 270, seatY: 235, cs: 0.9, bottom: 985, hopS: 0.7, waitS: 0.4 };   // car_front_empty.png / Zacky_in_car_front.png (same 600x553 canvas): where it parks, and the seat Zacky lands on
const L3_CAR_EMPTY = 'car_front_empty.png', L3_CAR_FULL = 'Zacky_in_car_front.png', L3_CAR_OLD = 'zacky_car.png';
const L3_HINT_LEAD = 1.9;                // the dodge hint shows this many run seconds before the first rock
const L3_FLASH_MAX = 0.35;               // the soft orange flash on a catch never goes above this opacity (and is off in reduced motion)
const L3_INVULN_S = 3.0;                 // after a bounce nothing trips him for this long (gems still count)
const L3_TRIP_GUARD_S = 0.5;             // after a trip a second trip is blocked for this long, so mashing into two logs cannot double-trip
/* Receding scenery: roadside props and path dashes enter big at the screen edge beside Zacky and shrink towards the volcano, the same perspective maths run in reverse (u goes from L3_SCEN_U0 down to 0). */
const L3_PROPS = [{ src: 'tree_side.png', w: 153, h: 600, sc: 1.0 }, { src: 'rock_side.png', w: 417, h: 420, sc: 0.75 }, { src: 'post_side.png', w: 146, h: 560, sc: 0.9 }, { src: 'bush_side.png', w: 442, h: 380, sc: 0.8 },
  { src: 'boulder_big.png', w: 578, h: 600, sc: 0.55 }, { src: 'rock_cluster.png', w: 429, h: 420, sc: 0.72 }, { src: 'charred_tree_2.png', w: 321, h: 650, sc: 0.9 }, { src: 'stump.png', w: 552, h: 400, sc: 0.5 },
  { src: 'lava_vent.png', w: 315, h: 420, sc: 0.8 }, { src: 'crystal_rocks.png', w: 367, h: 500, sc: 0.7 }, { src: 'fence_post_2.png', w: 216, h: 560, sc: 0.9 }];
const L3_GROUND = [{ src: 'ground_crack_1.png', w: 300, h: 80, sc: 1, haze: true }, { src: 'ground_crack_2.png', w: 300, h: 80, sc: 1, haze: true }, { src: 'pebbles.png', w: 300, h: 80, sc: 1, haze: true }];   // flat decals on the off-road ground
const L3_RIDGE = { w: 2400, h: 300, sc: 0.3, inner: 800 };   // ridge strips: drawn at 0.3x, and clipped (with a soft edge) so the left one stops at x 800 and the right one starts at 1120, well clear of the volcano and its smoke
const L3_SCEN_U0 = 1.12;                          // where a prop starts: a little below the bottom edge (u 1 = the bottom edge)
const L3_DASH = { src: 'path_dash.png', w: 200, h: 60, sc: 0.9 };
const chaseMusic = document.getElementById('chaseMusic');
const z3 = document.getElementById('z3'), z3img = document.getElementById('z3img'), l3bg = document.getElementById('l3bg'), l3lines = document.getElementById('l3lines');
const hud3 = ZackyShared.gemHud(document.getElementById('hud3'), L3_LIST.filter(function (r) { return r[2] === 'g'; }).length, 'gem.png');
const wave3 = document.getElementById('wave3'), flash3 = document.getElementById('flash3'), whoops3 = document.getElementById('whoops3');
const world3 = document.getElementById('world3');
const hint3 = document.getElementById('hint3');
const scen3 = { props: [], dashes: [] };
const launch3El = document.getElementById('launch3'), rockLaunchSfx = document.getElementById('rockLaunchSfx'), rockRollSfx = document.getElementById('rockRollSfx');
const L3_CRATER = { x: 960 + (966 - 960) * 1.03, y: 540 + (281 - 540) * 1.03 };   // the crater on the stage (the backdrop is drawn at 1.03)
const L3_ROCK_APPEAR = 0.03;                      // a rock shows up at the vanishing point when d passes this
const L3_DECO_GAP = 2.2, L3_DECO_END = 33;        // small decorative rocks the volcano throws now and then, off to the sides, until the end run

const scenEl3 = document.getElementById('scen3');
const hints3 = { dodge: 0, donut: 0 };                               // 0 = not shown yet, 1 = showing, 2 = done (the hint shows once and then never again)
const ready3 = document.getElementById('ready3'), car3 = document.getElementById('car3'), car3img = document.getElementById('car3img'), glow3 = document.getElementById('glow3'), rumbleSfx = document.getElementById('rumbleSfx'), cheerSfx = document.getElementById('cheerSfx');
const l3Calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const state3 = { phase: 'ready', clock: 0, lane: 1, laneX: 0, pose: 'run', slideFrom: 0, slideT: 1, T: 0, items: [], gems: 0, trips: 0, jumpT: -1, stumbleT: -1, lava: 0, caughtT: 0, caughtFrom: 0, caughtTo: 0, hop: 0, scen: 0, invuln: 0, tripGuard: 0, catches: 0, fin: 0, lastHop: 0, glowT: 0, boostK: 1, boostT: 0, boostE: 0, zoomT: 0, spkT: 0, donut: null, eruptT: 9, glowE: 0, eruptBig: false, shakeX: 0, shakeY: 0, smoke: [], launches: [] };    // ready (still screen, waiting for Enter) -> run -> finish

function item3Lane(l) { return Math.max(0, Math.min(L3_CFG.laneCount - 1, l + Math.round((L3_CFG.laneCount - 3) / 2))); }   // the list's 3 lanes sit in the middle of the lanes
function item3At(it) { return it.slot * L3_CFG.spawnGapMs / 1000; }               // the moment (run seconds) the item reaches Zacky
function item3Pos(it, T) {                                                         // where an item is at run time T: d runs 0 (vanishing point) to 1 (at Zacky), then on past him
  var d = 1 - (item3At(it) - T) / L3_TRAVEL, sc = L3_SZ * Math.pow(Math.max(d, 0), L3_PERSP);
  return { d: d, s: sc, x: lane3XAt(it.lane, sc), y: L3_VP.y + (1080 - L3_VP.y) * sc };
}
function scen3Life() { return L3_SCEN_U0 * L3_TRAVEL / L3_CFG.sceneryFactor; }    // seconds a prop takes from the bottom edge to the volcano
function scen3Pos(u, ground) { var s = Math.pow(Math.max(u, 0), L3_PERSP); return { s: s, x: L3_VP.x + ground * s, y: L3_VP.y + (1080 - L3_VP.y) * s }; }
function scen3Mod(k, n) { return ((k % n) + n) % n; }
function scen3Make(t, cls, parent) {
  var el = document.createElement('div'), im = document.createElement('img');
  el.className = 'sp ' + cls; im.alt = ''; el.appendChild(im); scenEl3.appendChild(el);
  return { el: el, img: im, k: null, shown: false, t: t, stamp: -1 };
}
/* Roadside props come in clusters: a cluster is clusterMin..clusterMax mixed props close together, then a small gap, then the next cluster.
   Everything is a pure function of the cluster number (a hash), so there is no Math.random per frame and a prop never changes while it is on screen.
   Each side has one stream per depth row; a stream owns a fixed pool of elements that are reused as clusters recede and are replaced. */
const L3_ROWS = [{ g: 1150, spread: 150, sc: 1.0 }, { g: 1550, spread: 250, sc: 0.95 }, { g: 2150, spread: 350, sc: 0.9 }];
/* The road's sand edge in ground px from the middle of the road (measured from screenshots: left 1054, right 1016). Nothing on the off-road ground is placed closer than L3_CFG.edgeClearPx to it. */
const L3_EDGE = { '-1': 1355, '1': 1366 };       // where the sand really ends, ground px from the road centre, measured on volcano_chase_bg_v2.jpg (dev/realedge.py: plain starts at 1353 left and 1366 right; the dark fringe starts about 1330)
function scen3Clear(side, half) { return L3_EDGE[side] + L3_CFG.edgeClearPx + half; }       // the nearest a picture of half-width `half` (ground px) may sit, centre to the middle of the road
/* Fill rows (L3_CFG.groundFill > 0): they use pictures that already exist and fill the bare purple plain. 'gap' is a row of props at about 1800 ground px between the middle and far rows,
   'horizon' a dense strip of small hazy props low under the horizon (far to the side, they only come on screen near the vanishing point), 'ground' / 'ground2' are the ground texture:
   the existing cracks and pebbles decals, scattered thickly over the whole plain at two depths. uTop = the highest u a row is drawn at (the far rows start well down the road, where they enter from the side of the screen). */
const L3_FILL = [
  { name: 'horizon', kind: 'prop', g: 4200, spread: 5000, sc: 0.6, rank: 'back', hid: 6, cl: [3, 5], inner: 0.1, gapS: 0.12, uTop: 0.6 },
  { name: 'gap', kind: 'prop', g: 1800, spread: 450, sc: 0.85, rank: 1.5, hid: 5, cl: [1, 3], inner: 0.3, gapS: 0.5, uTop: 1.12 },
  { name: 'ground', kind: 'decal', g: 0, spread: 1400, pow: 1.6, sc: 1, rank: 'floor', hid: 7, cl: [1, 1], inner: 0, gapS: 0.07, uTop: 1.12, size: 0.8, sizeV: 0.8, mix: [2, 2, 2, 2, 2, 2, 0, 2, 2, 1] },
  { name: 'ground2', kind: 'decal', g: 0, spread: 7000, pow: 1.5, sc: 1, rank: 'floor', hid: 8, cl: [1, 1], inner: 0, gapS: 0.045, uTop: 0.6, gMin: 2900, size: 1.4, sizeV: 1.0, mix: [2, 2, 2, 2, 0, 2, 2, 1] }
];   // near (hugs the path edge), middle, far: ground distance from the middle of the road at the bottom edge
function scen3H(a, b, c) { var x = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
function scen3Rows() { return Math.max(1, Math.min(L3_ROWS.length, Math.round(L3_CFG.depthRows))); }
function scen3Inner() { return L3_CFG.propGapS * 0.7; }                                       // gap between props inside a cluster
function scen3Pitch() { return L3_CFG.clusterMax * scen3Inner() + L3_CFG.propGapS * 0.6; }    // time from one cluster start to the next
function scen3Spec(st) {                    // everything about a stream's timing: cluster size, spacing, how much of the road it is drawn on, and how many pictures it needs
  var row = st.def, life = scen3Life(), cl = row.cl || [L3_CFG.clusterMin, L3_CFG.clusterMax];
  st.cmin = cl[0]; st.cmax = cl[1]; st.inner = row.cl ? row.inner : scen3Inner();
  st.pitch = row.cl ? st.cmax * st.inner + row.gapS : scen3Pitch();
  st.uTop = row.uTop || L3_SCEN_U0; st.ageMin = (L3_SCEN_U0 - st.uTop) * L3_TRAVEL / L3_CFG.sceneryFactor;
  st.phase = scen3H(st.hid, st.side, 7) * st.pitch; st.els = [];
  st.n = (Math.ceil((life - st.ageMin + st.inner * st.cmax) / st.pitch) + 3) * st.cmax;
  return st;
}
function buildScenery3() {
  scenEl3.innerHTML = ''; scen3.props = []; scen3.dashes = []; scen3.streams = [];
  var gap = L3_CFG.sceneryGapMs / 1000, life = scen3Life(), i, c, r, sd;
  scen3.fill = [];
  for (r = scen3Rows() - 1; r >= 0; r--) for (sd = -1; sd <= 1; sd += 2) {   // far row first, so a nearer row is later in the document too
    var st = { row: r, hid: r, def: L3_ROWS[r], side: sd }; scen3Spec(st);
    for (i = 0; i < st.n; i++) st.els.push(scen3Make(null, 'prop'));
    scen3.streams.push(st);
  }
  if (L3_CFG.groundFill > 0) L3_FILL.forEach(function (fr) { for (sd = -1; sd <= 1; sd += 2) {
    var st = { row: fr.hid, hid: fr.hid, def: fr, side: sd }; scen3Spec(st);
    for (i = 0; i < st.n; i++) st.els.push(scen3Make(null, fr.kind === 'decal' ? 'crack' : 'prop'));
    scen3.fill.push(st);
  } });
  var rg = document.getElementById('ridge3'); rg.innerHTML = ''; scen3.ridge = [];
  [['ridge_left.png', 0, L3_RIDGE.inner], ['ridge_right.png', 1920 - L3_RIDGE.inner, L3_RIDGE.inner]].forEach(function (d) {
    var box = document.createElement('div'), strip = document.createElement('div'); box.className = 'rg'; box.style.left = d[1] + 'px'; box.style.width = d[2] + 'px'; box.style.top = (L3_BG_VP.y + 8 - L3_RIDGE.h * L3_RIDGE.sc) + 'px'; box.style.height = L3_RIDGE.h * L3_RIDGE.sc + 'px'; box.style.webkitMaskImage = box.style.maskImage = 'linear-gradient(' + (d[1] ? '90deg' : '270deg') + ', transparent 0, #000 140px, #000 100%)';
    strip.style.width = L3_RIDGE.w * L3_RIDGE.sc * 3 + 'px'; strip.style.height = L3_RIDGE.h * L3_RIDGE.sc + 'px'; strip.style.backgroundSize = L3_RIDGE.w * L3_RIDGE.sc + 'px ' + L3_RIDGE.h * L3_RIDGE.sc + 'px';
    strip.style.backgroundImage = "url('" + d[0] + "')"; box.appendChild(strip); rg.appendChild(box); scen3.ridge.push(strip);
  });
  scen3.cracks = [];
  for (sd = -1; sd <= 1; sd += 2) { var cl = []; for (i = 0; i < Math.ceil(life / L3_CFG.crackGapS) + 3; i++) cl.push(scen3Make(null, 'crack')); scen3.cracks.push({ side: sd, phase: scen3H(sd, 3, 29) * L3_CFG.crackGapS, els: cl }); }
  var nd = Math.ceil(life / (gap / 2)) + 2;
  for (c = 1; c < L3_CFG.laneCount; c++) { var col = []; for (i = 0; i < nd; i++) col.push(scen3Make(null, 'dash')); scen3.dashes.push(col); }
  state3.scen = life;                                            // the road is already lined with props on the still screen
}
/* Distance fade: from fadeStart down to the horizon a prop thins out and tints towards the haze of the sky, so nothing pops at the volcano end. The tint is a few steps (band), set only when the step changes, so it costs nothing per frame. */
function scen3Haze(o, u) {
  var f = u >= L3_CFG.fadeStart ? 0 : Math.min(1, (L3_CFG.fadeStart - u) / (L3_CFG.fadeStart - 0.02)), band = Math.round(f * 6);
  o.img.style.opacity = f === 0 ? '' : Math.max(0, 1 - Math.pow(f, 1.5)).toFixed(2);
  if (band !== o.band) { o.band = band; var g = band / 6; o.img.style.filter = g === 0 ? '' : 'brightness(' + (0.82 + 0.35 * g).toFixed(2) + ') saturate(' + (0.9 - 0.5 * g).toFixed(2) + ') sepia(' + (0.55 * g).toFixed(2) + ') hue-rotate(' + (-12 * g).toFixed(0) + 'deg)'; }
}
function scen3Place(o, k, spawnS, ground, def, mirror, lift, size, z, uTop) {   // put one pooled element where the receding prop with spawn time spawnS is
  var u = L3_SCEN_U0 - (state3.scen - spawnS) * L3_CFG.sceneryFactor / L3_TRAVEL, vis = u > 0.02 && u <= (uTop || L3_SCEN_U0) + 0.001;
  if (o.k !== k) { o.k = k; o.img.src = def.src; o.img.width = def.w; o.img.height = def.h; o.img.style.left = (-def.w / 2) + 'px'; o.img.style.top = (lift ? -def.h : -def.h / 2) + 'px'; if (z !== undefined) o.el.style.zIndex = z; }
  if (vis !== o.shown) { o.el.style.display = vis ? 'block' : 'none'; o.shown = vis; }
  if (!vis) return false;
  var p = scen3Pos(u, ground), m = p.s * def.sc * (size || 1);
  o.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) scale(' + (m * (mirror ? -1 : 1)).toFixed(4) + ',' + m.toFixed(4) + ')';   // the scale lives on the element's own layer, so the picture and its filter are drawn once and only composited as it grows
  if (lift || def.haze) scen3Haze(o, u); else o.img.style.opacity = u < 0.1 ? (u / 0.1).toFixed(2) : '';
  return true;
}
function drawRidge3() {   // the two ridge strips slide slowly towards the volcano; the strip is wider than its box and tiles, so only a transform changes
  if (!scen3.ridge) return;
  var off = (state3.scen * L3_CFG.ridgeSpeed * 100) % (L3_RIDGE.w * L3_RIDGE.sc);
  scen3.ridge[0].style.transform = 'translate3d(' + (off - L3_RIDGE.w * L3_RIDGE.sc).toFixed(1) + 'px,0,0)';
  scen3.ridge[1].style.transform = 'translate3d(' + (-off).toFixed(1) + 'px,0,0)';
}
function drawScenery3() {
  drawRidge3();
  var life = scen3Life();
  scen3.frame = (scen3.frame || 0) + 1;
  scen3.streams.concat(scen3.fill).forEach(function (st) {
    var row = st.def, n = st.els.length, sc = state3.scen + st.phase, pitch = st.pitch, inner = st.inner, cm = st.cmax, span = cm - st.cmin + 1, decal = row.kind === 'decal', defs = decal ? L3_GROUND : L3_PROPS;
    var cmax = Math.floor((sc - st.ageMin) / pitch), cmin = Math.floor((sc - life) / pitch) - 1, c, j;
    for (c = cmin; c <= cmax; c++) {
      var cn = st.cmin + Math.min(span - 1, Math.floor(scen3H(c, st.hid, st.side * 3) * span)), cg = row.g + row.spread * scen3H(c, st.hid, st.side * 5);
      for (j = 0; j < cn; j++) {
        var idx = c * cm + j, o = st.els[scen3Mod(idx, n)], h = scen3H(c * 16 + j, st.hid, st.side * 11);
        var def = row.mix ? defs[row.mix[Math.floor(h * row.mix.length) % row.mix.length]] : defs[Math.floor(h * defs.length) % defs.length], hs = scen3H(c * 16 + j, st.hid, 13), size, ground;
        if (decal) {     // the ground texture: small flat pictures, thick near the road and thinning out towards the horizon, never nearer than edgeClearPx to the sand
          size = row.size + row.sizeV * hs; ground = st.side * (Math.max(scen3Clear(st.side, def.w / 2 * def.sc * size), row.gMin || 0) + row.spread * Math.pow(scen3H(c * 16 + j, st.hid, 17), row.pow));
        } else {
          size = (0.8 + 0.5 * hs) * row.sc; ground = st.side * Math.max(cg + (scen3H(c * 16 + j, st.hid, 17) - 0.5) * 160, scen3Clear(st.side, def.w / 2 * def.sc * size));
        }
        o.stamp = scen3.frame;
        var z = decal ? 0 : (row.rank === 'back' ? 0 : (scen3Rows() - (row.rank || st.row)) * 200000) + 100000 - scen3Mod(idx, 100000);   // far rows are under near rows; inside a row the one nearer the camera (spawned earlier) is on top
        scen3Place(o, idx, c * pitch + j * inner - st.phase, ground, def, scen3H(c * 16 + j, st.hid, 19) < 0.5, !decal, size, z, st.uTop);
      }
    }
    for (j = 0; j < n; j++) { var q = st.els[j]; if (q.stamp !== scen3.frame && q.shown) { q.el.style.display = 'none'; q.shown = false; } }
  });
  var cg = L3_CFG.crackGapS, cn = scen3.cracks[0].els.length;
  scen3.cracks.forEach(function (cs) {     // flat ground decals (lava cracks, pebbles) that run past as a speed cue, under the props
    var sc = state3.scen + cs.phase, kmax = Math.floor(sc / cg), kmin = Math.floor((sc - life) / cg) - 1;
    for (var k = kmin; k <= kmax; k++) {
      var o = cs.els[scen3Mod(k, cn)], h = scen3H(k, cs.side, 31), def = L3_GROUND[Math.floor(scen3H(k, cs.side, 37) * L3_GROUND.length) % L3_GROUND.length];
      o.stamp = scen3.frame;
      var csz = 1 + 0.7 * scen3H(k, cs.side, 43);
      scen3Place(o, k, k * cg - cs.phase, cs.side * (scen3Clear(cs.side, def.w / 2 * def.sc * csz) + 700 * h), def, scen3H(k, cs.side, 41) < 0.5, false, csz, 0);
    }
    for (var j = 0; j < cn; j++) { var q = cs.els[j]; if (q.stamp !== scen3.frame && q.shown) { q.el.style.display = 'none'; q.shown = false; } }
  });
  var gap = L3_CFG.sceneryGapMs / 1000, dgap = gap / 2, dmax = Math.floor(state3.scen / dgap), dmin = Math.ceil((state3.scen - life) / dgap);
  scen3.dashes.forEach(function (col, ci) {
    var ground = (ci + 1 - L3_CFG.laneCount / 2) * lane3Spacing(), m = col.length;
    for (var j = 0; j < m; j++) {
      var k = dmax - scen3Mod(dmax - j, m), o = col[j];
      if (k < dmin) { if (o.shown) { o.el.style.display = 'none'; o.shown = false; } continue; }
      scen3Place(o, k, k * dgap, ground, L3_DASH, false, false);
    }
  });
}

// ── loop crossfade: an mp3 has a little silence at its end, so a plain loop clicks or gaps. Two copies of the clip overlap for `fade` seconds at the end of every pass.
function xfMake(a, fade) { var b = a.cloneNode(); b.removeAttribute('id'); b.loop = true; return { a: a, b: b, cur: a, fade: fade, vol: 0.5, on: false, fading: false, rate: 1 }; }
function xfAttach(x, vol) { x.on = true; x.vol = vol; x.fading = false; x.cur = x.a; x.b.pause(); x.b.currentTime = 0; x.a.playbackRate = x.b.playbackRate = x.rate; }
function xfStart(x, vol) { xfAttach(x, vol); x.a.currentTime = 0; x.a.volume = vol; x.a.play().catch(function () {}); }
function xfStop(x) { x.on = false; x.fading = false; x.a.pause(); x.b.pause(); x.cur = x.a; }
function xfRate(x, r) { x.rate = r; x.a.playbackRate = x.b.playbackRate = r; }
function xfPlaying(x) { return x.on && !x.a.paused || x.on && !x.b.paused; }
function xfTick(x) {
  if (!x.on) return;
  var c = x.cur, n = c === x.a ? x.b : x.a, dur = c.duration;
  if (c.paused) { if (!n.paused) n.pause(); x.fading = false; return; }
  if (!dur || isNaN(dur)) return;
  var left = dur - c.currentTime, f = Math.min(x.fade, dur / 3);
  if (!x.fading && left <= f && left > 0.001) { n.currentTime = 0; n.volume = 0; n.playbackRate = x.rate; n.play().catch(function () {}); x.fading = true; }
  if (x.fading) {
    if (left > f + 0.2 || left <= 0.02) { c.pause(); c.currentTime = 0; n.volume = x.vol; x.cur = n; x.fading = false; return; }   // this pass has ended (the clip wrapped round): the other copy carries on
    var k = Math.max(0, Math.min(1, 1 - left / f)); c.volume = x.vol * (1 - k); n.volume = x.vol * k;
  } else c.volume = x.vol;
}
const rumbleXF = xfMake(rumbleSfx, 0.8), rollXF = xfMake(rockRollSfx, 0.4), chaseXF = xfMake(chaseMusic, 1.2);
const boomSfx = document.getElementById('boomSfx'), spurt3 = document.getElementById('spurt3'), smoke3El = document.getElementById('smoke3');
const L3_ERUPT_S = 0.9;                            // one eruption: the spurt rises and falls, the glow brightens, the background trembles
const L3_QUIET_VOL = 0.4;                          // nothing but the music (0.5) is ever louder than this
function l3Vol(v) { return Math.min(v, L3_QUIET_VOL); }
function buildSmoke3() {
  smoke3El.innerHTML = ''; state3.smoke = [];
  for (var j = 0; j < L3_CFG.smokeCount; j++) { var im = document.createElement('img'); im.src = 'smoke_puff.png'; im.alt = ''; smoke3El.appendChild(im); state3.smoke.push(im); }
}
function eruption3(big) {                          // a spurt (always) and, for a big one, a boom and a shake
  if (state3.eruptT < 0.7 && !(big && !state3.eruptBig)) return;   // never more than one eruption at a time, but a big one always takes over from a small one (so the boom and shake are never lost)
  state3.eruptT = 0; state3.eruptBig = big;
  if (big) sfx(boomSfx, l3Vol(0.3));
}
function drawEruption3(dt) {
  state3.eruptT += dt;
  var u = state3.eruptT / L3_ERUPT_S, e = u >= 1 ? 0 : u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75, big = state3.eruptBig;
  spurt3.style.opacity = e <= 0 ? 0 : Math.min(1, e * 1.4).toFixed(2);
  spurt3.style.transform = l3Calm ? 'scale(0.8)' : 'scale(' + ((big ? 0.35 : 0.2) + (big ? 0.75 : 0.45) * e).toFixed(3) + ')';
  var life = 4.5;
  state3.smoke.forEach(function (im, j) {
    var ph = l3Calm ? (j + 0.5) / state3.smoke.length : ((state3.glowT / life) + j / state3.smoke.length) % 1;
    var x = 966 + Math.sin(j * 2.4) * 18 + ph * 90, y = 262 - ph * 200, sc = 0.22 + 0.5 * ph + (!l3Calm && big && u < 1 ? 0.12 * e : 0);
    im.style.opacity = (Math.sin(Math.PI * ph) * (l3Calm ? 0.45 : 0.62)).toFixed(2);
    im.style.transform = 'translate(' + (x - 150).toFixed(1) + 'px,' + (y - 115).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
  });
  var amp = l3Calm || !big || u >= 1 ? 0 : L3_CFG.shakePx * (1 - u) * (1 - u);    // the background trembles gently (about 7 times a second) and settles; Zacky and the screen furniture stay still
  state3.shakeX = amp * Math.sin(state3.eruptT * Math.PI * 14); state3.shakeY = amp * 0.6 * Math.cos(state3.eruptT * Math.PI * 14);
  state3.glowE += (e - state3.glowE) * Math.min(1, dt * 3);   // the glow eases up and down, so it never jumps
  return state3.glowE;
}
function buildLaunches3() {                                             // every rock is thrown out of the crater rockLaunchMs before it shows up on the road; a few extra ones fly off to the sides
  launch3El.innerHTML = ''; state3.launches = [];
  function add(tl, x1, y1, h, real, side) {
    var el = document.createElement('img'); el.src = 'lava_rock_small.png'; el.alt = ''; el.width = 150; el.height = 133; launch3El.appendChild(el);
    state3.launches.push({ tl: tl, x1: x1, y1: y1, h: h, real: real, side: side, el: el, shown: false });
  }
  var bigN = 0;
  state3.items.forEach(function (it) {
    if (it.type !== 'R') return;
    var tl = item3At(it) - L3_TRAVEL * (1 - L3_ROCK_APPEAR) - L3_CFG.rockLaunchMs / 1000, q = item3Pos(it, item3At(it) - L3_TRAVEL * (1 - L3_ROCK_APPEAR));
    add(tl, q.x, q.y, 140, true, 0); state3.launches[state3.launches.length - 1].big = (bigN++ % 3) === 0;   // every third rock is a big eruption with a boom
  });
  for (var k = 0, tl = 0.5; tl < L3_DECO_END; k++, tl = 0.5 + k * L3_DECO_GAP) {
    var near = state3.launches.some(function (l) { return l.real && Math.abs(l.tl - tl) < 0.45; });
    if (!near) { var side = k % 2 ? 1 : -1; add(tl, L3_VP.x + side * (260 + (k * 97) % 300), L3_VP.y + 22, 110, false, side); }
  }
}
function drawLaunches3(T0) {
  var dur = L3_CFG.rockLaunchMs / 1000;
  state3.launches.forEach(function (l) {
    var u = (T0 - l.tl) / dur, vis = u >= 0 && u <= (l.real ? 1 : 1.5);
    if (vis !== l.shown) { l.el.style.display = vis ? 'block' : 'none'; l.shown = vis; }
    if (!vis) return;
    var uu = Math.min(u, 1), x = L3_CRATER.x + (l.x1 - L3_CRATER.x) * uu, y = L3_CRATER.y + (l.y1 - L3_CRATER.y) * uu - 4 * l.h * uu * (1 - uu), sc = 0.3 - 0.12 * uu + 0.06 * Math.sin(Math.PI * uu);
    var fade = u > 1 ? 1 - (u - 1) / 0.5 : Math.min(1, u * 6);
    if (u > 1) { x += l.side * (u - 1) * 90; y -= 18 * Math.abs(Math.sin((u - 1) * Math.PI * 2)); }
    l.el.style.opacity = Math.max(0, fade).toFixed(2);
    l.el.style.transform = 'translate(' + (x - 75).toFixed(1) + 'px,' + (y - 66).toFixed(1) + 'px) rotate(' + (l3Calm ? 0 : uu * 720).toFixed(0) + 'deg) scale(' + sc.toFixed(3) + ')';
  });
}
function rockSounds3(T0) {   // (the first line is the thump for each launch)                                              // a thump when a rock is thrown, and a quiet rolling sound that grows as a rock comes closer (both under the music)
  if (!audioUnlocked) return;
  state3.launches.forEach(function (l) { if (T0 < l.tl && l.tl <= state3.T && state3.phase === 'run') { sfx(rockLaunchSfx, l3Vol(l.real ? 0.28 : 0.16)); eruption3(l.real && l.big); } });
  var near = 0;
  if (state3.phase === 'run') state3.items.forEach(function (it) { if (it.type === 'R' && !it.gone) { var d = item3Pos(it, state3.T).d; if (d > L3_ROCK_APPEAR && d < 1.05) near = Math.max(near, Math.min(1, d + 0.15)); } });
  if (near > 0) { if (!rollXF.on) xfStart(rollXF, l3Vol(0.3 * near)); rollXF.vol = l3Vol(0.3 * near); }
  else if (rollXF.on) xfStop(rollXF);
}
function buildItems3() {
  world3.innerHTML = ''; state3.items = [];
  L3_LIST.forEach(function (r) {
    var t = L3_ITEM[r[2]], el = document.createElement('div'), im = document.createElement('img'), sh = document.createElement('i'), dust = [];
    sh.className = 'sh'; el.appendChild(sh);
    if (r[2] === 'R') for (var j = 0; j < 3; j++) { var d = document.createElement('i'); d.className = 'dust'; el.appendChild(d); dust.push(d); }
    el.className = 'it t-' + r[2]; im.src = t.src; im.alt = ''; im.width = t.w; im.height = t.h; im.style.left = (-t.w / 2) + 'px'; im.style.top = (t.spin ? -t.h / 2 : -t.h) + 'px';
    if (t.spin) im.style.transformOrigin = '50% 50%';
    el.appendChild(im); world3.appendChild(el);
    state3.items.push({ slot: r[0], lane: item3Lane(r[1]), type: r[2], el: el, img: im, sh: sh, dust: dust, hit: false, shown: false });
  });
  buildDonut3();
}
function drawItems3() {
  state3.items.forEach(function (it) {
    var p = item3Pos(it, state3.T), t = L3_ITEM[it.type], vis = p.d > 0.03 && p.d < 1.12 && (!it.gone || it.popT < 1);
    if (vis !== it.shown) { it.el.style.display = vis ? 'block' : 'none'; it.shown = vis; }
    if (!vis) return;
    var sc = p.s * t.sc, pop = it.popT === undefined ? 0 : it.popT, lift = t.lift * sc;
    var bounce = it.type === 'g' && !l3Calm ? Math.abs(Math.sin(p.d * 10 + it.slot)) * 90 * p.s * (1 - 0.6 * Math.min(1, p.d)) : 0;   // gems thrown out by the volcano bounce down the lane
    var up = lift + bounce + 70 * pop;
    it.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + (p.y - up).toFixed(1) + 'px)';
    it.img.style.opacity = 1 - pop;
    it.img.style.transform = (t.spin ? 'rotate(' + (p.d * 540).toFixed(1) + 'deg) ' : '') + 'scale(' + (sc * (1 + 0.9 * pop)).toFixed(4) + ')';
    var sw = t.w * 0.8 * sc;                                                                // a shadow on the ground that grows as it comes closer
    it.sh.style.width = sw.toFixed(1) + 'px'; it.sh.style.height = (sw * 0.26).toFixed(1) + 'px'; it.sh.style.opacity = Math.min(0.4, p.d * 1.2) * (1 - pop);
    it.sh.style.transform = 'translate(-50%,-50%) translateY(' + up.toFixed(1) + 'px)';
    it.dust.forEach(function (d, j) {                                                       // a little dust trail behind a rock, towards the volcano
      var q = item3Pos(it, state3.T - 0.09 * (j + 1)), r = 70 * q.s;
      d.style.width = d.style.height = r.toFixed(1) + 'px'; d.style.opacity = (0.5 - 0.14 * j) * Math.min(1, p.d * 2);
      d.style.transform = 'translate(' + (q.x - p.x - r / 2).toFixed(1) + 'px,' + (q.y - p.y + up - r / 2).toFixed(1) + 'px)';
    });
    it.el.classList.toggle('near', p.d > 1);
  });
}

// ── the donut (v2 step 7a): thrown out of the crater late in the run, eaten for a 2x speed boost with no rocks
const L3_DONUT = { w: 300, h: 260, sc: 0.8, lift: 120 };
const L3_EAT_WIN = 0.22;                           // the donut is eaten within this many run seconds of reaching him (even in the air)
const donutCrunchSfx = document.getElementById('donutCrunchSfx'), boostSfx = document.getElementById('boostSfx'), zoom3 = document.getElementById('zoom3'), spk3 = document.getElementById('spk3');
function buildDonut3() {
  var el = document.createElement('div'), im = document.createElement('img'), sh = document.createElement('i');
  sh.className = 'sh'; el.className = 'it t-D'; im.src = 'donut.png'; im.alt = ''; im.width = L3_DONUT.w; im.height = L3_DONUT.h; im.style.left = (-L3_DONUT.w / 2) + 'px'; im.style.top = (-L3_DONUT.h / 2) + 'px'; im.style.transformOrigin = '50% 50%';
  el.appendChild(sh); el.appendChild(im); world3.appendChild(el);
  state3.donut = { el: el, img: im, sh: sh, launched: false, eaten: false, pass: 0, at: 0, lane: 1, popT: 0, shown: false, d: 0 };
  state3.boostT = 0; state3.boostE = 0; state3.boostK = 1; state3.zoomT = 0; state3.spkT = 0; spk3.innerHTML = ''; zoom3.classList.remove('on'); z3.classList.remove('boost'); xfRate(chaseXF, 1);
}
function updateDonut3() {                          // run phase only: launch it, bring it back once if missed, eat it
  var dn = state3.donut, T = state3.T;
  if (!dn.launched && T >= L3_CFG.donutAtSeconds) {   // always at this run second, whatever the gem count (0 of 12 gets it too)
    dn.launched = true; dn.pass = 1; dn.at = T + L3_TRAVEL; dn.lane = state3.lane; sfx(rockLaunchSfx, l3Vol(0.28)); eruption3(true);
  }
  if (!dn.launched || dn.eaten) return;
  if (dn.pass === 1 && T > dn.at + 0.35) { dn.pass = 2; dn.at = T + L3_TRAVEL; sfx(rockLaunchSfx, l3Vol(0.2)); eruption3(false); }   // missed: it comes back, steering towards his lane so it cannot be missed again
  var dT = T - dn.at;
  if (Math.abs(dT) < L3_EAT_WIN && (dn.pass === 2 || dn.lane === state3.lane)) eatDonut3();
}
function donut3Pos() {                              // d: 0 at the vanishing point, 1 at Zacky; the second pass homes in on his lane over the last part
  var dn = state3.donut, d = 1 - (dn.at - state3.T) / L3_TRAVEL, s = L3_SZ * Math.pow(Math.max(d, 0), L3_PERSP), g = lane3Ground(dn.lane);
  if (dn.pass === 2) { var h = Math.max(0, Math.min(1, (d - 0.25) / 0.6)); g += (lane3Ground(state3.lane) - g) * h; }
  return { d: d, s: s, x: L3_VP.x + g * s, y: L3_VP.y + (1080 - L3_VP.y) * s };
}
function eatDonut3() {
  var dn = state3.donut, p = donut3Pos();
  dn.eaten = true; dn.popT = 0; sfx(donutCrunchSfx, 0.6); sfx(boostSfx, 0.4);
  state3.boostT = L3_CFG.boostMs / 1000; state3.boostE = 0; state3.zoomT = 1.3; zoom3.classList.add('on'); xfRate(chaseXF, 1.12);
  var n = l3Calm ? 5 : 10; spk3.innerHTML = '';
  for (var i = 0; i < n; i++) { var im = document.createElement('img'), a = i / n * Math.PI * 2; im.src = 'sparkle.png'; im.alt = ''; im.className = 'spk3'; im.style.left = (p.x - 40) + 'px'; im.style.top = (p.y - 130) + 'px'; im.style.setProperty('--dx', (Math.cos(a) * 150) + 'px'); im.style.setProperty('--dy', (Math.sin(a) * 110) + 'px'); spk3.appendChild(im); }
  state3.spkT = 1.0;
}
function updateBoost3(dt) {
  if (state3.zoomT > 0) { state3.zoomT -= dt; if (state3.zoomT <= 0) zoom3.classList.remove('on'); }
  if (state3.spkT > 0) { state3.spkT -= dt; if (state3.spkT <= 0) spk3.innerHTML = ''; }
  if (state3.phase === 'car') state3.boostK = Math.max(1, state3.carK);
  else if (state3.boostT > 0) {
    state3.boostE += dt; state3.boostT -= dt;
    state3.boostK = state3.boostT > 0 ? 1 + (L3_CFG.boostSpeed - 1) * Math.min(1, state3.boostE / 0.3, state3.boostT / 0.5) : 1;
    if (state3.boostT <= 0) { state3.boostT = 0; xfRate(chaseXF, 1); }
  } else state3.boostK = 1;
  if (state3.phase === 'run') z3.classList.toggle('boost', state3.boostT > 0);
}
function drawDonut3() {
  if (!state3.donut) return;
  var dn = state3.donut, p = donut3Pos(), vis = dn.launched && p.d > 0.03 && p.d < 1.15 && (!dn.eaten || dn.popT < 1);
  if (vis !== dn.shown) { dn.el.style.display = vis ? 'block' : 'none'; dn.shown = vis; }
  if (!vis) return;
  if (dn.eaten) dn.popT = Math.min(1, dn.popT + 0.02);
  var pop = dn.eaten ? dn.popT : 0, sc = p.s * L3_DONUT.sc, up = L3_DONUT.lift * sc + (l3Calm ? 0 : Math.abs(Math.sin(p.d * 9)) * 110 * p.s * (1 - 0.6 * Math.min(1, p.d))) + 80 * pop;
  dn.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + (p.y - up).toFixed(1) + 'px)';
  dn.img.style.opacity = 1 - pop;
  dn.img.style.transform = 'rotate(' + (l3Calm ? 0 : Math.sin(p.d * 12) * 14).toFixed(1) + 'deg) scale(' + (sc * (1 + 0.9 * pop)).toFixed(4) + ')';
  var sw = L3_DONUT.w * 0.7 * sc; dn.sh.style.width = sw.toFixed(1) + 'px'; dn.sh.style.height = (sw * 0.26).toFixed(1) + 'px'; dn.sh.style.opacity = Math.min(0.4, p.d * 1.2) * (1 - pop);
  dn.sh.style.transform = 'translate(-50%,-50%) translateY(' + up.toFixed(1) + 'px)';
  dn.el.classList.toggle('near', p.d > 1);
}
function lane3Spacing() { return 1560 / L3_CFG.laneCount; }          // lane distance on the ground at the bottom edge
function lane3Ground(lane) { return (lane - (L3_CFG.laneCount - 1) / 2) * lane3Spacing(); }
function lane3XAt(lane, s) { return L3_VP.x + lane3Ground(lane) * s; }  // x of a lane at perspective scale s (s = L3_SZ is where Zacky stands)
function midLane3() { return Math.floor((L3_CFG.laneCount - 1) / 2); }

function startLevel3() {
  walkSfx.pause();
  showScreen('level3', function () { resetLevel3(); });                 // the title tune from the celebration keeps playing on the still screen
}
function resetLevel3() {
  state3.phase = 'ready'; state3.clock = 0; state3.lane = midLane3(); state3.laneX = lane3XAt(state3.lane, L3_SZ); state3.pose = 'run'; state3.slideT = 1; state3.T = 0; state3.gems = 0; state3.trips = 0; state3.jumpT = -1; state3.stumbleT = -1;
  state3.lava = 0; state3.hop = 0; state3.invuln = 0; state3.catches = 0; state3.car = null; state3.carK = 0; state3.hopX = 0; hints3.dodge = 0; hints3.donut = 0; hint3.classList.remove('on'); state3.tripGuard = 0;
  car3.style.display = 'none'; car3img.setAttribute('src', L3_CAR_EMPTY); z3.style.visibility = 'visible'; z3.style.opacity = 1; world3.style.opacity = 1; xfStop(rumbleXF); xfStop(chaseXF); flash3.style.opacity = 0; whoops3.classList.remove('on');
  buildItems3(); buildLaunches3(); buildScenery3(); buildSmoke3(); hud3.set(0); xfStop(rollXF); state3.eruptT = 9; state3.glowE = 0; state3.shakeX = state3.shakeY = 0;
  ready3.style.display = 'block';
  drawZacky3(0);
}
function beginRun3() {
  state3.phase = 'run';
  ready3.style.display = 'none';
  playMusic(chaseMusic); xfAttach(chaseXF, 0.5);                      // the chase tune loops with a crossfade (no gap)
  if (audioUnlocked) xfStart(rumbleXF, l3Vol(L3_CFG.rumbleVolume));   // a loud volcano rumble, kept under the music
  state3.eruptT = 9; eruption3(true);                                  // the volcano erupts as the run starts
}
function showHint3(html) { hint3.innerHTML = html; hint3.classList.add('on'); }
function endHint3(which) { hints3[which] = 2; hint3.classList.remove('on'); }
function updateHints3() {                                          // one hint: "Use the arrows to dodge!" just before the first rock, shown once
  if (!L3_CFG.hintsOn) return;
  var first = state3.items.find(function (it) { return it.type === 'R'; }), at = first ? item3At(first) : 0;
  if (hints3.dodge === 0 && state3.T >= at - L3_HINT_LEAD && state3.T < at) { hints3.dodge = 1; showHint3('Use the arrows to dodge! <b class="keycap">&larr;</b> <b class="keycap">&rarr;</b>'); }
  else if (hints3.dodge === 1 && state3.T >= at + L3_HIT_WIN) endHint3('dodge');
  var dn = state3.donut;                                           // and "Eat the donut!" from the moment the donut is thrown until it is eaten
  if (hints3.donut === 0 && hints3.dodge !== 1 && dn && dn.launched && !dn.eaten) { hints3.donut = 1; showHint3('Eat the donut!'); }
  else if (hints3.donut === 1 && (!dn || !dn.launched || dn.eaten)) endHint3('donut');
}
var l3CarOK = true, l3InOK = true;
(function () {                                                    // if a car picture is missing, fall back to the old car-with-Zacky picture, or leave Zacky standing in the seat
  var e = new Image(), f = new Image();
  e.onerror = function () { l3CarOK = false; };
  f.onerror = function () { l3InOK = false; };
  e.src = L3_CAR_EMPTY; f.src = L3_CAR_FULL;
})();
function carEase3(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
function startCar3() {                                             // the donut dash reaches the end (or levelLengthSeconds is up): the car drives in
  if (state3.car) return;
  if (state3.donut) state3.donut.launched = false;
  state3.phase = 'car'; state3.jumpT = -1; state3.stumbleT = -1; state3.hop = 0; state3.hopX = 0;
  state3.car = { t: 0, stage: 'arrive', lastStage: '', k0: Math.max(1, state3.boostK) }; state3.carK = state3.car.k0; state3.boostT = 0;
  state3.lane = midLane3(); state3.slideFrom = state3.laneX; state3.slideT = 0;
  whoops3.classList.remove('on'); flash3.style.opacity = 0; hints3.dodge = 2; hints3.donut = 2; hint3.classList.remove('on');
  car3img.setAttribute('src', l3CarOK ? L3_CAR_EMPTY : L3_CAR_OLD); car3.style.display = 'block'; car3.style.opacity = 0;
  eruption3(false);
}
function carPlace3(x, bottom, sc, op) {
  car3.style.opacity = op.toFixed(2);
  car3.style.transform = 'translate(' + x.toFixed(1) + 'px,' + bottom.toFixed(1) + 'px) scale(' + sc.toFixed(4) + ')';
}
function updateCar3(dt) {
  var c = state3.car, C = L3_CAR, arrive = L3_CFG.carArriveMs / 1000, drive = L3_CFG.driveOffMs / 1000;
  c.t += dt; var t = c.t, cx = L3_VP.x;
  var t1 = arrive, t2 = t1 + C.hopS, t3 = t2 + C.waitS, t4 = t3 + drive;
  var seatX = cx + (C.seatX - C.w / 2) * C.cs, seatY = C.bottom + (C.seatY - C.base) * C.cs;     // where Zacky's feet land
  if (t < t1) {                                                    // arrive: the car grows out of the distance, the scenery slows to a stop
    c.stage = 'arrive'; var u = t / arrive, e = 1 - Math.pow(1 - u, 1.6), pr = 0.03 + 0.97 * e, sd = Math.pow(pr, L3_PERSP);
    state3.carK = c.k0 * (1 - carEase3(u)); state3.clock += dt * (0.25 + 0.75 * (1 - u));
    if (l3Calm) carPlace3(cx, C.bottom, C.cs, Math.min(1, u * 2.5));
    else carPlace3(cx, L3_VP.y + (C.bottom - L3_VP.y) * sd, C.cs * sd, Math.min(1, u * 6));
    state3.hop = 0; state3.hopX = 0;
  } else if (t < t2) {                                             // hop: Zacky jumps from the path into the seat
    c.stage = 'hop'; var h = (t - t1) / C.hopS, he = carEase3(h);
    state3.carK = 0; carPlace3(cx, C.bottom, C.cs, 1);
    state3.hopX = (seatX - state3.laneX) * he;
    state3.hop = (L3_FOOT - seatY) * he + (l3Calm ? 0 : Math.sin(Math.PI * h) * 90);
    if (c.lastStage !== 'hop') { if (!l3CarOK) z3.style.visibility = 'hidden'; sfx(jumpSfx, 0.6); xfRate(chaseXF, 1); z3.classList.remove('boost'); }
  } else if (t < t3) {                                             // in the car: swap to the picture with Zacky in it, on the same canvas
    c.stage = 'wait'; state3.carK = 0; carPlace3(cx, C.bottom, C.cs, 1);
    if (c.lastStage !== 'wait') {
      state3.hop = L3_FOOT - seatY; state3.hopX = seatX - state3.laneX;
      if (l3CarOK && l3InOK) { car3img.setAttribute('src', L3_CAR_FULL); z3.style.visibility = 'hidden'; }
      sfx(cheerSfx, 0.7);
    }
    if (l3CarOK && l3InOK && !l3Calm) carPlace3(cx, C.bottom + Math.max(0, Math.sin((t - t2) * 14)) * -10, C.cs, 1);
  } else if (t < t4) {                                             // drive off: the car grows past the screen with its horn and a whoosh
    c.stage = 'drive'; var d = (t - t3) / drive, de = d * d;
    if (c.lastStage !== 'drive') { sfx(carHornSfx, 0.5); sfx(carWhooshSfx, 0.5); }
    state3.carK = 0;
    var dx = cx + 650 * (l3Calm ? 0 : de) + (l3Calm ? 300 * d : 0), dy = C.bottom + (l3Calm ? 80 * d : 1200 * de), dsc = C.cs * (l3Calm ? 1 + 0.5 * d : 1 + 3 * de), dop = 1 - carEase3((d - (l3Calm ? 0.3 : 0.65)) / (l3Calm ? 0.7 : 0.35));
    carPlace3(dx, dy, dsc, dop);
    if (l3CarOK && !l3InOK) {                            // no Zacky-in-car picture: he sits in the seat and rides along
      state3.hopX = dx + (C.seatX - C.w / 2) * dsc - state3.laneX; state3.hop = L3_FOOT - (dy + (C.seatY - C.base) * dsc); z3.style.opacity = dop;
    }
  } else { c.stage = 'end'; state3.phase = 'done'; endLevel3(); }
  c.lastStage = c.stage;
  updateBoost3(dt);
  state3.lava = Math.max(0, state3.lava - dt * 0.3);
}
function endLevel3() {                                             // level 3 complete: confetti, the gem total, Enter goes back to the title
  var row = document.getElementById('gemRow3'), total = hud3.total;
  row.textContent = '';
  for (var i = 0; i < total; i++) { var im = document.createElement('img'); im.src = 'gem.png'; im.alt = ''; if (i >= state3.gems) im.className = 'miss'; row.appendChild(im); }
  var n = state3.gems, line = n + ' of ' + total + ' gems!';
  if (n === 0) line = 'Great ride! Zacky loves gems, so let\'s find some next time!';      // no gems: a cheerful line, and no row of dark gems
  else if (n < 4) line = 'Nice! ' + line;
  else if (n === total) line += ' Hooray!';
  row.style.display = n === 0 ? 'none' : '';
  document.getElementById('count3').textContent = line;
  xfStop(rumbleXF); xfStop(rollXF); xfStop(chaseXF);
  showScreen('celebrate3', function () { playMusic(titleMusic); });
}
function level3Done3Key(key) { if (key === 'Enter') startLevel3(); }      // "Press Enter to play again" really plays level 3 again (the title tune keeps playing into the ready screen)
function level3Key(key, isRepeat) {
  if (state3.phase === 'car' || state3.phase === 'done') return;
  if (state3.phase === 'ready' && key === 'Enter' && !isRepeat) beginRun3();
  if (state3.phase === 'run' && !isRepeat && ZackyShared.isJumpKey(key)) jump3();
  if (state3.phase === 'run' && !isRepeat && (key === 'ArrowLeft' || key === 'ArrowRight')) changeLane3(key === 'ArrowLeft' ? -1 : 1);
}
function jump3() { if (state3.jumpT >= 0) return; state3.jumpT = 0; sfx(jumpSfx, 0.6); }
function jumpH3() { if (state3.jumpT < 0) return 0; var u = Math.min(1, state3.jumpT / L3_CFG.jumpMs); return 4 * u * (1 - u) * L3_JUMP_PEAK; }
function trip3(it) {                                                          // a soft trip: the stumble pose and a sound, he keeps running
  state3.trips++; state3.stumbleT = 0; it.tripped = true; state3.tripGuard = L3_TRIP_GUARD_S; sfx(stumbleSfx, 0.7);
  state3.lava = Math.min(1, state3.lava + L3_CFG.lavaCatchUp);
  if (state3.lava >= 1) startCaught3();
}
function checkpoint3(T) {                                                     // the last multiple of checkpointEverySeconds, at least 2 and at most maxRewindSeconds back
  var e = L3_CFG.checkpointEverySeconds, cp = Math.floor(T / e) * e;
  if (T - cp < 2) cp -= e;
  return Math.max(0, cp, T - L3_CFG.maxRewindSeconds);
}
function startCaught3() {                                                      // the lava wave caught up: a soft bounce, never a game over
  state3.phase = 'caught'; state3.caughtT = 0; state3.caughtFrom = state3.T; state3.caughtTo = checkpoint3(state3.T); state3.catches++;
  state3.jumpT = -1; state3.stumbleT = -1; state3.lava = 1;
  sfx(whoopsSfx, 0.8); whoops3.classList.add('on'); if (hints3.dodge === 1) endHint3('dodge'); if (hints3.donut === 1) hints3.donut = 0, hint3.classList.remove('on');
}
function updateCaught3(dt) {
  state3.caughtT += dt;
  var k = Math.min(1, state3.caughtT / L3_BOUNCE_S), e = k * k * (3 - 2 * k);
  state3.T = state3.caughtFrom + (state3.caughtTo - state3.caughtFrom) * e;       // the path slides back to the checkpoint
  state3.lava = state3.caughtT < 0.35 ? 1 : 1 - e;
  state3.hop = Math.sin(Math.PI * k) * 150;
  flash3.style.opacity = l3Calm ? 0 : L3_FLASH_MAX * (state3.caughtT < 0.2 ? state3.caughtT / 0.2 : Math.max(0, 1 - (state3.caughtT - 0.2) / 0.5));
  if (state3.caughtT > 0.9) whoops3.classList.remove('on');
  if (k >= 1) {                                                                // back on the path, gems kept, a moment of calm
    state3.phase = 'run'; state3.hop = 0; state3.lava = 0; state3.invuln = L3_INVULN_S; flash3.style.opacity = 0;
    state3.items.forEach(function (it) { it.tripped = false; });
  }
}
function collide3() {                                                         // gems always count (also in the safe window after a bounce); only rocks wait for the safe window to end
  state3.items.forEach(function (it) {
    if (it.gone || it.lane !== state3.lane) return;
    var dT = state3.T - item3At(it);
    if (it.type === 'g') {
      if (Math.abs(dT) < L3_GEM_WIN) { it.gone = true; it.popT = 0; state3.gems++; sfx(gemSfx, 0.7); hud3.set(state3.gems); }
    } else if (Math.abs(dT) < L3_HIT_WIN && !it.tripped && state3.invuln <= 0 && state3.tripGuard <= 0 && state3.boostT <= 0 && jumpH3() < L3_JUMP_CLEAR * L3_JUMP_PEAK) trip3(it);   // a jump that is high enough goes over the rock
  });
}
function changeLane3(dir) {                                        // exactly one lane per press, never past the outer lanes
  var to = Math.max(0, Math.min(L3_CFG.laneCount - 1, state3.lane + dir));
  if (to === state3.lane) return;
  if (hints3.dodge === 1) endHint3('dodge');                      // he has dodged: the hint is done (an early move before it shows does not cancel it)
  state3.lane = to; state3.slideFrom = state3.laneX; state3.slideT = 0;
}
function drawZacky3() {
  var pose = state3.pose, f = pose === 'run' ? L3_FRAMES.run[Math.floor(state3.clock * 1000 / L3_RUN_FRAME_MS) % 4] : L3_FRAMES[pose];
  if (state3.phase === 'ready' || (state3.phase === 'car' && state3.car.stage !== 'arrive')) f = pose === 'run' ? L3_FRAMES.run[0] : f;
  if (z3img.getAttribute('src') !== f) z3img.setAttribute('src', f);
  z3img.style.width = (L3_SIZE[pose][0] * L3_SC) + 'px';
  z3img.style.top = (-jumpH3() - state3.hop).toFixed(1) + 'px';
  var bounce = (state3.phase === 'run' || (state3.phase === 'car' && state3.car.stage === 'arrive')) && pose === 'run' && !l3Calm ? -Math.abs(Math.sin(state3.clock * Math.PI * 1000 / L3_RUN_FRAME_MS / 2)) * 8 : 0;
  z3.style.transform = 'translate(' + (state3.laneX + state3.hopX).toFixed(1) + 'px,' + (L3_FOOT + bounce).toFixed(1) + 'px)';
}
function l3BoostK() { return state3.boostK; }                                // 1, or up to boostSpeed while the donut boost is on
function level3Frame(dt) {
  state3.glowT += dt;                                                         // the crater glow pulses on every screen state
  if (!walkSfx.paused) walkSfx.pause();
  var T0 = state3.T;
  if (state3.phase === 'run') { state3.clock += dt * (1 + 0.5 * (state3.boostK - 1)); state3.T += dt * L3_CFG.runSpeed; }     // runSpeed 2 = the run, and the items, go twice as fast
  if (state3.phase === 'run') {
    if (state3.jumpT >= 0) { state3.jumpT += dt * 1000; if (state3.jumpT >= L3_CFG.jumpMs) state3.jumpT = -1; }
    if (state3.stumbleT >= 0) { state3.stumbleT += dt; if (state3.stumbleT >= L3_STUMBLE_S) state3.stumbleT = -1; }
    state3.lava = Math.max(0, state3.lava - L3_CFG.lavaRecover * dt);          // the wave slowly backs off
    if (state3.invuln > 0) state3.invuln = Math.max(0, state3.invuln - dt);
    if (state3.tripGuard > 0) state3.tripGuard = Math.max(0, state3.tripGuard - dt);
    updateDonut3(); updateBoost3(dt);
    collide3();
    updateHints3();
    if (state3.boostT > 0 && state3.boostT <= L3_CFG.carArriveMs / 1000) startCar3();       // the car comes in during the last bit of the dash
    else if (state3.T >= L3_CFG.levelLengthSeconds && state3.boostT <= 0) startCar3();       // safety stop: never wait for the donut for ever
  }
  if (state3.phase === 'caught') updateCaught3(dt);
  if (state3.phase === 'car') updateCar3(dt);
  state3.items.forEach(function (it) { if (it.popT !== undefined && it.popT < 1) it.popT = Math.min(1, it.popT + dt / 0.4); });
  var carJump = state3.phase === 'car' && (state3.car.stage === 'hop' || state3.hop > 4);
  state3.pose = carJump ? 'jump' : state3.phase === 'caught' ? 'jump' : state3.jumpT >= 0 ? 'jump' : state3.stumbleT >= 0 ? 'stumble' : 'run';
  var toX = lane3XAt(state3.lane, L3_SZ);
  if (state3.slideT < 1) { state3.slideT = Math.min(1, state3.slideT + dt * 1000 / L3_SLIDE_MS); var k = state3.slideT * state3.slideT * (3 - 2 * state3.slideT); state3.laneX = state3.slideFrom + (toX - state3.slideFrom) * k; }
  else state3.laneX = toX;
  var bob = l3Calm || state3.phase !== 'run' ? 0 : Math.sin(state3.clock * 13) * 3;
  var ev = drawEruption3(dt) || 0;
  l3bg.style.transform = 'translate(' + state3.shakeX.toFixed(1) + 'px,' + (bob + state3.shakeY).toFixed(1) + 'px) scale(1.03)';
  xfTick(chaseXF); xfTick(rumbleXF); xfTick(rollXF);
  l3lines.style.opacity = (state3.phase === 'run' ? (l3Calm ? 0.25 : 0.2 + 0.12 * Math.abs(Math.sin(state3.clock * 5))) : 0.15) + 0.4 * (state3.boostK - 1) / Math.max(0.01, L3_CFG.boostSpeed - 1);   // stronger speed lines in the boost
  glow3.style.opacity = (l3Calm ? 0.55 : Math.min(1, 0.45 + 0.35 * Math.sin(state3.glowT * Math.PI * 2000 / L3_CFG.glowPulseMs) + 0.2 * ev)).toFixed(2);   // a slow pulse (about one every 2.2s), a little brighter in an eruption
  var wob = l3Calm ? 0 : Math.sin(state3.clock * 3) * 8;
  wave3.style.transform = 'translateY(' + (-state3.lava * L3_WAVE_MAX + (state3.lava > 0 ? wob : 0)).toFixed(1) + 'px)';
  if (state3.phase === 'car') state3.scen += dt * L3_CFG.runSpeed * state3.carK;
  else if (state3.phase === 'run' || state3.phase === 'caught') state3.scen += (state3.T - T0) * l3BoostK();   // the scenery follows the run (it slides back with a catch) and goes faster in the boost
  drawScenery3();
  drawLaunches3(state3.T);
  rockSounds3(T0);
  drawItems3();
  drawDonut3();
  drawZacky3();
}
