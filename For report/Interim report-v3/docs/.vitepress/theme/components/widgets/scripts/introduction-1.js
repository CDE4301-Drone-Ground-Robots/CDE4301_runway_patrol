// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */
import __a0 from '@docs/shared/assets/images/iferret2.0.webp'
import __a1 from '@docs/shared/assets/images/tarsier-system.jpg'
import __a2 from '@docs/shared/assets/images/fodetect-edge-light.jpg'
import __a3 from '@docs/shared/assets/images/elva-1-radar.jpg'
import __a4 from '@docs/shared/assets/images/fod-finder-mobile.png'
import __a5 from '@docs/report/members/asuka/assets/images/fod-drag-mat.jpg'
export default function init() {

    // Competitor map: x = collection performance, y = detection performance, both -1..1
    (function () {
      var plot = document.getElementById('comp-plot'), detail = document.getElementById('comp-detail');
      if (!plot) return;
      var C = { det: 'var(--accent-blue)', col: 'var(--accent-amber)', both: 'var(--accent-purple)', ours: 'var(--accent-green)' };
      var CAT = { det: 'Detection only', col: 'Collection only', both: 'Detection and collection', ours: 'Our solution' };
      var S = [
        { id: 'iferret', name: 'iFerret 2.0', cat: 'det', x: -0.62, y: 0.68, img: __a0,
          how: 'AI-powered cameras for visual detection and verification. Deployed at Singapore Changi Airport.',
          good: ['Completely passive sensing with no RF emissions, so no interference with aircraft avionics.', 'Automated detection saves runway time ("every minute is money", CAAS).'],
          bad: ['Not weatherproof: accuracy drops in heavy rain, fog and shadows.', 'Expensive cabling cost.', 'Detection only: FOD still has to be collected by hand.'] },
        { id: 'tarsier', name: 'QinetiQ Tarsier', cat: 'det', x: -0.86, y: 0.32, img: __a1,
          how: 'Stationary radar for detection, with a camera that pans to the radar coordinates for confirmation.',
          good: ['Integrated PTZ cameras give controllers live visual verification of each detection.'],
          bad: ['Radar cannot classify FOD.', 'Sensitive to ground clutter: struggles to tell pavement texture from FOD.', 'Detection only.'] },
        { id: 'fodetect', name: 'Xsight FODetect & RunWize', cat: 'det', x: -0.6, y: 0.3, img: __a2,
          how: 'Stationary radar and sensors built into the runway edge lights, with laser illumination.',
          good: ['A built-in laser points to detected debris to guide retrieval crews at night.'],
          bad: ['Hardware-intensive deployment along the full runway length.', 'Detection only.'] },
        { id: 'elva', name: 'ELVA-1', cat: 'det', x: -0.86, y: -0.14, img: __a3,
          how: 'Stationary 76 GHz scanning radar for detection.',
          good: ['Long-range coverage per sensor with very low RF power.'],
          bad: ['Long scan time (3 minutes), significantly slower than other systems.', 'Detection only.'] },
        { id: 'fodfinder', name: 'FOD Finder Mobile', cat: 'det', x: -0.4, y: 0.0, img: __a4,
          how: 'Millimetre-wave radar mounted onto a vehicle that drives the runway.',
          good: ['Mobile: no fixed runway infrastructure.', 'Offers an optional truck-mounted vacuum module.'],
          bad: ['Intermittent scanning, so FOD can be missed between patrols.', 'Requires a human driver at all times.'] },
        { id: 'roboxi', name: 'Roboxi', cat: 'both', x: 0.22, y: 0.3, img: 'data:,',
          how: 'A standalone robot that detects and picks up FOD while also inspecting pavements and runway lights.',
          good: ['Detection and collection in one autonomous platform.', 'Also inspects pavement and runway light bulbs.'],
          bad: ['High cost.', 'Recently launched (less than 11 months), so efficiency and effectiveness are unknown.'] },
        { id: 'hunter', name: 'FOD Hunter × FOD Argus', cat: 'ours', x: 0.72, y: 0.66, img: 'data:,',
          how: 'A drone (FOD Argus) scans the runway and sends FOD locations to an autonomous ground rover (FOD Hunter), which navigates to each item and vacuums it up.',
          good: ['Fast aerial detection plus autonomous physical collection.', 'No runway infrastructure to install.', 'Frees staff from repetitive FOD sweeps for more critical roles.'],
          bad: ['Still in development: not yet tested on a live runway.'] },
        { id: 'manual', name: 'Manual sweeping and picking', cat: 'col', x: 0.42, y: -0.6, img: 'data:,',
          how: 'Crews walk or drive the runway, spotting FOD by eye and picking it up by hand or with brooms.',
          good: ['Low capital cost.', 'People can pick up almost any type of FOD.'],
          bad: ['Manpower-intensive and slow: a whole-base FOD walk still takes about an hour.', 'Brooms can create more FOD than they clean up.'] },
        { id: 'dragmat', name: 'Vehicles with friction drag mats', cat: 'col', x: 0.74, y: -0.66, img: __a5,
          how: 'Specialised vehicles tow friction drag mats across the runway to sweep up debris.',
          good: ['Clears most loose debris as the first tier of runway cleaning.'],
          bad: ['Misses the small pieces, such as rivets, that cause the most damage.', 'Must be towed by utility vehicles with a driver.', 'Mats wear quickly and struggle with heavy or embedded items.'] }
      ];

      function show(s, btn) {
        plot.querySelectorAll('.comp-pt').forEach(function (b) { b.classList.toggle('on', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
        detail.style.setProperty('--comp-c', C[s.cat]);
        var li = function (a) { return '<ul>' + a.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'; };
        detail.classList.remove('one');
        detail.innerHTML = '<img src="' + s.img + '" alt="' + s.name + '" onerror="this.parentNode.classList.add(\'one\'); this.remove();">' +
          '<div><span class="cd-cat">' + CAT[s.cat] + '</span><h4>' + s.name + '</h4><p class="cd-how">' + s.how + '</p>' +
          '<div class="cd-cols"><div><strong style="color: var(--accent-green);">✓ Good</strong>' + li(s.good) + '</div>' +
          '<div><strong style="color: var(--accent-rose);">✗ Shortcomings</strong>' + li(s.bad) + '</div></div></div>';
      }

      S.forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'comp-pt';
        b.style.left = (50 + s.x * 44) + '%'; b.style.top = (50 - s.y * 42) + '%';
        b.style.setProperty('--comp-c', C[s.cat]);
        b.setAttribute('aria-label', s.name + ' (' + CAT[s.cat] + ')'); b.title = s.name;
        b.innerHTML = '<img src="' + s.img + '" alt="">' + '<span class="comp-fallback">' + s.name + '</span>';
        b.querySelector('img').addEventListener('error', function () { b.classList.add('noimg'); });
        b.addEventListener('click', function () { show(s, b); });
        plot.appendChild(b);
        if (s.id === 'hunter') b._def = true;
      });
      var def = [].find.call(plot.querySelectorAll('.comp-pt'), function (b) { return b._def; });
      show(S.filter(function (s) { return s.id === 'hunter'; })[0], def);
    })();
  
}
