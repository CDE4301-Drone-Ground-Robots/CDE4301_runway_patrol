// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    /* DUAL-EKF ARCHITECTURE BLOCK DIAGRAM VIEW SELECTOR */
    (function() {
      const btnAll = document.getElementById('ekf-view-all');
      const btnOdom = document.getElementById('ekf-view-odom');
      const btnLocal = document.getElementById('ekf-view-local');
      const btnGlobal = document.getElementById('ekf-view-global');

      const panelOdom = document.getElementById('ekf-panel-odom');
      const panelLocal = document.getElementById('ekf-panel-local');
      const panelGlobal = document.getElementById('ekf-panel-global');

      if (!btnAll || !btnOdom || !btnLocal || !btnGlobal || !panelOdom || !panelLocal || !panelGlobal) return;

      function setEkfView(view) {
        [btnAll, btnOdom, btnLocal, btnGlobal].forEach(b => b.classList.remove('active'));
        if (view === 'all') {
          btnAll.classList.add('active');
          panelOdom.style.display = 'block';
          panelLocal.style.display = 'block';
          panelGlobal.style.display = 'block';
        } else if (view === 'odom') {
          btnOdom.classList.add('active');
          panelOdom.style.display = 'block';
          panelLocal.style.display = 'none';
          panelGlobal.style.display = 'none';
        } else if (view === 'local') {
          btnLocal.classList.add('active');
          panelOdom.style.display = 'none';
          panelLocal.style.display = 'block';
          panelGlobal.style.display = 'none';
        } else if (view === 'global') {
          btnGlobal.classList.add('active');
          panelOdom.style.display = 'none';
          panelLocal.style.display = 'none';
          panelGlobal.style.display = 'block';
        }
      }

      btnAll.addEventListener('click', () => setEkfView('all'));
      btnOdom.addEventListener('click', () => setEkfView('odom'));
      btnLocal.addEventListener('click', () => setEkfView('local'));
      btnGlobal.addEventListener('click', () => setEkfView('global'));
    })();
  
}
