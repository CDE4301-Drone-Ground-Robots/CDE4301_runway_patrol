// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */
import DATA from './introduction-heatmap-data.json'

// Interactive five-year sensitivity heat map from Öztürk & Kuzucuoğlu (2016); AnyChart is loaded from its CDN on demand.
const CORE = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-core.min.js'
const HEAT = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-heatmap.min.js'

function load(src) {
  return new Promise((resolve, reject) => {
    const have = document.querySelector('script[src="' + src + '"]')
    if (have && have.dataset.loaded) return resolve()
    const el = have || document.createElement('script')
    el.addEventListener('load', () => { el.dataset.loaded = '1'; resolve() })
    el.addEventListener('error', reject)
    if (!have) { el.src = src; document.head.appendChild(el) }
  })
}

export default function init() {
  const container = document.getElementById('anychart-heatmap-container')
  if (!container) return
  const data = DATA
  const draw = () => {
    // Initialize AnyChart Heatmap
    var chart = anychart.heatMap(data);

    // Apply authentic cell fills directly from sampled publication spectrum
    chart.fill(function() {
      return this.getData('fill');
    });

    // Hover state
    chart.hovered().fill(function() {
      return this.getData('fill');
    });
    chart.hovered().stroke('2px #ffffff');

    // Invert Y-scale so usage count starts at 1 at top and scales down to 5,000 at bottom
    chart.yScale().inverted(true);

    // Clean, natural rendering: cell labels disabled
    chart.labels().enabled(false);

    // Subtle cell stroke for natural continuous heat gradients
    chart.stroke('0.5px rgba(255, 255, 255, 0.12)');

    // Axes styling
    var xAxis = chart.xAxis();
    xAxis.orientation('top');
    xAxis.labels().rotation(-30);
    xAxis.labels().fontSize(10.5);
    xAxis.labels().fontWeight(600);
    xAxis.stroke(null);
    xAxis.ticks(false);

    var yAxis = chart.yAxis();
    yAxis.title('USAGE COUNT FOR 5 YEARS');
    yAxis.title().fontSize(11);
    yAxis.title().fontWeight(700);
    yAxis.title().letterSpacing('0.05em');
    yAxis.labels().fontSize(10.5);
    yAxis.labels().fontWeight(600);
    yAxis.stroke(null);
    yAxis.ticks(false);

    // Tooltip with comprehensive operational metrics
    var tooltip = chart.tooltip();
    tooltip.useHtml(true);
    tooltip.title().useHtml(true);
    tooltip.titleFormat(function() {
      return '<span style="font-weight:700; color:#38bdf8; font-size:12px;">' + this.getData('sys') + ' &middot; ' + this.getData('fleet') + '</span>';
    });
    tooltip.format(function() {
      return '<div style="font-size:11.5px; line-height:1.55; color:#f1f5f9; padding:2px 0;">' +
        '<div><strong>Runway Usage:</strong> ' + this.y + ' ops / 5 yrs <span style="color:#94a3b8;">(' + this.getData('tier') + ' Tier)</span></div>' +
        '<div><strong>Avg Delay Time:</strong> ' + this.getData('delay') + ' &middot; <strong>Base Cost:</strong> ' + this.getData('cost') + '</div>' +
        '<div><strong>Delay Cost/Op:</strong> ' + this.getData('delayCost') + '</div>' +
        '<div style="margin-top:5px; font-weight:600; color:#f8fafc; border-top:1px solid rgba(255,255,255,0.15); padding-top:4px;">' + this.getData('status') + '</div>' +
        '</div>';
    });

    // Legend with authentic spectrum matching Fig. 24
    var legend = chart.legend();
    legend.enabled(true);
    legend.position('bottom');
    legend.itemsLayout('horizontal');
    legend.align('center');
    legend.fontSize(11);
    legend.padding(14, 0, 0, 0);
    legend.items([
      { text: 'Optimal (Lowest Delay & Cost)', iconType: 'square', iconFill: '#00b244' },
      { text: 'Low Sensitivity', iconType: 'square', iconFill: '#a6d900' },
      { text: 'Moderate Sensitivity', iconType: 'square', iconFill: '#ffd000' },
      { text: 'Elevated Delay / Cost', iconType: 'square', iconFill: '#ff8800' },
      { text: 'High Delay / Cost', iconType: 'square', iconFill: '#ff5500' },
      { text: 'Severe Delay Penalties', iconType: 'square', iconFill: '#ff0000' }
    ]);

    // Transparent chart canvas background
    chart.background().fill('transparent');
    chart.padding(10, 10, 10, 10);

    // Dynamic light/dark theme adaptation
    function applyChartTheme() {
      var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      var textMuted = isDark ? '#94a3b8' : '#475569';
      var textMain = isDark ? '#e2e8f0' : '#1e293b';

      xAxis.labels().fontColor(textMuted);
      yAxis.labels().fontColor(textMuted);
      yAxis.title().fontColor(textMain);
      legend.fontColor(textMuted);

      tooltip.background().fill(isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.95)');
      tooltip.background().stroke(isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)');
    }

    applyChartTheme();

    var themeObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'data-theme') {
          applyChartTheme();
        }
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    chart.container(container);
    chart.draw();
  }
  load(CORE).then(() => load(HEAT)).then(() => { if (container.isConnected && !container.firstChild) draw() }).catch(() => {
    container.textContent = 'The interactive heat map could not load (the chart library is fetched from the internet). Reload the page to try again.'
  })
}
