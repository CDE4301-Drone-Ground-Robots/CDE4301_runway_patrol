// Widget script (runs once per page via useWidgetScript); edit here.
/* eslint-disable */

export default function init() {

    (function () {
      // 1. LIGHTBOX MODAL DIALOG
      const lightboxDialog = document.getElementById('image-lightbox-dialog');
      const lightboxImg = document.getElementById('lightbox-img');
      const lightboxCaption = document.getElementById('lightbox-caption');
      const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

      window.openLightbox = function (src, caption) {
        if (!lightboxDialog || !lightboxImg) return;
        lightboxImg.src = src;
        lightboxImg.alt = caption || 'Enlarged Figure';
        if (lightboxCaption) {
          lightboxCaption.textContent = caption || '';
        }
        lightboxDialog.showModal();
      };

      if (lightboxCloseBtn && lightboxDialog) {
        lightboxCloseBtn.addEventListener('click', function () {
          lightboxDialog.close();
        });
        lightboxDialog.addEventListener('click', function (e) {
          if (e.target === lightboxDialog) {
            lightboxDialog.close();
          }
        });
      }

      // 2. SEARCHABLE INTERFACE TABLE FILTER
      const searchInput = document.getElementById('interface-search');
      const filterPills = document.querySelectorAll('.table-filter-pill');
      const tableRows = document.querySelectorAll('#interface-table tbody tr:not(#interface-empty-row)');
      const emptyRow = document.getElementById('interface-empty-row');
      let activeFilter = 'all';

      function applyTableFilters() {
        const query = (searchInput?.value || '').trim().toLowerCase();
        let matchCount = 0;

        tableRows.forEach(function (row) {
          const group = (row.getAttribute('data-group') || '').toLowerCase();
          const rowText = row.textContent.toLowerCase();

          const matchesCategory = (activeFilter === 'all' || group === activeFilter);
          const matchesQuery = !query || rowText.includes(query);

          if (matchesCategory && matchesQuery) {
            row.style.display = '';
            matchCount++;
          } else {
            row.style.display = 'none';
          }
        });

        if (emptyRow) {
          emptyRow.style.display = matchCount === 0 ? '' : 'none';
        }
      }

      if (searchInput) {
        searchInput.addEventListener('input', applyTableFilters);
      }

      filterPills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          filterPills.forEach(function (p) { p.classList.remove('active'); });
          pill.classList.add('active');
          activeFilter = (pill.getAttribute('data-filter') || 'all').toLowerCase();
          applyTableFilters();
        });
      });
    })();
  
}
