// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    // Size the embedded 3D model to its content
    window.addEventListener('message', function (e) {
      var f = document.getElementById('sweep-box-model');
      if (f && e.source === f.contentWindow && e.data && e.data.type === 'fod-model-height') f.style.height = Math.ceil(e.data.h) + 'px';
    });

    // Inclined tube: v_min = sqrt(2 W (mu cos(th) - sin(th)) / (rho Cd A)), zero once the object slides by gravity
    (function () {
      var RHO = 1.2, G = 9.81, CD = 0.8, MEASURED = 42.47, TH_MAX = 60;
      var OBJ = { A: { m: 0.025, A: 0.0001131 }, B: { m: 0.3, A: 0.009 } };
      var root = document.getElementById('incline-calc');
      if (!root) return;
      var thIn = root.querySelector('[data-in="th"]'), muIn = root.querySelector('[data-in="mu"]');
      var thOut = root.querySelector('[data-out="th"]'), muOut = root.querySelector('[data-out="mu"]');
      var svg = root.querySelector('.incline-svg'), stats = root.querySelector('[data-istats]');
      var obj = 'A', hoverTh = null;
      var W = 900, H = 300, L = 52, R = 885, T = 16, B = 256;

      function load(o) { return OBJ[o].m * G / (CD * OBJ[o].A); }            // W / (Cd A), N/m^2
      function vmin(q, mu, th) {
        var r = Math.PI / 180 * th, k = mu * Math.cos(r) - Math.sin(r);
        return k > 0 ? Math.sqrt(2 * q * k / RHO) : 0;
      }
      function fmt(x, n) { return x.toLocaleString('en-US', { minimumFractionDigits: n, maximumFractionDigits: n }); }
      function stat(label, value, cls) { return '<div class="step-stat' + (cls ? ' ' + cls : '') + '">' + label + '<b>' + value + '</b></div>'; }

      function draw() {
        var th = +thIn.value, mu = +muIn.value, q = load(obj);
        var v0 = vmin(q, mu, 0), yMax = Math.max(60, Math.ceil(Math.max(v0, MEASURED) / 10) * 10 + 10);
        var X = function (a) { return L + a / TH_MAX * (R - L); };
        var Y = function (v) { return B - v / yMax * (B - T); };
        var h = '';
        for (var g = 0; g <= yMax + 1e-9; g += 10) {
          h += '<line x1="' + L + '" x2="' + R + '" y1="' + Y(g) + '" y2="' + Y(g) + '" stroke="currentColor" stroke-opacity="0.16"/>';
          h += '<text x="' + (L - 6) + '" y="' + (Y(g) + 4) + '" font-size="10" text-anchor="end" fill="currentColor">' + g + '</text>';
        }
        for (var a = 0; a <= TH_MAX; a += 10) {
          h += '<text x="' + X(a) + '" y="' + (B + 14) + '" font-size="10" text-anchor="middle" fill="currentColor">' + a + '°</text>';
        }
        h += '<text x="' + ((L + R) / 2) + '" y="' + (B + 32) + '" font-size="11" text-anchor="middle" fill="currentColor">Tube angle θ</text>';
        h += '<text transform="translate(12 ' + ((T + B) / 2) + ') rotate(-90)" font-size="11" text-anchor="middle" fill="currentColor">Min. air speed (m/s)</text>';
        // measured vacuum speed reference
        h += '<line x1="' + L + '" x2="' + R + '" y1="' + Y(MEASURED) + '" y2="' + Y(MEASURED) + '" stroke="var(--text-main)" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>';
        h += '<text x="' + (R - 4) + '" y="' + (Y(MEASURED) - 6) + '" font-size="10.5" text-anchor="end" fill="var(--text-main)">Measured vacuum: 42.47 m/s</text>';
        // critical angle
        var thc = Math.atan(mu) * 180 / Math.PI;
        if (thc <= TH_MAX) {
          h += '<line x1="' + X(thc) + '" x2="' + X(thc) + '" y1="' + T + '" y2="' + B + '" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="2 3"/>';
          h += '<text x="' + (X(thc) + 5) + '" y="' + (T + 12) + '" font-size="10" fill="currentColor">θc = ' + fmt(thc, 1) + '° (slides by gravity)</text>';
        }
        var pts = [];
        for (var i = 0; i <= 240; i++) { var t = i / 240 * TH_MAX; pts.push(X(t).toFixed(1) + ',' + Y(vmin(q, mu, t)).toFixed(1)); }
        h += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linejoin="round"/>';
        var v = vmin(q, mu, th);
        h += '<circle cx="' + X(th) + '" cy="' + Y(v) + '" r="5" fill="var(--accent-blue)" stroke="var(--apple-surface)" stroke-width="2"/>';
        h += '<text x="' + Math.min(X(th) + 8, R - 130) + '" y="' + (Y(v) - 8) + '" font-size="11" fill="var(--text-main)">' + fmt(v, 2) + ' m/s at ' + th + '°</text>';
        if (hoverTh !== null) {
          var hv = vmin(q, mu, hoverTh);
          h += '<line x1="' + X(hoverTh) + '" x2="' + X(hoverTh) + '" y1="' + T + '" y2="' + B + '" stroke="currentColor" stroke-opacity="0.5"/>';
          h += '<rect x="' + Math.min(X(hoverTh) + 6, R - 112) + '" y="' + (B - 40) + '" width="106" height="32" rx="4" fill="var(--apple-surface-card)" stroke="var(--apple-border-highlight)"/>';
          h += '<text x="' + (Math.min(X(hoverTh) + 6, R - 112) + 8) + '" y="' + (B - 27) + '" font-size="10.5" fill="var(--text-main)">θ = ' + fmt(hoverTh, 1) + '°</text>';
          h += '<text x="' + (Math.min(X(hoverTh) + 6, R - 112) + 8) + '" y="' + (B - 14) + '" font-size="10.5" fill="var(--text-main)">v = ' + fmt(hv, 2) + ' m/s</text>';
        }
        svg.innerHTML = h;

        thOut.textContent = th + '°';
        muOut.textContent = mu.toFixed(2);
        var r = Math.PI / 180 * th, k = mu * Math.cos(r) - Math.sin(r);
        var ax = G * (RHO * MEASURED * MEASURED / (2 * q) + Math.sin(r) - mu * Math.cos(r));   // initial acceleration at the measured speed
        var ok = MEASURED > v;
        stats.innerHTML =
          stat('W / (C<sub>D</sub>A)', fmt(q, 1) + ' N/m²') +
          stat('Min. air speed v<sub>air</sub>', k > 0 ? fmt(v, 2) + ' m/s' : '0 m/s (slides)') +
          stat('Critical angle θ<sub>c</sub>', fmt(thc, 1) + '°') +
          stat('Initial a<sub>x</sub> at 42.47 m/s', fmt(ax, 2) + ' m/s²') +
          stat('Picked up by measured vacuum?', ok ? 'Yes ✅' : 'No ❌', ok ? 'ok' : 'bad');
        svg.setAttribute('aria-label', 'Minimum air speed against tube angle. At ' + th + ' degrees it is ' + fmt(v, 2) + ' metres per second, against 42.47 measured.');
      }

      function setObj(o) {
        obj = o;
        root.querySelectorAll('[data-obj]').forEach(function (b) { b.classList.toggle('on', b.dataset.obj === o); });
        draw();
      }
      svg.addEventListener('pointermove', function (e) {
        var bb = svg.getBoundingClientRect(), x = (e.clientX - bb.left) / bb.width * W;
        hoverTh = x < L || x > R ? null : (x - L) / (R - L) * TH_MAX;
        draw();
      });
      svg.addEventListener('pointerleave', function () { hoverTh = null; draw(); });
      thIn.addEventListener('input', draw);
      muIn.addEventListener('input', draw);
      root.querySelectorAll('[data-obj]').forEach(function (b) { b.addEventListener('click', function () { setObj(b.dataset.obj); }); });
      thIn.value = 0; muIn.value = 0.5;
      setObj('A');
    })();
  
}
