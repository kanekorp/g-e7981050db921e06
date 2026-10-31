/* Zacky's Lava Quest, level 3 (lava chase). Loaded after the main script in index.html, so it shares its globals
   (stage, showScreen, keys, sfx, playMusic, L3_CFG ...). All coordinates are 1920x1080 stage pixels. */
const L3_VP = { x: 966, y: 478 };        // the vanishing point of the path in volcano_chase_bg.jpg
const L3_FOOT = 1000;                    // where Zacky's feet are (he never moves up or down)
const L3_SZ = (L3_FOOT - L3_VP.y) / (1080 - L3_VP.y);   // perspective scale (0 at the vanishing point, 1 at the bottom edge) at Zacky's feet
const L3_SC = 0.537;                     // Zacky's run frames are 140x350 but about half the scale of Zacky_stand (about 188px of him on the stage)
const L3_FRAMES = { run: ['Zacky_run_front_1.png', 'Zacky_run_front_2.png', 'Zacky_run_front_3.png', 'Zacky_run_front_4.png'], jump: 'Zacky_jump_front.png', stumble: 'Zacky_stumble_front.png' };
const L3_SIZE = { run: [140, 350], jump: [218, 321], stumble: [238, 343] };
const L3_RUN_FRAME_MS = 110;
const L3_SLIDE_MS = 150;                 // a lane change takes this long
const L3_TRAVEL = 2.0;                   // seconds of running an item is visible for, from the vanishing point to Zacky
const L3_PERSP = 1.8;                    // how fast things grow as they come closer
const L3_ITEM = { g: { src: 'gem.png', w: 68, h: 80, sc: 1.7, lift: 34 }, L: { src: 'log.png', w: 400, h: 124, sc: 0.75, lift: 0 }, G: { src: 'gap.png', w: 400, h: 120, sc: 0.75, lift: 0 } };
/* The fixed, hand-written item list: [slot, lane, type]; slot * spawnGapMs is the moment the item reaches Zacky. g = gem, L = log, G = gap (jump over both).
   Lanes 0, 1, 2 = left, middle, right. Every run has exactly this layout; there is nothing random in level 3. */
