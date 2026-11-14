/* Lava Tree boss (stage 'boss', stateB). B1-B6 as before; B7 friendly, uh-oh, boom and fade to white. */
const L_BOSS_POSES_BLASTER = { stand: 'Zacky_blaster.png', walk: 'Zacky_blaster_walk.png', jump: 'Zacky_blaster.png' };
const L_BOSS_POSES_SUPER = { stand: 'assets/level-boss/Zacky_super.png', walk: 'assets/level-boss/Zacky_super_walk.png', jump: 'assets/level-boss/Zacky_super.png' };

const stateB = { t: 0, phase: 'intro', musicOn: false, fired: 0, sprayCd: 0, armed: false, woke: false, pfft: false, pfftMaxX: 0, swapped: false, hintOn: false, lastSplash: 0, pupX: 0, gunCarried: false };
const worldB = document.getElementById('worldB');

(function buildBoss() {
  var h = L_BOSS_CFG.treeH, w = Math.round(640 * h / 900), x = L_BOSS_CFG.treeX, y = FLOOR_Y;
  function tree(src, id) {
    var i = document.createElement('img'); i.id = id; i.src = src; i.alt = '';
    i.style.cssText = 'position:absolute;left:' + (x - w / 2) + 'px;top:' + (y - h) + 'px;width:' + w + 'px;height:' + h + 'px;z-index:5;pointer-events:none;transform-origin:50% 100%';
    worldB.appendChild(i); return i;
  }
  tree('assets/level-boss/lava_tree_hot.png', 'treeBhot');
  var fr = tree('assets/level-boss/lava_tree_friendly.png', 'treeBfriendly');
  fr.style.opacity = '0';                                                 // B4 fades this in
  var pup = document.createElement('img'); pup.id = 'pupB'; pup.src = 'friendly_character.png'; pup.alt = '';
  pup.style.cssText = 'position:absolute;height:' + L_BOSS_CFG.biscuitH + 'px;z-index:6;display:none';
  worldB.appendChild(pup);
  var gun = document.createElement('img'); gun.id = 'gunB'; gun.src = 'assets/level-boss/super_splasher.png'; gun.alt = '';
  gun.style.cssText = 'position:absolute;width:160px;z-index:7;display:none';
  worldB.appendChild(gun);
  var glow = document.createElement('img'); glow.id = 'glowB'; glow.src = 'volcano_glow_v2.png'; glow.alt = '';
  worldB.appendChild(glow);
  var uh = document.createElement('div'); uh.id = 'uhOhB'; uh.setAttribute('aria-hidden', 'true'); uh.textContent = 'Uh-oh!';
  worldB.appendChild(uh);
})();
const pupB = document.getElementById('pupB'), gunB = document.getElementById('gunB'), hintB = document.getElementById('hintB');
const treeBhot = document.getElementById('treeBhot'), treeBfriendly = document.getElementById('treeBfriendly');
const glowB = document.getElementById('glowB'), uhOhB = document.getElementById('uhOhB'), whiteB = document.getElementById('whiteB');
const blobsB = [], puddlesB = [], rocksB = [];
const barB = document.getElementById('barB');
(function buildBarB() {
  barB.innerHTML = '';
  var i, im;
  for (i = 0; i < L_BOSS_CFG.flames; i++) {
    im = document.createElement('img'); im.src = 'assets/level-boss/flame_icon.png'; im.alt = '';
    barB.appendChild(im);
  }
})();

/* ── boss music: Web Audio loop, trimmed to 64s so the 26ms mp3 pad does not gap ── */
var bossAudioCtx = null, bossMusicBuf = null, bossMusicAb = null, bossMusicSrc = null, bossWantMusic = false;
(function loadBossMusic() {
  fetch('assets/level-boss/boss_music.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
    bossMusicAb = ab;
    if (bossWantMusic && stage === 'boss' && audioUnlocked) playBossMusic();
  }).catch(function () {});
})();
function bossCtx() {
  if (!bossAudioCtx) bossAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (bossAudioCtx.state === 'suspended') bossAudioCtx.resume();
  return bossAudioCtx;
}
function stopBossMusic() {
  bossWantMusic = false;
  if (bossMusicSrc) { try { bossMusicSrc.stop(); } catch (e) {} bossMusicSrc = null; }
  var el = document.getElementById('bossMusic');
  if (el) { el.pause(); el.currentTime = 0; }
  stateB.musicOn = false;
}
function playBossMusic() {
  bossWantMusic = true;
  stopMusicHtml();
  if (!audioUnlocked) return;
  stopBossMusic();
  bossWantMusic = true;
  if (!bossMusicBuf && bossMusicAb) {
    bossCtx().decodeAudioData(bossMusicAb.slice(0)).then(function (buf) {
      bossMusicBuf = buf;
      if (bossWantMusic && stage === 'boss') playBossMusic();
    }).catch(function () { playBossMusicEl(); });
    return;
  }
  if (bossMusicBuf) {
    try {
      var ctx = bossCtx(), src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = bossMusicBuf;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = Math.min(L_BOSS_CFG.musicLoopEnd, bossMusicBuf.duration);
      g.gain.value = L_BOSS_CFG.musicVol;
      src.connect(g); g.connect(ctx.destination);
      src.start(0);
      bossMusicSrc = src;
      stateB.musicOn = true;
      return;
    } catch (e) {}
  }
  playBossMusicEl();
}
function playBossMusicEl() {
  var el = document.getElementById('bossMusic');
  if (el) { el.volume = L_BOSS_CFG.musicVol; el.play().catch(function () {}); stateB.musicOn = true; }
}
function stopMusicHtml() {
  if (currentMusic) { currentMusic.pause(); currentMusic.currentTime = 0; currentMusic = null; }
}
(function wrapMusic() {
  var _play = playMusic, _stop = stopMusic;
  playMusic = function (track) { stopBossMusic(); _play(track); };
  stopMusic = function () { stopBossMusic(); _stop(); };
})();
audioUnlockHandlers.push(function () { if (bossWantMusic && stage === 'boss') playBossMusic(); });

