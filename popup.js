let extractedData = [];

const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const summaryEl = document.getElementById('summary');

function setStatus(msg, color = 'text-zinc-400') {
  statusEl.innerHTML = `<span class="${color}">${msg}</span>`;
}

// Bouton extraction
document.getElementById('extractBtn').addEventListener('click', async () => {
  setStatus("🔍 Extraction en cours sur la page active...", "text-amber-400");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: "extract" });
    
    if (response && response.success && response.data.length > 0) {
      extractedData = response.data;

      const emailCount = extractedData.filter(item => item.email).length;

      summaryEl.innerHTML = `
        <p><strong>${extractedData.length}</strong> contacts extraits</p>
        <p><strong>${emailCount}</strong> emails trouvés</p>
        <p class="text-xs text-zinc-500 mt-4">Utilisez les boutons ci-dessous pour exporter</p>
      `;
      resultsEl.classList.remove('hidden');
      setStatus(`✅ ${extractedData.length} contacts prêts`, "text-emerald-400");
    } else {
      setStatus("⚠️ Aucun contact trouvé. Scrolle dans la liste des membres et réessaie.", "text-red-400");
    }
  } catch (err) {
    console.error(err);
    setStatus("❌ Impossible de communiquer avec la page.<br>Ouvre WhatsApp Web ou un groupe Facebook.", "text-red-400");
  }
});

// Exports (inchangés, ils fonctionnent bien)
document.getElementById('exportCSV').addEventListener('click', () => {
  if (extractedData.length === 0) return alert("Aucune donnée");
  let csv = "name,email,phone,profile,source\n";
  csv += extractedData.map(row => 
    `"${row.name || ''}","${row.email || ''}","${row.phone || ''}","${row.profile || ''}","${row.source || ''}"`
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `group_extract_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
});

document.getElementById('exportExcel').addEventListener('click', () => {
  if (extractedData.length === 0) return alert("Aucune donnée");
  const ws = XLSX.utils.json_to_sheet(extractedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Membres");
  XLSX.writeFile(wb, `group_extract_${new Date().toISOString().slice(0,10)}.xlsx`);
});

document.getElementById('copyClipboard').addEventListener('click', () => {
  if (extractedData.length === 0) return;
  navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
  setStatus("✅ Données copiées dans le presse-papiers", "text-emerald-400");
});