const L3_LIST = [
  [3, 1, 'g'], [5, 1, 'g'], [7, 1, 'g'],              // three gems straight ahead: the first one reaches him at 1.5s, a free start
  [12, 1, 'L'],                                        // the first log, in the middle lane at 6s (the jump hint shows just before it)
  [16, 0, 'g'], [18, 0, 'g'],
  [21, 2, 'G'],                                        // the first gap, off to the side
  [24, 0, 'L'], [24, 1, 'L'],                          // two logs side by side: jump, or slide right
  [29, 2, 'g'], [31, 2, 'g'], [33, 2, 'g'],
  [38, 1, 'G'], [40, 2, 'L'], [42, 0, 'L'],
  [46, 1, 'g'], [48, 2, 'G'], [50, 1, 'L'], [52, 0, 'g'],
  [54, 2, 'L'], [56, 0, 'G'], [58, 2, 'g'], [60, 0, 'L'], [62, 2, 'G'],
  [64, 1, 'g'], [66, 1, 'L'], [70, 0, 'G'],
  [74, 0, 'L'], [77, 1, 'G']                           // two more for the last seconds (37s and 38.5s) so the end is not empty
];
const L3_JUMP_PEAK = 190;                // px a jump rises
const L3_CLEAR = 0.25;                   // above this fraction of the peak Zacky is over a log or gap
const L3_HIT_WIN = 0.13;                 // an obstacle counts while it is within this many run seconds of Zacky (so a jump has about 340ms of slack)
const L3_GEM_WIN = 0.22;                 // a gem is picked up within this many run seconds (even in the air)
const L3_STUMBLE_S = 0.55;               // the stumble pose lasts this long (he never stops running)
const L3_WAVE_MAX = 440;                 // px of the lava wave showing when it has caught up (1.0)
const L3_BOUNCE_S = 1.3;                 // the soft bounce back to the checkpoint takes this long
const L3_FIN_RUN_S = 1.2, L3_FIN_HOP_S = 0.5, L3_FIN_END_S = 4.2;    // the finish: the hill grows, Zacky hops up, cheers, the lava stops short and sinks, then the celebration
const L3_HILL = { w: 520, h: 142, lift: 96 };   // safe_hill.png (800x219) at this size; Zacky stands lift px above the foot line
const L3_HINT_JUMP_LEAD = 1.9, L3_HINT_LANE_AT = 8.0, L3_HINT_LANE_S = 3.5;   // the jump hint shows this many run seconds before the first log; the arrows hint from this run second (after the log), for this long
const L3_FLASH_MAX = 0.35;               // the soft orange flash on a catch never goes above this opacity (and is off in reduced motion)
const L3_INVULN_S = 3.0;                 // after a bounce nothing trips him for this long (gems still count)
const L3_TRIP_GUARD_S = 0.5;             // after a trip a second trip is blocked for this long, so mashing into two logs cannot double-trip
const chaseMusic = document.getElementById('chaseMusic');
const z3 = document.getElementById('z3'), z3img = document.getElementById('z3img'), l3bg = document.getElementById('l3bg'), l3lines = document.getElementById('l3lines');
const hud3 = ZackyShared.gemHud(document.getElementById('hud3'), L3_LIST.filter(function (r) { return r[2] === 'g'; }).length, 'gem.png');
const wave3 = document.getElementById('wave3'), flash3 = document.getElementById('flash3'), whoops3 = document.getElementById('whoops3');
const world3 = document.getElementById('world3');
const hint3 = document.getElementById('hint3');
const hints3 = { jump: 0, lanes: 0, laneT: 0 };            // 0 = not shown yet, 1 = showing, 2 = done (every hint shows once and then never again)
const ready3 = document.getElementById('ready3'), hill3 = document.getElementById('hill3'), glow3 = document.getElementById('glow3'), rumbleSfx = document.getElementById('rumbleSfx'), cheerSfx = document.getElementById('cheerSfx');
const l3Calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const state3 = { phase: 'ready', clock: 0, lane: 1, laneX: 0, pose: 'run', slideFrom: 0, slideT: 1, T: 0, items: [], gems: 0, trips: 0, jumpT: -1, stumbleT: -1, lava: 0, caughtT: 0, caughtFrom: 0, caughtTo: 0, hop: 0, invuln: 0, tripGuard: 0, catches: 0, fin: 0, lastHop: 0, glowT: 0 };    // ready (still screen, waiting for Enter) -> run -> finish

