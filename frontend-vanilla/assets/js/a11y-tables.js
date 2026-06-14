// Small helper to improve table accessibility and keyboard navigation
(function () {
  function enhanceTables() {
    document.querySelectorAll('table').forEach(function (table, tIndex) {
      if (!table.hasAttribute('role')) table.setAttribute('role', 'table');
      var thead = table.querySelector('thead');
      if (thead) {
        var ths = thead.querySelectorAll('th');
        ths.forEach(function (th, i) {
          if (!th.hasAttribute('scope')) th.setAttribute('scope', 'col');
          if (!th.id) th.id = 'h-'+tIndex+'-'+i;
        });
      }
      var tbody = table.querySelector('tbody');
      var headerLabels = [];
      if (thead) {
        thead.querySelectorAll('th').forEach(function (th) {
          headerLabels.push(th.textContent.trim());
        });
      }
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(function (tr, rIndex) {
          tr.setAttribute('role', 'row');
          if (!tr.hasAttribute('tabindex')) tr.setAttribute('tabindex', '0');
          tr.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              var link = tr.querySelector('a');
              if (link) link.click();
            }
          });
          tr.querySelectorAll('td').forEach(function (td, cIndex) {
            td.setAttribute('role', 'cell');
            if (headerLabels[cIndex] && !td.hasAttribute('data-label')) {
              td.setAttribute('data-label', headerLabels[cIndex]);
            }
          });
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceTables);
  } else {
    enhanceTables();
  }
})();
