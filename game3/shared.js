/* Zacky shared mechanics. Plain globals under window.ZackyShared, no dependency on index.html: level 2 can load this file as it is.
   Each helper takes the player/state it works on as an argument.
   Contents:
     lava soft bounce   findLavaPool / startBounce / stepBounce   (this step)
     jump grace         makeGrace                                 (step G8)
     gem HUD            gemHud                                    (step G9)  */
(function () {
  var ZS = window.ZackyShared = {};

  /* ─── Lava soft bounce ───
     pools:   [{x, w}] lava pools on the floor.      p: {x, y} Zacky's feet.
     o:       {halfW, edge, surfaceY}: body half-width, how far a foot may overhang the edge safely, y of the lava surface (feet below it = touching).
     Returns the pool touched, or null. */
  ZS.findLavaPool = function (p, pools, o) {
    var l = p.x - o.halfW, r = p.x + o.halfW;
    for (var i = 0; i < pools.length; i++) {
      var q = pools[i];
      if (r > q.x + o.edge && l < q.x + q.w - o.edge && p.y > o.surfaceY) return q;
    }
    return null;
  };

  /* Starts a bounce: Zacky hops out of the pool to its NEAR edge (the side his centre is on), landing on the floor clear of the lava.
     o: {floorY, clearance, dur, arc, minX, maxX}. clearance = how far outside the pool he lands (must be more than halfW - edge, so the landing can never touch lava again).
     The bounce is a fixed path with a fixed end point: it cannot loop or leave him in the lava. */
  ZS.startBounce = function (p, pool, o) {
    var near = (p.x < pool.x + pool.w / 2) ? -1 : 1;
    var tx = near < 0 ? pool.x - o.clearance : pool.x + pool.w + o.clearance;
    tx = Math.min(o.maxX, Math.max(o.minX, tx));
    return { t: 0, dur: o.dur, arc: o.arc, x0: p.x, y0: p.y, x1: tx, y1: o.floorY, side: near };
  };

  /* Moves p along the bounce. Returns true while it is still in the air, false on the frame it lands. */
  ZS.stepBounce = function (b, dt, p) {
    b.t = Math.min(b.dur, b.t + dt);
    var k = b.t / b.dur;
    p.x = b.x0 + (b.x1 - b.x0) * k;
    p.y = b.y0 + (b.y1 - b.y0) * k - b.arc * 4 * k * (1 - k);
    p.vx = 0; p.vy = 0;
    if (k >= 1) { p.x = b.x1; p.y = b.y1; return false; }
    return true;
  };

  /* ─── Forgiving jumps ───
     p carries two timers: p.coyote (time left to still jump after walking off a ledge) and p.jumpBuffer (a jump pressed just before landing still counts).
     JUMP_KEYS = every key that jumps (space and the up arrow). */
  ZS.JUMP_KEYS = [' ', 'ArrowUp'];
  ZS.isJumpKey = function (k) { return ZS.JUMP_KEYS.indexOf(k) >= 0; };
  ZS.GRACE = { coyote: 0.12, buffer: 0.12, landPad: 14 };   // seconds / seconds / px added each side of a platform when landing
  ZS.pressJump = function (p) { p.jumpBuffer = ZS.GRACE.buffer; };
  /* call once per frame BEFORE moving. Returns true when the jump should start this frame (the caller then sets vy and onGround=false). */
  ZS.stepJump = function (p, dt) {
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    if (p.onGround) p.coyote = ZS.GRACE.coyote; else p.coyote = Math.max(0, (p.coyote || 0) - dt);
    if (p.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) { p.jumpBuffer = 0; p.coyote = 0; return true; }
    return false;
  };
  /* does a body of half-width halfW centred at x land on a platform [px, px+pw]? (a little wider than it looks) */
  ZS.overPlatform = function (x, halfW, px, pw) { return x + halfW + ZS.GRACE.landPad > px && x - halfW - ZS.GRACE.landPad < px + pw; };

  /* ─── Gem HUD: n icons that fill as gems are collected ───
     var hud = ZackyShared.gemHud(containerEl, 5, 'gem.png');  hud.set(3);   -> three lit icons, two dark.
     The container gets data-count / data-total and an aria-label so tests (and screen readers) can read it. */
  var css = document.createElement('style');
  css.textContent = '.zgem{width:41px;height:48px;transition:filter .25s,opacity .25s}' +
    '.zgem.off{filter:grayscale(1) brightness(.55) drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px rgba(255,255,255,.85));opacity:.9}'  /* a light outline so the empty slots read on the dark HUD */ +
    '.zgem.pop{animation:zgempop .45s ease-out}' +
    '@keyframes zgempop{0%{transform:scale(.6)}55%{transform:scale(1.35)}100%{transform:scale(1)}}';
  document.head.appendChild(css);
  ZS.gemHud = function (el, total, src) {
    el.textContent = '';
    var icons = [];
    for (var i = 0; i < total; i++) {
      var im = document.createElement('img'); im.src = src; im.alt = ''; im.className = 'zgem off'; im.draggable = false;
      el.appendChild(im); icons.push(im);
    }
    var shown = -1;
    var hud = {
      el: el, total: total,
      set: function (n) {
        n = Math.max(0, Math.min(total, n));
        icons.forEach(function (im, k) {
          var on = k < n, was = !im.classList.contains('off');
          im.classList.toggle('off', !on);
          if (on && !was && shown >= 0) { im.classList.remove('pop'); void im.offsetWidth; im.classList.add('pop'); }   // pop only on a new gem
          if (!on) im.classList.remove('pop');
        });
        shown = n;
        el.setAttribute('data-count', n); el.setAttribute('data-total', total);
        el.setAttribute('aria-label', n + ' of ' + total + ' gems');
      }
    };
    hud.set(0);
    return hud;
  };

  /* ─── Bounce-loop hint ───
     Holding Right at a lava pool bounces him back again and again. After the second bounce within a few seconds a bouncing yellow up-arrow floats above Zacky
     ("jump!"). It goes away on a jump, when the pool is cooled, on a restart, or after a few seconds without another bounce.
     var bh = ZackyShared.bounceHint();   bh.el (add to the stage, same coordinate system as Zacky)   bh.bump() on each bounce   bh.clear()   bh.update(x, y) every frame (x, y = top of his head) */
  var hcss = document.createElement('style');
  hcss.textContent = '.zhint{position:absolute;left:0;top:0;width:80px;height:96px;z-index:25;pointer-events:none;display:none}' +
    '.zhint.on{display:block}.zhint svg{display:block;width:80px;height:96px;animation:zhintbob .5s ease-in-out infinite alternate;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}' +
    '@keyframes zhintbob{from{transform:translateY(8px) scale(1,.94)}to{transform:translateY(-22px) scale(1,1.06)}}';
  document.head.appendChild(hcss);
  ZS.HINT = { after: 2, secs: 6 };            // arrow appears at the 2nd bounce in a row; forgets the count after 6s without a bounce
  ZS.bounceHint = function () {
    var el = document.createElement('div'); el.className = 'zhint'; el.setAttribute('data-hint', 'jump');
    el.innerHTML = '<svg viewBox="0 0 80 96"><path d="M40 6 L74 46 L54 46 L54 90 L26 90 L26 46 L6 46 Z" fill="#ffd93b" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></svg>';
    var h = { el: el, n: 0, until: 0, on: false };
    function now() { return performance.now() / 1000; }
    h.bump = function () { h.n++; h.until = now() + ZS.HINT.secs; if (h.n >= ZS.HINT.after) h.on = true; };
    h.clear = function () { h.n = 0; h.on = false; el.classList.remove('on'); };
    h.update = function (x, y) {
      if (h.on && now() > h.until) h.clear();
      el.classList.toggle('on', h.on);
      if (h.on) el.style.transform = 'translate(' + Math.round(x - 40) + 'px,' + Math.round(y - 100) + 'px)';
    };
    return h;
  };
})();
