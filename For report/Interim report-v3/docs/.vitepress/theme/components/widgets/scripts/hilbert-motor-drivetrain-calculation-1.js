// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    const testData = [
      { t: 0.00, rpm: 415.6, pout: 0.00, u: 48.01, i: 0.970, pin: 45.92, eff: 0.0, desc: 'No Load' },
      { t: 0.01, rpm: 416.1, pout: 0.44, u: 48.01, i: 0.931, pin: 44.25, eff: 1.0, desc: '' },
      { t: 0.11, rpm: 414.6, pout: 4.77, u: 48.00, i: 1.038, pin: 45.57, eff: 10.5, desc: '' },
      { t: 0.26, rpm: 413.3, pout: 11.24, u: 48.01, i: 1.145, pin: 46.75, eff: 24.1, desc: '' },
      { t: 0.46, rpm: 411.4, pout: 19.80, u: 48.01, i: 1.321, pin: 56.02, eff: 35.3, desc: '' },
      { t: 0.67, rpm: 409.3, pout: 28.70, u: 48.01, i: 1.608, pin: 68.45, eff: 41.9, desc: '' },
      { t: 0.96, rpm: 406.8, pout: 40.86, u: 48.01, i: 1.740, pin: 89.61, eff: 45.6, desc: '' },
      { t: 1.27, rpm: 404.1, pout: 53.70, u: 48.01, i: 2.016, pin: 93.01, eff: 57.7, desc: '' },
      { t: 1.62, rpm: 401.3, pout: 68.03, u: 48.01, i: 2.343, pin: 110.27, eff: 61.7, desc: '' },
      { t: 2.05, rpm: 397.8, pout: 85.33, u: 48.01, i: 2.692, pin: 133.78, eff: 63.8, desc: '' },
      { t: 2.49, rpm: 393.0, pout: 102.40, u: 48.01, i: 3.078, pin: 145.27, eff: 70.5, desc: '' },
      { t: 2.96, rpm: 387.5, pout: 120.02, u: 48.00, i: 3.514, pin: 171.74, eff: 69.9, desc: '' },
      { t: 3.76, rpm: 381.0, pout: 149.90, u: 48.00, i: 4.223, pin: 204.67, eff: 73.2, desc: '' },
      { t: 4.36, rpm: 376.1, pout: 171.59, u: 48.00, i: 4.751, pin: 226.61, eff: 75.7, desc: '' },
      { t: 4.97, rpm: 371.0, pout: 192.94, u: 48.00, i: 5.284, pin: 253.06, eff: 76.2, desc: '' },
      { t: 5.64, rpm: 364.8, pout: 215.29, u: 48.00, i: 5.849, pin: 281.24, eff: 76.6, desc: '' },
      { t: 6.29, rpm: 359.2, pout: 236.79, u: 48.00, i: 6.449, pin: 309.36, eff: 76.5, desc: '' },
      { t: 6.65, rpm: 356.1, pout: 248.17, u: 48.00, i: 6.757, pin: 324.00, eff: 76.6, desc: 'Max Efficiency' },
      { t: 6.99, rpm: 352.7, pout: 258.34, u: 48.00, i: 7.106, pin: 340.88, eff: 75.8, desc: '' },
      { t: 7.72, rpm: 345.7, pout: 279.62, u: 48.00, i: 7.733, pin: 372.03, eff: 75.2, desc: '' },
      { t: 8.49, rpm: 338.6, pout: 301.16, u: 48.00, i: 8.385, pin: 401.54, eff: 75.0, desc: '' },
      { t: 9.31, rpm: 329.2, pout: 321.05, u: 48.00, i: 9.064, pin: 435.49, eff: 73.7, desc: '' },
      { t: 10.12, rpm: 321.5, pout: 340.79, u: 48.00, i: 9.768, pin: 468.50, eff: 72.7, desc: '' },
      { t: 10.96, rpm: 313.5, pout: 359.86, u: 48.00, i: 10.482, pin: 503.74, eff: 71.4, desc: '' },
      { t: 11.79, rpm: 304.6, pout: 376.10, u: 48.00, i: 11.192, pin: 537.98, eff: 69.9, desc: '' },
      { t: 12.66, rpm: 295.9, pout: 392.30, u: 48.00, i: 11.989, pin: 576.80, eff: 68.0, desc: '' },
      { t: 13.55, rpm: 286.3, pout: 406.23, u: 47.99, i: 12.724, pin: 612.17, eff: 66.4, desc: '' },
      { t: 14.39, rpm: 277.8, pout: 418.59, u: 47.99, i: 13.492, pin: 649.23, eff: 64.5, desc: '' },
      { t: 15.29, rpm: 269.1, pout: 430.82, u: 47.99, i: 14.280, pin: 686.06, eff: 62.8, desc: '' },
      { t: 16.20, rpm: 260.3, pout: 441.52, u: 47.99, i: 15.087, pin: 726.65, eff: 60.8, desc: '' },
      { t: 17.07, rpm: 251.2, pout: 448.95, u: 47.99, i: 15.926, pin: 765.26, eff: 58.7, desc: '' },
      { t: 18.01, rpm: 242.3, pout: 456.88, u: 47.99, i: 16.784, pin: 807.19, eff: 56.6, desc: '' },
      { t: 18.89, rpm: 233.4, pout: 461.84, u: 47.99, i: 17.661, pin: 849.03, eff: 54.4, desc: '' },
      { t: 19.80, rpm: 224.3, pout: 465.19, u: 47.99, i: 18.747, pin: 899.87, eff: 51.7, desc: '' },
      { t: 20.72, rpm: 215.1, pout: 466.81, u: 47.99, i: 19.686, pin: 946.24, eff: 49.3, desc: 'Max Power' },
      { t: 28.50, rpm: 108.7, pout: 324.39, u: 48.36, i: 28.742, pin: 1380.28, eff: 23.5, desc: 'Max Torque' }
    ];

    const opCases = [
      { name: 'Case 1: Cruise (15 km/h)', t: 0.73, rpm: 409.1, eff: 42.7, i: 1.635, pout: 31.1, color: '#10b981' },
      { name: 'Case 2: 5° Slope (15 km/h)', t: 2.88, rpm: 388.4, eff: 70.0, i: 3.440, pout: 117.0, color: '#f59e0b' },
      { name: 'Case 3: Accel (1.39 m/s²)', t: 4.22, rpm: 377.2, eff: 75.1, i: 4.628, pout: 166.4, color: '#38bdf8' },
      { name: 'Case 4: R=0 Pivot (Scrub)', t: 15.78, rpm: 264.4, eff: 61.7, i: 14.720, pout: 436.5, color: '#f43f5e' }
    ];

    const chartModes = {
      speed: { key: 'rpm', yMax: 450, unit: 'RPM', title: 'Rotational Speed vs. Torque', color: '#38bdf8', refVal: 302.6, refLabel: '15 km/h Cruise Speed Line (302.6 RPM)' },
      eff: { key: 'eff', yMax: 100, unit: '%', title: 'Motor Efficiency vs. Torque', color: '#10b981', refVal: 85.0, refLabel: 'Theoretical Assumption (85%)' },
      current: { key: 'i', yMax: 32, unit: 'A', title: 'Phase Current vs. Torque', color: '#f59e0b', refVal: 16.0, refLabel: 'ZLAC8015D Phase Clamp (16.0 A)' },
      power: { key: 'pout', yMax: 500, unit: 'W', title: 'Mechanical Output Power vs. Torque', color: '#a855f7', refVal: 250.0, refLabel: 'Continuous Rated Power (250 W)' }
    };

    let currentMode = 'speed';

    function renderDynamoChart(mode) {
      const svg = document.getElementById('dynamo-svg');
      const tooltip = document.getElementById('dynamo-tooltip');
      const legendLabel = document.getElementById('dynamo-ref-legend-label');
      if (!svg) return;

      const conf = chartModes[mode];
      if (legendLabel) legendLabel.textContent = conf.refLabel;

      const xMin = 75, xMax = 735, yMin = 35, yMax = 310;
      const tMax = 30.0;

      function scaleX(t) { return xMin + (t / tMax) * (xMax - xMin); }
      function scaleY(val) { return yMax - (val / conf.yMax) * (yMax - yMin); }

      let svgHtml = `
        <defs>
          <filter id="dot-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>
        <!-- Background Grid -->
        <rect x="${xMin}" y="${yMin}" width="${xMax - xMin}" height="${yMax - yMin}" fill="rgba(15, 23, 42, 0.4)" stroke="#334155" stroke-width="1"/>
      `;

      // Horizontal Grid Lines & Y-Ticks
      const yTicks = 5;
      for (let k = 0; k <= yTicks; k++) {
        const val = (conf.yMax / yTicks) * k;
        const yPos = scaleY(val);
        svgHtml += `
          <line x1="${xMin}" y1="${yPos}" x2="${xMax}" y2="${yPos}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          <text x="${xMin - 12}" y="${yPos + 4}" fill="#94a3b8" font-size="11" text-anchor="end">${val.toFixed(0)} ${conf.unit}</text>
        `;
      }

      // Vertical Grid Lines & X-Ticks
      const xTicks = [0, 5, 10, 15, 20, 25, 30];
      xTicks.forEach(t => {
        const xPos = scaleX(t);
        svgHtml += `
          <line x1="${xPos}" y1="${yMin}" x2="${xPos}" y2="${yMax}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          <text x="${xPos}" y="${yMax + 18}" fill="#94a3b8" font-size="11" text-anchor="middle">${t} Nm</text>
        `;
      });

      // Axis Labels
      svgHtml += `
        <text x="${(xMin + xMax) / 2}" y="${yMax + 38}" fill="#f8fafc" font-size="12" font-weight="600" text-anchor="middle">Motor Shaft Torque (Nm)</text>
        <text x="24" y="${(yMin + yMax) / 2}" fill="${conf.color}" font-size="12" font-weight="600" text-anchor="middle" transform="rotate(-90 24 ${(yMin + yMax) / 2})">${conf.title}</text>
      `;

      // Reference Line
      if (conf.refVal !== undefined) {
        const refY = scaleY(conf.refVal);
        svgHtml += `
          <line x1="${xMin}" y1="${refY}" x2="${xMax}" y2="${refY}" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="5,4"/>
          <text x="${xMax - 10}" y="${refY - 6}" fill="#ef4444" font-size="10.5" font-weight="700" text-anchor="end">${conf.refLabel}</text>
        `;
      }

      // Polyline for Dynamometer Data
      let polyPoints = testData.map(pt => `${scaleX(pt.t).toFixed(1)},${scaleY(pt[conf.key]).toFixed(1)}`).join(' ');
      svgHtml += `<polyline points="${polyPoints}" fill="none" stroke="${conf.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

      // Data Dots
      testData.forEach((pt, idx) => {
        const cx = scaleX(pt.t);
        const cy = scaleY(pt[conf.key]);
        svgHtml += `
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5" fill="#ffffff" stroke="${conf.color}" stroke-width="1.5" class="dynamo-dot" data-idx="${idx}" style="cursor: pointer;"/>
        `;
      });

      // Operating Cases Highlight Crosshairs & Badges
      opCases.forEach(c => {
        const cx = scaleX(c.t);
        const cy = scaleY(c[conf.key]);
        svgHtml += `
          <line x1="${cx.toFixed(1)}" y1="${yMin}" x2="${cx.toFixed(1)}" y2="${yMax}" stroke="${c.color}" stroke-width="1.5" stroke-dasharray="3,3"/>
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="${c.color}" stroke="#ffffff" stroke-width="2" filter="url(#dot-shadow)"/>
          <text x="${cx.toFixed(1)}" y="${(cy - 10).toFixed(1)}" fill="${c.color}" font-size="10.5" font-weight="700" text-anchor="middle">${c.t} Nm</text>
        `;
      });

      svg.innerHTML = svgHtml;

      // Event listeners for dots & hovering
      const container = document.getElementById('dynamo-chart-container');
      svg.querySelectorAll('.dynamo-dot').forEach(dot => {
        dot.addEventListener('mouseenter', e => {
          const idx = parseInt(e.target.getAttribute('data-idx'));
          const pt = testData[idx];
          const dotCx = parseFloat(e.target.getAttribute('cx'));
          const dotCy = parseFloat(e.target.getAttribute('cy'));
          
          tooltip.style.display = 'block';
          tooltip.style.left = (dotCx + 15) + 'px';
          tooltip.style.top = (dotCy - 20) + 'px';
          tooltip.innerHTML = `
            <div style="font-weight: 700; color: #38bdf8; margin-bottom: 2px;">Torque: ${pt.t.toFixed(2)} Nm ${pt.desc ? '(' + pt.desc + ')' : ''}</div>
            <div>Speed: <strong>${pt.rpm.toFixed(1)} RPM</strong></div>
            <div>Efficiency: <strong style="color: #10b981;">${pt.eff.toFixed(1)}%</strong></div>
            <div>Phase Current: <strong>${pt.i.toFixed(2)} A</strong></div>
            <div>Mechanical Power: <strong>${pt.pout.toFixed(1)} W</strong></div>
            <div>Electrical Input: <strong>${pt.pin.toFixed(1)} W</strong></div>
          `;
        });
        dot.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      });
    }

    // Toggle 35-point table
    function toggleTestTable() {
      const container = document.getElementById('test-table-container');
      const icon = document.getElementById('toggle-test-table-icon');
      const textSpan = document.getElementById('toggle-test-table-text');
      if (container.style.display === 'none') {
        container.style.display = 'block';
        icon.textContent = '▲';
        textSpan.textContent = 'Hide 35-Point Manufacturer Load-Test Data Table';
      } else {
        container.style.display = 'none';
        icon.textContent = '▼';
        textSpan.textContent = 'Show Complete 35-Point Manufacturer Load-Test Data Table (Report No. FA2201060003)';
      }
    }

    // Populate test table rows
    function populateTestTable() {
      const tbody = document.getElementById('test-table-body');
      if (!tbody) return;
      let html = '';
      testData.forEach((pt, idx) => {
        let opMatch = '';
        let rowStyle = '';
        if (Math.abs(pt.t - 0.67) < 0.05) { opMatch = '<span class="badge badge-emerald">Near Case 1 (0.73 Nm)</span>'; rowStyle = 'background: rgba(16,185,129,0.1);'; }
        else if (Math.abs(pt.t - 2.96) < 0.1) { opMatch = '<span class="badge badge-amber">Near Case 2 (2.88 Nm)</span>'; rowStyle = 'background: rgba(245,158,11,0.1);'; }
        else if (Math.abs(pt.t - 4.36) < 0.2) { opMatch = '<span class="badge badge-blue">Near Case 3 (4.22 Nm)</span>'; rowStyle = 'background: rgba(56,189,248,0.1);'; }
        else if (Math.abs(pt.t - 15.29) < 0.5) { opMatch = '<span class="badge badge-rose">Near Case 4 (15.78 Nm)</span>'; rowStyle = 'background: rgba(244,63,94,0.1);'; }
        else if (pt.desc === 'Max Efficiency') { opMatch = '<span class="badge badge-emerald">Peak Motor Efficiency (76.6%)</span>'; rowStyle = 'background: rgba(16,185,129,0.15);'; }
        else if (pt.desc === 'Max Power') { opMatch = '<span class="badge badge-purple">Peak Mechanical Power (466.8 W)</span>'; }
        else if (pt.desc === 'Max Torque') { opMatch = '<span class="badge badge-rose">Dynamometer Stall Limit</span>'; }

        html += `
          <tr style="${rowStyle}">
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${pt.t.toFixed(2)}</strong></td>
            <td>${pt.rpm.toFixed(1)}</td>
            <td>${pt.pout.toFixed(2)}</td>
            <td>${pt.u.toFixed(2)}</td>
            <td>${pt.i.toFixed(3)}</td>
            <td>${pt.pin.toFixed(2)}</td>
            <td><strong>${pt.eff.toFixed(1)}%</strong></td>
            <td>${opMatch}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }

    // Initialize chart and tabs on DOM load
    document.addEventListener('DOMContentLoaded', () => {
      renderDynamoChart('speed');
      populateTestTable();

      const tabs = document.querySelectorAll('.dynamo-tab-btn');
      tabs.forEach(btn => {
        btn.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          const mode = btn.getAttribute('data-mode');
          currentMode = mode;
          renderDynamoChart(mode);
        });
      });
    });
  
}