function item3Lane(l) { return Math.max(0, Math.min(L3_CFG.laneCount - 1, l + Math.round((L3_CFG.laneCount - 3) / 2))); }   // the list's 3 lanes sit in the middle of the lanes
function item3At(it) { return it.slot * L3_CFG.spawnGapMs / 1000; }               // the moment (run seconds) the item reaches Zacky
function item3Pos(it, T) {                                                         // where an item is at run time T: d runs 0 (vanishing point) to 1 (at Zacky), then on past him
  var d = 1 - (item3At(it) - T) / L3_TRAVEL, sc = L3_SZ * Math.pow(Math.max(d, 0), L3_PERSP);
  return { d: d, s: sc, x: lane3XAt(it.lane, sc), y: L3_VP.y + (1080 - L3_VP.y) * sc };
}
function buildItems3() {
  world3.innerHTML = ''; state3.items = [];
  L3_LIST.forEach(function (r) {
    var t = L3_ITEM[r[2]], el = document.createElement('div'), im = document.createElement('img');
    el.className = 'it t-' + r[2]; im.src = t.src; im.alt = ''; im.width = t.w; im.height = t.h; im.style.left = (-t.w / 2) + 'px'; im.style.top = (-t.h) + 'px';
    el.appendChild(im); world3.appendChild(el);
    state3.items.push({ slot: r[0], lane: item3Lane(r[1]), type: r[2], el: el, img: im, hit: false, shown: false });
  });
}
function drawItems3() {
  state3.items.forEach(function (it) {
    var p = item3Pos(it, state3.T), t = L3_ITEM[it.type], vis = p.d > 0.03 && p.d < 1.12 && (!it.gone || it.popT < 1);
    if (vis !== it.shown) { it.el.style.display = vis ? 'block' : 'none'; it.shown = vis; }
    if (!vis) return;
    var bob = it.type === 'g' && !l3Calm ? Math.sin(state3.clock * 5 + it.slot) * 8 * p.s : 0;
    it.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + (p.y - t.lift * p.s * t.sc + bob).toFixed(1) + 'px)';
    var pop = it.popT === undefined ? 0 : it.popT;
    if (pop) it.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + (p.y - t.lift * p.s * t.sc - 70 * pop).toFixed(1) + 'px)';
    it.img.style.opacity = 1 - pop;
    it.img.style.transform = 'scale(' + (p.s * t.sc * (1 + 0.9 * pop)).toFixed(4) + ')';
    it.el.classList.toggle('near', p.d > 1);
  });
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
  state3.lava = 0; state3.hop = 0; state3.invuln = 0; state3.catches = 0; state3.fin = 0; state3.lastHop = 0; hints3.jump = 0; hints3.lanes = 0; hints3.laneT = 0; hint3.classList.remove('on'); state3.tripGuard = 0;
  hill3.style.display = 'none'; world3.style.opacity = 1; rumbleSfx.pause(); flash3.style.opacity = 0; whoops3.classList.remove('on');
  buildItems3(); hud3.set(0);
  ready3.style.display = 'block';
  drawZacky3(0);
}
function beginRun3() {
  state3.phase = 'run';
  ready3.style.display = 'none';
  playMusic(chaseMusic);
  if (audioUnlocked) { rumbleSfx.volume = 0.22; rumbleSfx.currentTime = 0; rumbleSfx.play().catch(function () {}); }   // a low volcano rumble under the chase
}
function showHint3(html) { hint3.innerHTML = html; hint3.classList.add('on'); }
function endHint3(which) { hints3[which] = 2; hint3.classList.remove('on'); }
function updateHints3(dt) {
  if (!L3_CFG.hintsOn) return;
  var first = state3.items.find(function (it) { return it.type === 'L'; }), at = first ? item3At(first) : 0;
  if (hints3.jump === 0 && hints3.lanes === 0 && state3.T >= at - L3_HINT_JUMP_LEAD && state3.T < at) { hints3.jump = 1; showHint3('Press <b class="keycap wide">Space</b> to jump!'); }
  else if (hints3.jump === 1 && state3.T >= at + L3_HIT_WIN) endHint3('jump');
  if (hints3.jump === 2 && hints3.lanes === 0 && state3.T >= L3_HINT_LANE_AT) { hints3.lanes = 1; hints3.laneT = 0; showHint3('Press <b class="keycap">&larr;</b> <b class="keycap">&rarr;</b> to move!'); }
  else if (hints3.lanes === 1) { hints3.laneT += dt; if (hints3.laneT >= L3_HINT_LANE_S) endHint3('lanes'); }
}
function startFinish3() {                                          // levelLengthSeconds of running done: the safe hill (it always plays, whatever happened before)
  state3.phase = 'finish'; state3.fin = 0; state3.lastHop = 0; state3.jumpT = -1; state3.stumbleT = -1; state3.T = Math.max(state3.T, L3_CFG.levelLengthSeconds);
  state3.lane = midLane3(); state3.slideFrom = state3.laneX; state3.slideT = 0;
  hill3.style.display = 'block'; hill3.style.opacity = 0; whoops3.classList.remove('on'); flash3.style.opacity = 0;
  stopMusic(); rumbleSfx.pause(); hints3.jump = hints3.lanes = 2; hint3.classList.remove('on');
}
function updateFinish3(dt) {
  state3.fin += dt; var f = state3.fin;
  var g = Math.min(1, f / L3_FIN_RUN_S), gs = g * g * (3 - 2 * g);   // the hill grows out of the distance
  var hs = 0.12 + 0.88 * gs, hy = L3_VP.y + 70 + (L3_FOOT + 34 - L3_VP.y - 70) * gs;
  hill3.style.opacity = Math.min(1, f / 0.3);
  hill3.style.width = (L3_HILL.w * hs).toFixed(1) + 'px'; hill3.style.height = (L3_HILL.h * hs).toFixed(1) + 'px';
  hill3.style.transform = 'translate(' + (L3_VP.x - L3_HILL.w * hs / 2).toFixed(1) + 'px,' + (hy - L3_HILL.h * hs).toFixed(1) + 'px)';
  world3.style.opacity = Math.max(0, 1 - f / 0.6);                     // nothing else is on the path any more
  var h0 = L3_FIN_RUN_S, h1 = L3_FIN_RUN_S + L3_FIN_HOP_S;
  if (f < h0) { state3.clock += dt; state3.hop = 0; }
  else if (f < h1) { var u = (f - h0) / L3_FIN_HOP_S; state3.hop = L3_HILL.lift * u + Math.sin(Math.PI * u) * 70; if (state3.lastHop !== 1) { state3.lastHop = 1; sfx(jumpSfx, 0.6); } }
  else {
    state3.hop = L3_HILL.lift + (l3Calm ? 0 : Math.max(0, Math.sin((f - h1) * 7)) * 22);       // up on the hill, cheering with little hops
    if (state3.lastHop !== 2) { state3.lastHop = 2; sfx(cheerSfx, 0.8); }
  }
  state3.lava = f < 1.4 ? state3.lava + (0.2 - state3.lava) * Math.min(1, dt * 3) : Math.max(0, state3.lava - dt * 0.3);   // the wave stops short of the hill, then sinks
  if (f >= L3_FIN_END_S) { state3.phase = 'done'; endLevel3(); }
}
function endLevel3() {                                             // level 3 complete: confetti, the gem total, Enter goes back to the title
  var row = document.getElementById('gemRow3'), total = hud3.total;
  row.textContent = '';
  for (var i = 0; i < total; i++) { var im = document.createElement('img'); im.src = 'gem.png'; im.alt = ''; if (i >= state3.gems) im.className = 'miss'; row.appendChild(im); }
  document.getElementById('count3').textContent = state3.gems + ' of ' + total + ' gems!';
  rumbleSfx.pause();
  showScreen('celebrate3', function () { playMusic(titleMusic); });
}
function level3Done3Key(key) { if (key === 'Enter') startLevel3(); }      // "Press Enter to play again" really plays level 3 again (the title tune keeps playing into the ready screen)
function level3Key(key, isRepeat) {
  if (state3.phase === 'finish' || state3.phase === 'done') return;
  if (state3.phase === 'ready' && key === 'Enter' && !isRepeat) beginRun3();
  if (state3.phase === 'run' && !isRepeat && ZackyShared.isJumpKey(key)) jump3();
  if (state3.phase === 'run' && !isRepeat && (key === 'ArrowLeft' || key === 'ArrowRight')) changeLane3(key === 'ArrowLeft' ? -1 : 1);
}
function jump3() { if (state3.jumpT >= 0) return; if (hints3.jump === 1) endHint3('jump'); else if (hints3.jump === 0) hints3.jump = 2; state3.jumpT = 0; sfx(jumpSfx, 0.6); }
function jumpH3() { if (state3.jumpT < 0) return 0; var u = Math.min(1, state3.jumpT / L3_CFG.jumpMs); return 4 * u * (1 - u) * L3_JUMP_PEAK; }
function overItem3() { return jumpH3() > L3_CLEAR * L3_JUMP_PEAK; }           // high enough to clear a log or gap right now
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
  sfx(whoopsSfx, 0.8); whoops3.classList.add('on'); if (hints3.jump === 1) endHint3('jump'); if (hints3.lanes === 1) endHint3('lanes');
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
function collide3() {
  if (state3.invuln > 0) return;                                               // right after a bounce, nothing trips him
  state3.items.forEach(function (it) {
    if (it.gone || it.lane !== state3.lane) return;
    var dT = state3.T - item3At(it);
    if (it.type === 'g') {
      if (Math.abs(dT) < L3_GEM_WIN) { it.gone = true; it.popT = 0; state3.gems++; sfx(gemSfx, 0.7); hud3.set(state3.gems); }
    } else if (Math.abs(dT) < L3_HIT_WIN && !it.tripped && state3.tripGuard <= 0 && !overItem3()) trip3(it);
  });
}
function changeLane3(dir) {                                        // exactly one lane per press, never past the outer lanes
  var to = Math.max(0, Math.min(L3_CFG.laneCount - 1, state3.lane + dir));
  if (to === state3.lane) return;
  if (hints3.lanes === 1) endHint3('lanes'); else if (hints3.lanes === 0) hints3.lanes = 2;
  state3.lane = to; state3.slideFrom = state3.laneX; state3.slideT = 0;
}
function drawZacky3() {
  var pose = state3.pose, f = pose === 'run' ? L3_FRAMES.run[Math.floor(state3.clock * 1000 / L3_RUN_FRAME_MS) % 4] : L3_FRAMES[pose];
  if (state3.phase === 'ready' || (state3.phase === 'finish' && state3.fin >= L3_FIN_RUN_S)) f = pose === 'run' ? L3_FRAMES.run[0] : f;
  if (z3img.getAttribute('src') !== f) z3img.setAttribute('src', f);
  z3img.style.width = (L3_SIZE[pose][0] * L3_SC) + 'px';
  z3img.style.top = (-jumpH3() - state3.hop).toFixed(1) + 'px';
  var bounce = (state3.phase === 'run' || (state3.phase === 'finish' && state3.fin < L3_FIN_RUN_S)) && pose === 'run' && !l3Calm ? -Math.abs(Math.sin(state3.clock * Math.PI * 1000 / L3_RUN_FRAME_MS / 2)) * 8 : 0;
  z3.style.transform = 'translate(' + state3.laneX.toFixed(1) + 'px,' + (L3_FOOT + bounce).toFixed(1) + 'px)';
}
function level3Frame(dt) {
  state3.glowT += dt;                                                         // the crater glow pulses on every screen state
  if (!walkSfx.paused) walkSfx.pause();
  if (state3.phase === 'run') { state3.clock += dt; state3.T += dt * L3_CFG.runSpeed; }     // runSpeed 2 = the run, and the items, go twice as fast
  if (state3.phase === 'run') {
    if (state3.jumpT >= 0) { state3.jumpT += dt * 1000; if (state3.jumpT >= L3_CFG.jumpMs) state3.jumpT = -1; }
    if (state3.stumbleT >= 0) { state3.stumbleT += dt; if (state3.stumbleT >= L3_STUMBLE_S) state3.stumbleT = -1; }
    state3.lava = Math.max(0, state3.lava - L3_CFG.lavaRecover * dt);          // the wave slowly backs off
    if (state3.invuln > 0) state3.invuln = Math.max(0, state3.invuln - dt);
    if (state3.tripGuard > 0) state3.tripGuard = Math.max(0, state3.tripGuard - dt);
    collide3();
    updateHints3(dt);
    if (state3.T >= L3_CFG.levelLengthSeconds) startFinish3();
  }
  if (state3.phase === 'caught') updateCaught3(dt);
  if (state3.phase === 'finish') updateFinish3(dt);
  state3.items.forEach(function (it) { if (it.popT !== undefined && it.popT < 1) it.popT = Math.min(1, it.popT + dt / 0.4); });
  var fin = state3.phase === 'finish' && state3.fin >= L3_FIN_RUN_S;
  state3.pose = fin ? (state3.fin < L3_FIN_RUN_S + L3_FIN_HOP_S || state3.hop > L3_HILL.lift + 4 ? 'jump' : 'run') : state3.phase === 'caught' ? 'jump' : state3.jumpT >= 0 ? 'jump' : state3.stumbleT >= 0 ? 'stumble' : 'run';
  var toX = lane3XAt(state3.lane, L3_SZ);
  if (state3.slideT < 1) { state3.slideT = Math.min(1, state3.slideT + dt * 1000 / L3_SLIDE_MS); var k = state3.slideT * state3.slideT * (3 - 2 * state3.slideT); state3.laneX = state3.slideFrom + (toX - state3.slideFrom) * k; }
  else state3.laneX = toX;
  var bob = l3Calm || state3.phase !== 'run' ? 0 : Math.sin(state3.clock * 13) * 3;
  l3bg.style.transform = 'translateY(' + bob.toFixed(1) + 'px) scale(1.03)';
  l3lines.style.opacity = state3.phase === 'run' ? (l3Calm ? 0.25 : 0.2 + 0.12 * Math.abs(Math.sin(state3.clock * 5))) : 0.15;
  glow3.style.opacity = (l3Calm ? 0.55 : 0.45 + 0.35 * Math.sin(state3.glowT * 2.2)).toFixed(2);
  var wob = l3Calm ? 0 : Math.sin(state3.clock * 3) * 8;
  wave3.style.transform = 'translateY(' + (-state3.lava * L3_WAVE_MAX + (state3.lava > 0 ? wob : 0)).toFixed(1) + 'px)';
  drawItems3();
  drawZacky3();
}
