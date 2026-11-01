// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    // Pickup sizing: V_min = sqrt(2mg / (rho Cd A)), Q = A_duct V, losses as multiples of 1/2 rho V^2
    (function () {
      var RHO = 1.2, G = 9.81, K_ENTRY = 0.35, F = 0.022, L = 0.4, K_BEND = 0.4, P_FILTER = 300, ETA = 0.5 * 0.8;
      var MEASURED = 42.47, DUCTS = [1.5, 2, 2.5, 3, 4, 5];
      var A_MIN = 0.1, A_MAX = 300; // cm^2, log slider
      var PRESETS = { A: { m: 25, A: 1.1310, cd: 0.8, D: 0 }, B: { m: 300, A: 90, cd: 0.8, D: 5 } };
      var root = document.getElementById('vac-calc');
      if (!root) return; // the calculator is not composed into every page that loads this script
      var inp = {}, out = {};
      root.querySelectorAll('[data-in]').forEach(function (el) { inp[el.dataset.in] = el; });
      root.querySelectorAll('[data-out]').forEach(function (el) { out[el.dataset.out] = el; });
      var stats = root.querySelector('[data-stats]'), bars = root.querySelector('[data-bars]'), check = root.querySelector('[data-check]');

      function areaFromSlider(v) { return A_MIN * Math.pow(A_MAX / A_MIN, v / 1000); }
      function sliderFromArea(a) { return Math.round(1000 * Math.log(a / A_MIN) / Math.log(A_MAX / A_MIN)); }
      function stat(label, value) { return '<div class="step-stat">' + label + '<b>' + value + '</b></div>'; }
      function fmt(x, n) { return x.toLocaleString('en-US', { minimumFractionDigits: n, maximumFractionDigits: n }); }

      function update(areaOverride) {
        var m = +inp.m.value / 1000, cd = +inp.cd.value, dIn = DUCTS[+inp.D.value], D = dIn * 0.0254;
        var Acm = areaOverride || areaFromSlider(+inp.A.value), A = Acm / 1e4;
        var V = Math.sqrt(2 * m * G / (RHO * cd * A)), Ad = Math.PI * D * D / 4, Q = Ad * V, dyn = 0.5 * RHO * V * V;
        var losses = [
          ['Dynamic pressure', dyn],
          ['Nozzle entry', K_ENTRY * dyn],
          ['Duct friction', F * L / D * dyn],
          ['Elbow bend', K_BEND * dyn],
          ['Filter', P_FILTER]
        ];
        var total = losses.reduce(function (s, l) { return s + l[1]; }, 0), air = Q * total, motor = air / ETA;

        out.m.textContent = inp.m.value + ' g';
        out.A.textContent = fmt(Acm, Acm < 10 ? 3 : 1) + ' cm²';
        out.cd.textContent = cd.toFixed(2);
        out.D.textContent = dIn + ' in (' + fmt(D * 1000, 1) + ' mm)';

        stats.innerHTML =
          stat('Pickup velocity V<sub>min</sub>', fmt(V, 2) + ' m/s') +
          stat('Flow rate Q', fmt(Q, 4) + ' m³/s') +
          stat('Static pressure (gauge)', fmt(total, 1) + ' Pa') +
          stat('Air power', fmt(air, 1) + ' W') +
          stat('Estimated motor power', fmt(motor, 1) + ' W');

        var max = total;
        bars.setAttribute('aria-label', 'Pressure losses: ' + losses.map(function (l) { return l[0] + ' ' + fmt(l[1], 0) + ' Pa'; }).join(', ') + '; total ' + fmt(total, 0) + ' Pa');
        bars.innerHTML = losses.concat([['Total', total]]).map(function (l, i) {
          return '<div class="bar-row' + (i === losses.length ? ' total' : '') + '"><span>' + l[0] + '</span><div class="bar-track"><div class="bar-fill" style="width:' + (l[1] / max * 100).toFixed(2) + '%"></div></div><span class="bar-val">' + fmt(l[1], 1) + ' Pa</span></div>';
        }).join('');

        var ok = MEASURED >= V;
        check.className = 'calc-check ' + (ok ? 'ok' : 'bad');
        check.innerHTML = (ok ? '✅ ' : '❌ ') + 'Measured off-the-shelf vacuum speed of <strong>' + MEASURED + ' m/s</strong> (1.5 inch intake) is ' +
          (ok ? 'above' : 'below') + ' the required ' + fmt(V, 2) + ' m/s' + (ok ? ', so this object should be lifted.' : ', so this object would not be lifted at steady state.');
      }

      function preset(key) {
        var p = PRESETS[key];
        inp.m.value = p.m; inp.cd.value = p.cd; inp.D.value = p.D; inp.A.value = sliderFromArea(p.A);
        root.querySelectorAll('[data-preset]').forEach(function (b) { b.classList.toggle('on', b.dataset.preset === key); });
        update(p.A);
      }

      Object.keys(inp).forEach(function (k) {
        inp[k].addEventListener('input', function () {
          root.querySelectorAll('[data-preset]').forEach(function (b) { b.classList.remove('on'); });
          update();
        });
      });
      root.querySelectorAll('[data-preset]').forEach(function (b) { b.addEventListener('click', function () { preset(b.dataset.preset); }); });
      preset('A');
    })();
  
}
