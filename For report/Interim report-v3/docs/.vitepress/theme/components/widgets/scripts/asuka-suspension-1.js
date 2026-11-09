// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    // Interactive unit step response of (bs+k)/(ms^2+bs+k).
    // Underdamped: y(t) = 1 - e^{-at} cos(pt) + (a/p) e^{-at} sin(pt), with wn^2 = k/m, a = b/2m, p = sqrt(wn^2 - a^2)
    (function () {
      // LBF_IN: N/m per lbf/in, matching the spring rate table
      var M0 = 16.25, MR = 0.821, LBF_IN = 175.12677, G = 9.81, STROKE = 20, T_MAX = 3.5;
      var W = 360, H = 230, L = 44, R = 350, T = 10, B = 196;

      function solve(lbf, b, M) {
        var ks = lbf * LBF_IN, kw = ks * MR, wn = Math.sqrt(kw / M), a = b / (2 * M), d = wn * wn - a * a;
        var s = { kw: kw, wn: wn, a: a, zeta: a / wn, fn: wn / (2 * Math.PI), sag: M * G / kw * 1000 };
        if (Math.abs(d) < 1e-6 * wn * wn) {
          s.kind = 'critical';
          s.y = function (t) { return 1 - Math.exp(-a * t) * (1 - a * t); };
        } else if (d > 0) {
          var p = Math.sqrt(d);
          s.kind = 'under'; s.p = p;
          s.y = function (t) { var e = Math.exp(-a * t); return 1 - e * Math.cos(p * t) + (a / p) * e * Math.sin(p * t); };
        } else {
          var q = Math.sqrt(-d);
          s.kind = 'over'; s.q = q;
          // cosh/sinh written as exponentials to stay finite for large a
          s.y = function (t) {
            var e1 = Math.exp((-a + q) * t), e2 = Math.exp((-a - q) * t);
            return 1 - (e1 + e2) / 2 + (a / q) * (e1 - e2) / 2;
          };
        }
        return s;
      }

      function f(x, n) { return x.toFixed(n); }

      // Live equation as plain HTML (the site pre-renders Markdown maths at build time, so there is no MathJax at runtime)
      function eqHtml(s) {
        var a = f(s.a, 2);
        var E = '<i>e</i><sup>&minus;<i>at</i></sup>';
        var vals = function (rest) { return '<div class="eq-vals">' + rest + '</div>'; };
        var aDef = '<i>a</i> = <span class="frac"><span><i>b</i></span><span>2<i>m</i></span></span> = ' + a + ' s<sup>&minus;1</sup>';
        if (s.kind === 'under') {
          return '<div class="eq-main"><i>y</i>(<i>t</i>) = 1 &minus; ' + E + ' cos <i>pt</i> + <span class="frac"><span><i>a</i></span><span><i>p</i></span></span> ' + E + ' sin <i>pt</i></div>' +
            vals(aDef + ',&emsp;<i>p</i> = &radic;(<i>&omega;</i><sub>n</sub><sup>2</sup> &minus; <i>a</i><sup>2</sup>) = ' + f(s.p, 2) + ' rad/s');
        }
        if (s.kind === 'critical') {
          return '<div class="eq-main"><i>y</i>(<i>t</i>) = 1 &minus; ' + E + ' (1 &minus; <i>at</i>)&emsp;<span class="eq-note">critically damped</span></div>' + vals(aDef);
        }
        return '<div class="eq-main"><i>y</i>(<i>t</i>) = 1 &minus; ' + E + ' cosh <i>qt</i> + <span class="frac"><span><i>a</i></span><span><i>q</i></span></span> ' + E + ' sinh <i>qt</i>&emsp;<span class="eq-note">overdamped</span></div>' +
          vals(aDef + ',&emsp;<i>q</i> = &radic;(<i>a</i><sup>2</sup> &minus; <i>&omega;</i><sub>n</sub><sup>2</sup>) = ' + f(s.q, 2) + ' rad/s');
      }

      function plot(svg, s) {
        var n = Math.round(T_MAX / 0.01), pts = [], peak = 0, tPeak = 0;
        for (var i = 0; i <= n; i++) {
          var t = i * 0.01, y = s.y(t);
          pts.push([t, y]);
          if (y > peak) { peak = y; tPeak = t; }
        }
        var yMax = Math.max(1.8, Math.ceil(peak * 5) / 5);
        var X = function (t) { return L + (t / T_MAX) * (R - L); };
        var Y = function (y) { return B - (y / yMax) * (B - T); };
        var step = yMax > 2.4 ? 0.4 : 0.2, html = '';
        for (var g = 0; g <= yMax + 1e-9; g += step) {
          html += '<line x1="' + L + '" x2="' + R + '" y1="' + Y(g) + '" y2="' + Y(g) + '" stroke="currentColor" stroke-opacity="0.18"/>';
          html += '<text x="' + (L - 6) + '" y="' + (Y(g) + 4) + '" font-size="10" text-anchor="end" fill="currentColor">' + g.toFixed(1) + '</text>';
        }
        for (var j = 0; j <= T_MAX / 0.5; j++) {
          html += '<text x="' + X(j * 0.5) + '" y="' + (B + 14) + '" font-size="10" text-anchor="middle" fill="currentColor">' + (j * 0.5).toFixed(2) + '</text>';
        }
        html += '<text x="' + ((L + R) / 2) + '" y="' + (B + 30) + '" font-size="11" text-anchor="middle" fill="currentColor">Time (s)</text>';
        html += '<text transform="translate(11 ' + ((T + B) / 2) + ') rotate(-90)" font-size="11" text-anchor="middle" fill="currentColor">Output y(t)</text>';
        html += '<polyline points="' + pts.map(function (q) { return X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1); }).join(' ') + '" fill="none" stroke="var(--accent-green)" stroke-width="2.2" stroke-linejoin="round"/>';
        if (peak > 1.001) {
          html += '<circle cx="' + X(tPeak) + '" cy="' + Y(peak) + '" r="3.5" fill="var(--accent-amber)"/>';
          html += '<text x="' + (X(tPeak) + 7) + '" y="' + (Y(peak) - 4) + '" font-size="10" fill="var(--accent-amber)">peak ' + peak.toFixed(3) + ' @ ' + tPeak.toFixed(2) + ' s</text>';
        }
        svg.innerHTML = html;
        return peak;
      }

      function stat(label, value, cls) {
        return '<div class="step-stat' + (cls ? ' ' + cls : '') + '">' + label + '<b>' + value + '</b></div>';
      }

      // Panel A/B: sliders for corner mass m, spring rate k and dampener b.
      function initMKB(panel) {
        var lbf0 = +panel.dataset.lbf, b0 = +panel.dataset.b;
        panel.innerHTML =
          '<div class="step-head"><span class="step-title"></span><button type="button" class="step-reset">Reset to ' + lbf0 + ' lbf/in</button></div>' +
          '<svg class="step-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img"></svg>' +
          '<div class="step-eq"></div>' +
          '<label class="step-ctrl"><span>Corner mass <i>m</i></span><output></output><input type="range" min="10" max="50" step="0.25" aria-label="Corner mass in kilograms"></label>' +
          '<label class="step-ctrl"><span>Spring rate <i>k</i></span><output></output><input type="range" min="10" max="800" step="5" aria-label="Spring rate in pounds-force per inch"></label>' +
          '<label class="step-ctrl"><span>Dampener <i>b</i></span><output></output><input type="range" min="0" max="2000" step="10" aria-label="Dampener value in Ns per metre"></label>' +
          '<div class="step-stats"></div>';
        var title = panel.querySelector('.step-title'), svg = panel.querySelector('svg'), eq = panel.querySelector('.step-eq');
        var inputs = panel.querySelectorAll('input'), outs = panel.querySelectorAll('output'), stats = panel.querySelector('.step-stats');
        var mIn = inputs[0], kIn = inputs[1], bIn = inputs[2];

        function update() {
          var lbf = +kIn.value, b = +bIn.value, M = +mIn.value, s = solve(lbf, b, M);
          title.textContent = lbf + ' lbf/in spring, b = ' + b + ' Ns/m, m = ' + f(M, 2) + ' kg';
          svg.setAttribute('aria-label', 'Step response for ' + title.textContent);
          outs[0].textContent = f(M, 2) + ' kg';
          outs[1].textContent = lbf + ' lbf/in (Kw ' + f(s.kw, 0) + ' N/m)';
          outs[2].textContent = b + ' Ns/m';
          var peak = plot(svg, s), sagPct = s.sag / STROKE * 100;
          stats.innerHTML =
            stat('Natural freq. f<sub>n</sub> = ω<sub>n</sub>/2π (&lt; 10 Hz)', f(s.fn, 3) + ' Hz ' + (s.fn < 10 ? '✅' : '❌'), s.fn < 10 ? 'ok' : 'bad') +
            stat('Static sag (40–60% of stroke)', f(s.sag, 3) + ' mm · ' + f(sagPct, 0) + '% ' + (sagPct >= 40 && sagPct <= 60 ? '✅' : '❌'), sagPct >= 40 && sagPct <= 60 ? 'ok' : 'bad') +
            stat('Damping ratio ξ', f(s.zeta, 3)) +
            stat('Decay rate a = b/2m', f(s.a, 2) + ' s⁻¹') +
            stat('Peak overshoot', peak > 1.001 ? f((peak - 1) * 100, 1) + '%' : 'none');
          eq.innerHTML = eqHtml(s);
        }

        function reset() { mIn.value = M0; kIn.value = lbf0; bIn.value = b0; update(); }
        mIn.addEventListener('input', update);
        kIn.addEventListener('input', update);
        bIn.addEventListener('input', update);
        panel.querySelector('.step-reset').addEventListener('click', reset);
        reset();
      }

      // Panel C: the same response driven by natural frequency f_n and damping ratio zeta instead of m, k, b.
      // Corner mass stays at the 16.25 kg of the analysis, so k_w = m wn^2 and b = 2 zeta wn m follow from the two sliders.
      function initFnZeta(panel) {
        var lbf0 = +panel.dataset.lbf, b0 = +panel.dataset.b;
        var s0 = solve(lbf0, b0, M0), FN0 = s0.fn, Z0 = 1; // same f_n as the selected spring, damping raised to critical (xi = 1)
        panel.innerHTML =
          '<div class="step-head"><span class="step-title"></span><button type="button" class="step-reset">Reset to critically damped (&xi; = 1)</button></div>' +
          '<div class="step-cols"><div class="step-col-l">' +
          '<svg class="step-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img"></svg>' +
          '<div class="step-eq"></div></div><div class="step-col-r">' +
          '<label class="step-ctrl"><span>Natural frequency <i>f<sub>n</sub></i></span><output></output><input type="range" min="1" max="12" step="0.05" aria-label="Natural frequency in hertz"></label>' +
          '<label class="step-ctrl"><span>Damping ratio <i>&xi;</i></span><output></output><input type="range" min="0.05" max="2" step="0.01" aria-label="Damping ratio"></label>' +
          '<div class="step-stats"></div></div></div>';
        var title = panel.querySelector('.step-title'), svg = panel.querySelector('svg'), eq = panel.querySelector('.step-eq');
        var inputs = panel.querySelectorAll('input'), outs = panel.querySelectorAll('output'), stats = panel.querySelector('.step-stats');
        var fnIn = inputs[0], zIn = inputs[1];

        function model() {
          var fn = +fnIn.value, z = +zIn.value, wn = 2 * Math.PI * fn;
          var kw = M0 * wn * wn, b = 2 * z * wn * M0;
          return solve(kw / (LBF_IN * MR), b, M0);
        }
        function update() {
          var s = model(), b = 2 * s.zeta * s.wn * M0;
          title.textContent = 'f_n = ' + f(s.fn, 2) + ' Hz, ξ = ' + f(s.zeta, 2) + ' (m = ' + f(M0, 2) + ' kg)';
          svg.setAttribute('aria-label', 'Step response for ' + title.textContent);
          outs[0].textContent = f(s.fn, 2) + ' Hz';
          outs[1].textContent = f(s.zeta, 2);
          var peak = plot(svg, s), sagPct = s.sag / STROKE * 100;
          stats.innerHTML =
            stat('Natural freq. f<sub>n</sub> (&lt; 10 Hz)', f(s.fn, 3) + ' Hz ' + (s.fn < 10 ? '✅' : '❌'), s.fn < 10 ? 'ok' : 'bad') +
            stat('Static sag (40–60% of stroke)', f(s.sag, 3) + ' mm · ' + f(sagPct, 0) + '% ' + (sagPct >= 40 && sagPct <= 60 ? '✅' : '❌'), sagPct >= 40 && sagPct <= 60 ? 'ok' : 'bad') +
            stat('Wheel rate K<sub>w</sub> = mω<sub>n</sub><sup>2</sup>', f(s.kw, 0) + ' N/m') +
            stat('Dampener b = 2ξω<sub>n</sub>m', f(b, 0) + ' Ns/m') +
            stat('Peak overshoot', peak > 1.001 ? f((peak - 1) * 100, 1) + '%' : 'none');
          eq.innerHTML = eqHtml(s);
        }
        function reset() { fnIn.value = FN0.toFixed(2); zIn.value = Z0.toFixed(2); update(); }
        fnIn.addEventListener('input', update);
        zIn.addEventListener('input', update);
        panel.querySelector('.step-reset').addEventListener('click', reset);
        reset();
      }

      document.querySelectorAll('.step-panel').forEach(function (panel) {
        if (panel.dataset.mode === 'fnzeta') initFnZeta(panel);
        else initMKB(panel);
      });
    })();

  
}
