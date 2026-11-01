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

      function eqTex(s) {
        var a = f(s.a, 2);
        if (s.kind === 'under') {
          return '$$y(t)=1-e^{-' + a + 't}\\cos(' + f(s.p, 2) + 't)+' + f(s.a / s.p, 3) + '\\,e^{-' + a + 't}\\sin(' + f(s.p, 2) + 't)$$';
        }
        if (s.kind === 'critical') {
          return '$$y(t)=1-e^{-' + a + 't}\\left(1-' + a + 't\\right)\\quad\\text{(critically damped)}$$';
        }
        return '$$y(t)=1-e^{-' + a + 't}\\cosh(' + f(s.q, 2) + 't)+' + f(s.a / s.q, 3) + '\\,e^{-' + a + 't}\\sinh(' + f(s.q, 2) + 't)\\quad\\text{(overdamped)}$$';
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

      document.querySelectorAll('.step-panel').forEach(function (panel, idx) {
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
        var mIn = inputs[0], kIn = inputs[1], bIn = inputs[2], pending = 0, lastTex = '';

        function typeset() {
          pending = 0;
          var tex = eqTex(solve(+kIn.value, +bIn.value, +mIn.value));
          if (tex === lastTex) return;
          lastTex = tex;
          if (window.MathJax && MathJax.typesetPromise) {
            if (MathJax.typesetClear) MathJax.typesetClear([eq]);
            eq.textContent = tex;
            MathJax.typesetPromise([eq]).catch(function () {});
          } else {
            eq.textContent = tex;
            lastTex = '';
          }
        }

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
          if (!pending) pending = requestAnimationFrame(typeset);
        }

        function reset() { mIn.value = M0; kIn.value = lbf0; bIn.value = b0; update(); }
        mIn.addEventListener('input', update);
        kIn.addEventListener('input', update);
        bIn.addEventListener('input', update);
        panel.querySelector('.step-reset').addEventListener('click', reset);
        reset();
      });

      // MathJax loads asynchronously from main.js; re-typeset once it is ready
      window.addEventListener('load', function () {
        var tries = 0, wait = setInterval(function () {
          if ((window.MathJax && MathJax.typesetPromise) || ++tries > 50) {
            clearInterval(wait);
            document.querySelectorAll('.step-panel input').forEach(function (el) { el.dispatchEvent(new Event('input')); });
          }
        }, 100);
      });
    })();

  
}