function placePup(x) {
  stateB.pupX = x;
  pupB.style.display = '';
  pupB.style.left = (x - 66) + 'px';
  pupB.style.top = (FLOOR_Y + 6 - L_BOSS_CFG.biscuitH) + 'px';
}
function placeGun(x, y, carried) {
  gunB.style.display = '';
  var w = 160, h = 160 * 150 / 220;
  gunB.style.left = (x - w / 2) + 'px';
  gunB.style.top = (y - h) + 'px';
  stateB.gunCarried = !!carried;
}
function clearBlobsB() {
  blobsB.slice().forEach(function (b) { removeBlob(b, blobsB); });
}
function clearPuddlesB() {
  puddlesB.forEach(function (p) { if (p.el && p.el.parentNode) p.el.remove(); });
  puddlesB.length = 0;
}
function leavePuddle(x, kind) {                                          // looks only: a shiny blue puddle on the sand, 40 at most
  if (stateB.phase !== 'fight') return;
  while (puddlesB.length >= L_BOSS_CFG.maxPuddles) { var old = puddlesB.shift(); if (old.el && old.el.parentNode) old.el.remove(); }
  var el = document.createElement('div'), drip = kind === 'drip';
  var w = drip ? 54 + stateB.fired % 14 : 78 + (puddlesB.length * 7) % 36, h = w * 0.3;
  el.className = 'puddleB' + (drip ? ' drip' : '');
  el.style.cssText = 'left:' + (x - w / 2).toFixed(1) + 'px;top:' + (FLOOR_Y - h * 0.4).toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px';
  worldB.appendChild(el);
  puddlesB.push({ el: el, x: x });
}
function resetBoss() {
  stateB.t = 0; stateB.phase = 'intro'; stateB.fired = 0; stateB.sprayCd = 0;
  stateB.armed = false; stateB.woke = false; stateB.pfft = false; stateB.pfftMaxX = 0; stateB.swapped = false;
  stateB.hintOn = false; stateB.lastSplash = 0; stateB.pupX = -80; stateB.gunCarried = false;
  stateB.hits = 0; stateB.flameOuts = 0; stateB.lastHit = 0;
  stateB.bounce = null; stateB.rockHits = 0; stateB.lastFizz = 0; stateB.whoops = false;
  stateB.fightT = 0; stateB.throwCd = 0; stateB.phase2N = 0; stateB.helping = false; stateB.helpStage = ''; stateB.helped = 0;
  stateB.endT = 0; stateB.endStage = ''; stateB.endLean = 0; stateB.endWave = 0; stateB.endShake = 0; stateB.endGlow = 0; stateB.clipStarted = false; stateB.boomed = false;
  player.x = L_BOSS_CFG.spawnX; player.y = FLOOR_Y; player.vx = 0; player.vy = 0; player.onGround = true; player.face = 1; player.jumpBuffer = 0; player.walkT = 0; player.invuln = 0;
  zackyEl.style.opacity = ''; zackyEl.classList.remove('blink', 'stumbleB');
  curPoses = L_BOSS_POSES_BLASTER; zackyEl.src = curPoses.stand; player.pose = curPoses.stand;
  walkSfx.pause();
  clearBlobsB(); clearPuddlesB(); clearRocksB();
  pupB.style.display = 'none'; gunB.style.display = 'none'; hintB.classList.remove('on'); hintB.innerHTML = '';
  treeBhot.style.transform = treeBfriendly.style.transform = '';
  treeBhot.style.opacity = '1'; treeBfriendly.style.opacity = '0';
  worldB.style.transform = '';
  if (glowB) { glowB.style.display = 'none'; glowB.style.opacity = '0'; }
  if (uhOhB) uhOhB.classList.remove('on');
  if (whiteB) whiteB.style.opacity = '0';
  var rs = document.getElementById('rumbleSfx'); if (rs) { try { rs.pause(); rs.currentTime = 0; } catch (e) {} }
  barB.classList.remove('on'); paintBarB();
  Array.prototype.slice.call(worldB.querySelectorAll('.sparkB, .steamB, .dropB, .helpSquirtB')).forEach(function (e) { e.remove(); });
  playBossMusic();
  renderZacky();
}
function startBoss() {
  walkSfx.pause();
  showScreen('boss', function () {
    mountZacky('boss');
    setRig([], L_BOSS_POSES_BLASTER, L_BOSS_CFG.walkSpeed);
    resetBoss();
  });
}
function wakeTree() {
  if (stateB.woke) return;
  stateB.woke = true;
  sfx(document.getElementById('treeWakeSfx'), 0.85);
}
function pfftSplash() {
  if (stateB.pfft) return;
  stateB.pfft = true;
  var e = document.createElement('img'); e.src = 'water_blob.png'; e.alt = ''; e.className = 'abs blob';
  e.style.cssText = 'width:' + BLOB_W + 'px;z-index:8;left:0;top:0';
  worldB.appendChild(e);
  var b = { x: player.x + 70, y: player.y - 70, dir: 1, travel: 0, age: 0, el: e, w: BLOB_W, pfft: true };
  blobsB.push(b); drawBlob(b);
  sfx(document.getElementById('sprayAudio'), 0.35);
}
function sparkleSwap() {
  var i, e;
  for (i = 0; i < 5; i++) {
    e = document.createElement('img'); e.src = 'sparkle.png'; e.alt = ''; e.className = 'sparkB';
    e.style.cssText = 'position:absolute;width:46px;height:46px;left:' + (player.x - 23 + (i - 2) * 22) + 'px;top:' + (player.y - 140 - (i % 2) * 30) + 'px;z-index:25;pointer-events:none';
    worldB.appendChild(e);
    (function (el) { setTimeout(function () { if (el.parentNode) el.remove(); }, 700); })(e);
  }
  sfx(document.getElementById('pickupSfx'), 0.85);
}
function swapToSuper() {
  if (stateB.swapped) return;
  stateB.swapped = true; stateB.armed = true;
  curPoses = L_BOSS_POSES_SUPER; zackyEl.src = curPoses.stand; player.pose = curPoses.stand;
  gunB.style.display = 'none';
  sparkleSwap();
}
function showHintB(on) {
  stateB.hintOn = !!on;
  if (on && !hintB.innerHTML) hintB.innerHTML = '<span class="keycap wide space-pic" aria-hidden="true"><span class="drop"></span></span>';
  hintB.style.left = (L_BOSS_CFG.biscuitX + 70) + 'px';
  hintB.style.top = (FLOOR_Y - 230) + 'px';
  hintB.classList.toggle('on', stateB.hintOn);
}
function endIntro() {
  if (stateB.phase === 'fight') return;
  stateB.phase = 'fight';
  player.y = FLOOR_Y; player.vy = 0; player.onGround = true; player.vx = 0;
  if (player.x < L_BOSS_CFG.introEndX) player.x = L_BOSS_CFG.introEndX;
  if (!stateB.woke) wakeTree();
  if (!stateB.swapped) swapToSuper();
  placePup(L_BOSS_CFG.biscuitX);
  gunB.style.display = 'none';
  clearBlobsB();
  showHintB(true);
  stateB.lastSplash = stateB.t;
  stateB.lastHit = stateB.t;                                          // the 20s Biscuit clock starts when the fight does
  stateB.fightT = 0;
  stateB.throwCd = L_BOSS_CFG.phase4ArcEveryS;
  stateB.phase2N = 0;
  stateB.helping = false; stateB.helpStage = '';
  treeBhot.style.transform = treeBfriendly.style.transform = '';
  barB.classList.add('on'); paintBarB(); paintTreeFade();
}
function sprayB() {
  if (!stateB.armed || stateB.phase !== 'fight') return;
  var n = blobsB.length;
  sprayBlob({ blobs: blobsB, world: worldB, armed: true, maxBlobs: L_BOSS_CFG.maxBlobs, speed: L2_CFG.blobSpeed, vol: 0.7, gap: ZackyShared.FIRE_GAP, st: stateB, onSpray: function () { stateB.lastSplash = stateB.t; showHintB(false); } }, null);
  if (blobsB.length > n) {
    var b = blobsB[blobsB.length - 1], sc = L_BOSS_CFG.blobScale;
    b.w = BLOB_W * sc; b.el.style.width = b.w + 'px';
    b.sx = player.x;
    drawBlob(b);
    leavePuddle(player.x + 50, 'drip');                                  // a little wet patch under the shot
  }
}
function flamesOutB() { return Math.min(L_BOSS_CFG.flames, Math.floor((stateB.hits || 0) / L_BOSS_CFG.hitsPerFlame)); }
function remainingFlamesB() { return L_BOSS_CFG.flames - flamesOutB(); }
function paintTreeFade() {
  var k = flamesOutB() / L_BOSS_CFG.flames;
  treeBfriendly.style.opacity = String(k);
  treeBhot.style.opacity = String(1 - k);
}
function paintBarB() {
  var out = flamesOutB(), imgs = barB.querySelectorAll('img'), i;
  for (i = 0; i < imgs.length; i++) imgs[i].classList.toggle('out', i >= L_BOSS_CFG.flames - out);   // rightmost flame goes first
  barB.setAttribute('data-count', String(remainingFlamesB()));
  barB.setAttribute('data-hits', String(stateB.hits || 0));
}
function flameOutFx() {
  var x = L_BOSS_CFG.treeX, y = FLOOR_Y - L_BOSS_CFG.treeH * 0.45;
  var st = document.createElement('img'); st.src = 'smoke_puff.png'; st.alt = ''; st.className = 'steamB';
  st.style.left = x + 'px'; st.style.top = y + 'px'; worldB.appendChild(st);
  setTimeout(function () { if (st.parentNode) st.remove(); }, 800);
  var dr = document.createElement('img'); dr.src = 'water_blob.png'; dr.alt = ''; dr.className = 'dropB';
  dr.style.left = (x - 18) + 'px'; dr.style.top = y + 'px'; worldB.appendChild(dr);
  setTimeout(function () { if (dr.parentNode) dr.remove(); }, 700);
  sfx(gemSfx, 0.7);
  stateB.flameOuts = (stateB.flameOuts || 0) + 1;
}
function treeHitB() {                                                          // one blob, or a test helper; the bar never refills
  var cap = L_BOSS_CFG.flames * L_BOSS_CFG.hitsPerFlame;
  if ((stateB.hits || 0) >= cap) return;
  var before = flamesOutB();
  stateB.hits = (stateB.hits || 0) + 1;
  stateB.lastHit = stateB.t;
  paintBarB(); paintTreeFade();
  if (flamesOutB() > before) { flameOutFx(); if (remainingFlamesB() <= 0) startEndingB(); }
}
function clearRocksB() {
  rocksB.slice().forEach(removeRockB);
}
function removeRockB(r) {
  if (!r) return;
  if (r.el && r.el.parentNode) r.el.remove();
  if (r.shadow && r.shadow.parentNode) r.shadow.remove();
  var i = rocksB.indexOf(r); if (i >= 0) rocksB.splice(i, 1);
}
function placeRockB(r) {
  r.el.style.left = (r.x - r.w / 2) + 'px';
  r.el.style.top = (r.y - r.h) + 'px';
  r.el.style.width = r.w + 'px';
  r.el.style.height = r.h + 'px';
  if (r.shadow) {
    var left = (r.flight - r.t) <= L_BOSS_CFG.shadowLeadS && !r.cooled && !r.landed;
    r.shadow.style.display = left ? '' : 'none';
    r.shadow.style.left = r.landX + 'px';
    r.shadow.style.top = FLOOR_Y + 'px';
  }
}
function stampTreeB() {
  treeBhot.style.transform = treeBfriendly.style.transform = 'scale(1, 0.86)';
  setTimeout(function () {
    if (stateB.phase === 'fight') treeBhot.style.transform = treeBfriendly.style.transform = '';
  }, 180);
}
function spawnArcRockB(landX) {
  landX = (landX == null) ? player.x : landX;
  var w = L_BOSS_CFG.arcW, h = Math.round(w * 266 / 300);
  var el = document.createElement('img'); el.src = 'lava_rock.png'; el.alt = ''; el.className = 'rockB'; el.setAttribute('data-kind', 'arc');
  worldB.appendChild(el);
  var sh = document.createElement('div'); sh.className = 'shadowB';
  sh.style.width = (w * 0.95) + 'px'; sh.style.height = (w * 0.28) + 'px';
  worldB.appendChild(sh);
  var r = {
    kind: 'arc', cooled: false, landed: false, t: 0, flight: L_BOSS_CFG.arcFlightS,
    x0: L_BOSS_CFG.treeX - 20, y0: FLOOR_Y - L_BOSS_CFG.treeH * 0.5,
    landX: landX, x: 0, y: 0, w: w, h: h, el: el, shadow: sh
  };
  rocksB.push(r);
  sfx(document.getElementById('rockLaunchSfx'), 0.5);
  stepArcB(r, 0);
  return r;
}
function stepArcB(r, dt) {
  r.t += dt;
  var k = Math.min(1, r.t / r.flight);
  r.x = r.x0 + (r.landX - r.x0) * k;
  r.y = r.y0 + (FLOOR_Y - r.y0) * k - L_BOSS_CFG.arcH * 4 * k * (1 - k);
  if (k >= 1) { r.x = r.landX; r.y = FLOOR_Y; r.landed = true; }
  placeRockB(r);
}
function spawnRollRockB(startX) {
  stampTreeB();
  var w = L_BOSS_CFG.rollW, h = Math.round(w * 133 / 150);
  var el = document.createElement('img'); el.src = 'lava_rock_small.png'; el.alt = ''; el.className = 'rockB'; el.setAttribute('data-kind', 'roll');
  worldB.appendChild(el);
  var r = { kind: 'roll', cooled: false, landed: false, t: 0, x: (startX == null) ? treeLeftB() : startX, y: FLOOR_Y, w: w, h: h, el: el, vx: -L_BOSS_CFG.rollSpeed };
  rocksB.push(r);
  sfx(document.getElementById('rockLaunchSfx'), 0.4);
  placeRockB(r);
  return r;
}
function coolRockB(r) {
  if (!r || r.cooled) return;
  r.cooled = true; r.landed = true; r.vx = 0; r.kind = 'pebble';
  r.el.src = 'lava_rock_small.png'; r.el.classList.add('pebbleB'); r.el.setAttribute('data-kind', 'pebble');
  r.w = L_BOSS_CFG.pebbleW; r.h = Math.round(r.w * 133 / 150); r.y = FLOOR_Y;
  if (r.shadow && r.shadow.parentNode) r.shadow.remove();
  r.shadow = null;
  placeRockB(r);
  sfx(hissSfx, 0.6);
  stateB.lastFizz = stateB.t;
}
function blobCoolsRockB(b) {
  var i, r, bw = (b.w || BLOB_W) * 0.5;
  for (i = 0; i < rocksB.length; i++) {
    r = rocksB[i];
    if (r.cooled) continue;
    if (b.x + bw > r.x - r.w * 0.45 && b.x - bw < r.x + r.w * 0.45 && b.y + 20 > r.y - r.h && b.y - 20 < r.y) {
      coolRockB(r); return true;
    }
  }
  return false;
}
function rockTouchesZackyB(r) {
  if (r.cooled) return false;
  var l = player.x - HALF_W, right = player.x + HALF_W, top = player.y - BODY_H, bot = player.y;
  var rl = r.x - r.w * 0.45, rr = r.x + r.w * 0.45, rt = r.y - r.h * 0.85, rb = r.y;
  return right > rl && l < rr && bot > rt && top < rb;
}
function hopFromRockB() {                                                     // level 1 soft hop back along the fixed startBounce path
  if (stateB.bounce || player.invuln > 0) return;
  var o = Object.assign({}, BOUNCE1, { minX: HALF_W + 12, maxX: L_BOSS_CFG.walkMax });
  var push = L_BOSS_CFG.hopPush;
  var pool = { x: player.x - push + o.clearance, w: Math.max(400, push * 2) };
  stateB.bounce = ZackyShared.startBounce(player, pool, o);
  stateB.bounce.face = 1;                                                     // he still faces the tree
  stateB.rockHits = (stateB.rockHits || 0) + 1;
  stateB.whoops = true;
  player.invuln = L_BOSS_CFG.safeS;
  zackyEl.classList.add('stumbleB', 'blink');
  sfx(document.getElementById('whoopsSfx'), 0.8);
}
function throwPhaseB() {
  var rem = remainingFlamesB();
  return rem >= 4 ? 'grumpy' : rem >= 2 ? 'cross' : rem >= 1 ? 'last' : 'done';
}
function kindSpeedB() { return (stateB.rockHits || 0) >= L_BOSS_CFG.kindSlowAfter ? L_BOSS_CFG.kindSlowMul : 1; }
function oneRockOnlyB() { return (stateB.rockHits || 0) >= L_BOSS_CFG.kindOneAfter; }
function landShortB() { return (stateB.rockHits || 0) >= L_BOSS_CFG.kindShortAfter; }
function liveRocksB() {
  return rocksB.filter(function (r) { return !r.cooled && !((r.kind === 'arc' || r.kind === 'arc-small') && r.landed) && r.kind !== 'pebble'; }).length;
}
function canThrowB() {
  if (stateB.phase !== 'fight') return false;
  if ((stateB.fightT || 0) >= L_BOSS_CFG.throwStopS) return false;
  if (remainingFlamesB() <= 0) return false;
  if (oneRockOnlyB() && liveRocksB() > 0) return false;
  return true;
}
function aimArcX(offset) {
  var minX = HALF_W + 80, maxX = L_BOSS_CFG.walkMax - 40, x, avoid, side;
  if (remainingFlamesB() === 1) {
    avoid = L_BOSS_CFG.aimAvoid;
    side = (offset || 0) < 0 ? -1 : (offset || 0) > 0 ? 1 : -1;
    x = player.x + side * avoid + (offset || 0);
    if (landShortB()) x = Math.min(x, L_BOSS_CFG.treeX - L_BOSS_CFG.landShortDist);
  } else if (landShortB()) {
    x = L_BOSS_CFG.treeX - L_BOSS_CFG.landShortDist;
  } else {
    x = player.x + (offset || 0);
  }
  x = Math.max(minX, Math.min(maxX, x));
  if (remainingFlamesB() === 1 && Math.abs(x - player.x) < L_BOSS_CFG.aimAvoid) {
    x = player.x + L_BOSS_CFG.aimAvoid;
    if (x > maxX) x = player.x - L_BOSS_CFG.aimAvoid;
    x = Math.max(minX, Math.min(maxX, x));
  }
  return x;
}
function scaleRockB(r) {
  var k = kindSpeedB();
  if (r.kind === 'arc' || r.kind === 'arc-small') r.flight = L_BOSS_CFG.arcFlightS / k;
  if (r.kind === 'roll') r.vx = -L_BOSS_CFG.rollSpeed * k;
}
function throwTickB(dt) {
  stateB.fightT = (stateB.fightT || 0) + dt;
  stateB.throwCd = (stateB.throwCd || 0) - dt;
  if (stateB.throwCd > 0 || !canThrowB()) return;
  var rem = remainingFlamesB(), r, i, made = 0, n, spread;
  if (rem >= 4) {
    r = spawnArcRockB(aimArcX()); scaleRockB(r);
    stateB.throwCd = L_BOSS_CFG.phase4ArcEveryS;
  } else if (rem >= 2) {
    stateB.phase2N = (stateB.phase2N || 0) + 1;
    if ((stateB.phase2N % L_BOSS_CFG.phase2ArcEvery) === 0) { r = spawnArcRockB(aimArcX()); scaleRockB(r); }
    else { r = spawnRollRockB(); scaleRockB(r); }
    stateB.throwCd = L_BOSS_CFG.phase2EveryS;
  } else if (rem === 1) {
    n = L_BOSS_CFG.phase1Rocks; spread = L_BOSS_CFG.phase1Spread;
    for (i = 0; i < n; i++) {
      if (oneRockOnlyB() && (liveRocksB() > 0 || made > 0)) break;
      r = spawnArcRockB(aimArcX((i - (n - 1) / 2) * spread));
      r.w = L_BOSS_CFG.rollW; r.h = Math.round(r.w * 133 / 150);
      r.el.src = 'lava_rock_small.png'; r.el.setAttribute('data-kind', 'arc-small'); r.kind = 'arc-small';
      scaleRockB(r); placeRockB(r); made++;
    }
    stateB.throwCd = L_BOSS_CFG.phase1EveryS;
  }
}
function biscuitHelpB() {
  var cap = L_BOSS_CFG.flames * L_BOSS_CFG.hitsPerFlame;
  if ((stateB.hits || 0) >= cap) return;
  var before = flamesOutB(), next = (before + 1) * L_BOSS_CFG.hitsPerFlame;
  stateB.hits = Math.min(cap, next);
  stateB.lastHit = stateB.t;
  stateB.helped = (stateB.helped || 0) + 1;
  paintBarB(); paintTreeFade();
  if (flamesOutB() > before) { flameOutFx(); if (remainingFlamesB() <= 0) startEndingB(); }
}
function squirtFxB() {
  var e = document.createElement('img'); e.src = 'water_blob.png'; e.alt = ''; e.className = 'helpSquirtB';
  e.style.cssText = 'position:absolute;width:70px;z-index:9;left:' + (stateB.pupX + 10) + 'px;top:' + (FLOOR_Y - 140) + 'px';
  worldB.appendChild(e);
  setTimeout(function () { if (e.parentNode) e.remove(); }, 450);
  sfx(document.getElementById('sprayAudio'), 0.7);
}
function startHelpB() {
  if (stateB.helping || stateB.phase !== 'fight' || remainingFlamesB() <= 0) return;
  stateB.helping = true; stateB.helpStage = 'run';
}
function stepHelpB(dt) {
  var dest = treeLeftB() - 40;
  if (remainingFlamesB() <= 0 && stateB.helpStage !== 'back') { stateB.helpStage = 'back'; }
  if (stateB.helpStage === 'run') {
    placePup(Math.min(dest, stateB.pupX + L_BOSS_CFG.biscuitSpeed * dt));
    if (stateB.pupX >= dest) { stateB.helpStage = 'squirt'; stateB.helpSquirtT = 0; }
  } else if (stateB.helpStage === 'squirt') {
    if (!stateB.helpSquirtT) { stateB.helpSquirtT = 0; squirtFxB(); if (stateB.t - (stateB.lastHit || 0) >= L_BOSS_CFG.helpAfterS - 0.05) biscuitHelpB(); }
    stateB.helpSquirtT += dt;
    if (stateB.helpSquirtT >= 0.4) stateB.helpStage = 'back';
  } else if (stateB.helpStage === 'back') {
    placePup(Math.max(L_BOSS_CFG.biscuitX, stateB.pupX - L_BOSS_CFG.biscuitSpeed * dt));
    if (stateB.pupX <= L_BOSS_CFG.biscuitX) { stateB.helping = false; stateB.helpStage = ''; }
  }
}
function helpTickB(dt) {
  if (stateB.phase !== 'fight' || remainingFlamesB() <= 0) { if (stateB.helping) stepHelpB(dt); return; }
  if (stateB.helping) { stepHelpB(dt); return; }
  if (stateB.t - (stateB.lastHit || 0) >= L_BOSS_CFG.helpAfterS) startHelpB();
}
function updateRocksB(dt) {
  rocksB.slice().forEach(function (r) {
    if (r.cooled) { placeRockB(r); return; }
    if ((r.kind === 'arc' || r.kind === 'arc-small') && !r.landed) stepArcB(r, dt);
    else if (r.kind === 'roll') {
      r.x += (r.vx || -L_BOSS_CFG.rollSpeed) * dt;
      r.y = FLOOR_Y;
      if (r.x < -r.w) { removeRockB(r); return; }
      placeRockB(r);
    } else placeRockB(r);
    if (!stateB.bounce && player.invuln <= 0 && rockTouchesZackyB(r)) hopFromRockB();
  });
}
function treeLeftB() { return L_BOSS_CFG.treeX - Math.round(640 * L_BOSS_CFG.treeH / 900) / 2; }
function updateBlobsB(dt) {
  if (stateB.sprayCd > 0) stateB.sprayCd -= dt;
  blobsB.slice().forEach(function (b) {
    var d = L2_CFG.blobSpeed * dt, ground = b.pfft ? BLOB_GROUND_Y : FLOOR_Y - 10;
    b.x += b.dir * d; b.travel += d; b.age = (b.age || 0) + dt;
    if (b.y < ground) b.y = Math.min(ground, b.y + BLOB_DROP * dt);
    if (b.pfft) {
      stateB.pfftMaxX = Math.max(stateB.pfftMaxX, b.x);
      if (b.travel >= L_BOSS_CFG.pfftTravel) { removeBlob(b, blobsB); return; }
    } else {
      if (blobCoolsRockB(b)) { leavePuddle(b.x); removeBlob(b, blobsB); return; }
      var hit = b.x + (b.w || BLOB_W) / 2 >= treeLeftB();
      var land = b.y >= ground - 0.5 && (hit || b.travel > BLOB_LIFE || b.x > 1920 + BLOB_W);
      if (hit || land || b.travel > BLOB_LIFE || b.x > 1920 + BLOB_W) {
        leavePuddle(hit ? Math.min(b.x, L_BOSS_CFG.treeX - 40) : b.x);
        if (hit) treeHitB();
        removeBlob(b, blobsB);
        return;
      }
    }
    drawBlob(b);
  });
}
function introTick(dt) {
  var dest = L_BOSS_CFG.introEndX;
  if (player.x < dest) {
    player.x = Math.min(dest, player.x + L_BOSS_CFG.walkSpeed * dt);
    player.walkT += dt;
    var moving = true, pose = Math.floor(player.walkT / 0.15) % 2 === 0 ? curPoses.walk : curPoses.stand;
    if (zackyEl.src.slice(-pose.length) !== pose) zackyEl.src = pose;
    player.pose = pose;
    if (audioUnlocked && walkSfx.paused) { walkSfx.volume = 0.5; walkSfx.play().catch(function () {}); }
  } else if (!walkSfx.paused) walkSfx.pause();
  if (!stateB.woke && stateB.t >= L_BOSS_CFG.wakeAt) wakeTree();
  if (stateB.woke) {                                                            // a little wake bounce, 0.5s
    var u = Math.max(0, Math.min(1, (stateB.t - L_BOSS_CFG.wakeAt) / 0.5)), sc = u <= 0 ? 1 : 1 + 0.08 * Math.sin(Math.PI * u);
    treeBhot.style.transform = treeBfriendly.style.transform = 'scale(' + sc.toFixed(3) + ')';
  }
  if (!stateB.pfft && stateB.t >= L_BOSS_CFG.pfftAt) pfftSplash();
  if (stateB.t >= L_BOSS_CFG.biscuitAt) {
    if (pupB.style.display === 'none') { placePup(-80); placeGun(-20, FLOOR_Y - 40, true); }
    if (stateB.pupX < L_BOSS_CFG.biscuitX) {
      placePup(Math.min(L_BOSS_CFG.biscuitX, stateB.pupX + L_BOSS_CFG.biscuitSpeed * dt));
      placeGun(stateB.pupX + 50, FLOOR_Y - 20, true);
    } else if (gunB.style.display !== 'none' && !stateB.swapped) placeGun(L_BOSS_CFG.gunDropX, FLOOR_Y, false);
  }
  if (!stateB.swapped && stateB.t >= L_BOSS_CFG.swapAt) swapToSuper();
  if (stateB.t >= L_BOSS_CFG.hintAt) showHintB(true);
  if (stateB.t >= L_BOSS_CFG.introS) endIntro();
}
function reducedMotionB() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function poseTreeB() {
  var rot = (stateB.endLean || 0) + (stateB.endWave || 0);
  var sh = reducedMotionB() ? 0 : (stateB.endShake || 0);
  treeBhot.style.transform = treeBfriendly.style.transform = 'rotate(' + rot.toFixed(2) + 'deg)';
  worldB.style.transform = sh ? 'translateX(' + sh.toFixed(1) + 'px)' : '';
  if (glowB) { glowB.style.display = (stateB.endGlow > 0.01) ? '' : 'none'; glowB.style.opacity = String(stateB.endGlow || 0); }
}
function sighSteamB() {
  var i, st, x = L_BOSS_CFG.treeX, y = FLOOR_Y - L_BOSS_CFG.treeH * 0.55;
  for (i = 0; i < 3; i++) {
    st = document.createElement('img'); st.src = 'smoke_puff.png'; st.alt = ''; st.className = 'steamB';
    st.style.left = (x - 40 + i * 40) + 'px'; st.style.top = (y - i * 20) + 'px'; worldB.appendChild(st);
    (function (el) { setTimeout(function () { if (el.parentNode) el.remove(); }, 900); })(st);
  }
  sfx(hissSfx, 0.45);
}
function startEndingB() {
  if (stateB.phase === 'ending' || stateB.phase === 'clip') return;
  stateB.phase = 'ending';
  stateB.endT = 0; stateB.endStage = 'sigh'; stateB.endLean = 0; stateB.endWave = 0; stateB.endShake = 0; stateB.endGlow = 0;
  stateB.clipStarted = false; stateB.boomed = false;
  player.vx = 0; player.vy = 0; player.onGround = true; player.invuln = 99; stateB.bounce = null;
  zackyEl.classList.remove('stumbleB', 'blink');
  showHintB(false); barB.classList.remove('on');
  clearRocksB();
  stopBossMusic();
  walkSfx.pause();
  sighSteamB();
  paintTreeFade();
  poseTreeB();
}
function beginUhOhB() {
  stateB.endStage = 'uhoh';
  if (uhOhB) {
    uhOhB.style.left = (L_BOSS_CFG.treeX - 280) + 'px';
    uhOhB.style.top = (FLOOR_Y - L_BOSS_CFG.treeH - 90) + 'px';
    uhOhB.classList.add('on');
  }
  var rs = document.getElementById('rumbleSfx');
  if (rs) { try { rs.currentTime = 0; rs.volume = 0.7; rs.loop = true; rs.play().catch(function () {}); } catch (e) {} }
}
function beginBoomB() {
  stateB.endStage = 'white';
  stateB.boomed = true;
  if (uhOhB) uhOhB.classList.remove('on');
  var rs = document.getElementById('rumbleSfx'); if (rs) { try { rs.pause(); } catch (e) {} }
  sfx(document.getElementById('boomSfx'), 0.85);
  stateB.endShake = 0;
}
function afterBossFadeB() {
  if (stateB.clipStarted) return;
  stateB.clipStarted = true;
  if (typeof playClip === 'function') {
    var cfg = window.L_CLIP_CFG || {};
    playClip(cfg.file || 'assets/level-boss/eruption.mp4', cfg.still || 'assets/level-boss/eruption_still.jpg', function () {
      if (typeof startLevel3 === 'function') startLevel3();
    });
  }
}
function endTickB(dt) {
  if (stateB.phase !== 'ending') return;
  stateB.endT = (stateB.endT || 0) + dt;
  var t = stateB.endT, sigh = L_BOSS_CFG.sighS, uh = L_BOSS_CFG.uhOhS, fade = L_BOSS_CFG.fadeS, reduce = reducedMotionB();
  if (t < sigh) {
    stateB.endStage = 'sigh';
    stateB.endWave = Math.sin(t * 7) * L_BOSS_CFG.waveDeg;
  } else if (t < sigh + uh) {
    if (stateB.endStage !== 'uhoh') beginUhOhB();
    var u = (t - sigh) / uh;
    stateB.endWave = Math.sin(t * 5) * L_BOSS_CFG.waveDeg * 0.4;
    stateB.endLean = L_BOSS_CFG.leanDeg * Math.min(1, u * 2.5);
    stateB.endGlow = L_BOSS_CFG.glowMax * Math.min(1, u * 1.6);
    stateB.endShake = reduce ? 0 : Math.sin(t * 26) * L_BOSS_CFG.shakePx * (0.4 + 0.6 * u);
  } else {
    if (!stateB.boomed) beginBoomB();
    var f = Math.max(0, Math.min(1, (t - sigh - uh) / fade));
    if (whiteB) whiteB.style.opacity = reduce ? '0' : String(f);
    stateB.endShake = 0;
    stateB.endGlow = L_BOSS_CFG.glowMax;
    if (f >= 1) afterBossFadeB();
  }
  poseTreeB();
}
function bossKey(key, isRepeat) {
  if (stateB.phase === 'intro') {
    if (!isRepeat && stateB.t >= L_BOSS_CFG.skipLockS) endIntro();              // after 1s, any fresh key skips
    return;
  }
  if (stateB.phase !== 'fight') return;
  if (ZackyShared.isJumpKey(key)) ZackyShared.pressJump(player);
  if (ZackyShared.isShootKey(key) && !isRepeat) sprayB();
}
function bossFrame(dt) {
  stateB.t += dt;
  if (stateB.phase === 'intro') introTick(dt);
  else if (stateB.phase === 'ending') { endTickB(dt); if (!walkSfx.paused) walkSfx.pause(); }
  else if (stateB.phase === 'fight') {
    if (stateB.bounce) {
      updateBounce(dt, stateB);
      if (!stateB.bounce) zackyEl.classList.remove('stumbleB');
    } else {
      if (ZackyShared.SHOOT_KEYS.some(function (k) { return keys[k]; })) sprayB();
      updatePlayer(dt);
      player.x = Math.max(HALF_W + 12, Math.min(L_BOSS_CFG.walkMax, player.x));
      if (stateB.armed && !stateB.hintOn && stateB.t - stateB.lastSplash >= L_BOSS_CFG.hintWaitS) showHintB(true);
    }
    player.face = 1;
    if (player.invuln > 0) {
      player.invuln -= dt;
      if (player.invuln <= 0) { player.invuln = 0; zackyEl.classList.remove('blink'); }
    }
    throwTickB(dt);
    helpTickB(dt);
  } else if (!walkSfx.paused) walkSfx.pause();
  updateBlobsB(dt);
  updateRocksB(dt);
  renderZacky();
}
