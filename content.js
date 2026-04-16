// content.js - Version sans alert bloquant (Avril 2026)
let isExtracting = false;
let extractedData = [];

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

function addFloatingButton() {
  if (document.getElementById('group-extractor-float-btn')) return;

  const btn = document.createElement('div');
  btn.id = 'group-extractor-float-btn';
  btn.innerHTML = `
    <div style="position: fixed; bottom: 30px; right: 30px; z-index: 999999; 
                background: linear-gradient(135deg, #10b981, #059669); color: white; 
                padding: 14px 20px; border-radius: 9999px; font-weight: 600; 
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3); cursor: pointer; 
                display: flex; align-items: center; gap: 8px; font-size: 15px; 
                user-select: none; transition: all 0.2s;">
      <span>🚀 Extraire Membres</span>
      <span id="float-count" style="background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 9999px; font-size: 13px;">0</span>
    </div>
  `;
  document.body.appendChild(btn);
  btn.addEventListener('click', startExtraction);
}

function showNotification(message, type = 'success') {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };

  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; bottom: 100px; right: 30px; z-index: 9999999;
    background: ${colors[type]}; color: white; padding: 14px 20px;
    border-radius: 12px; font-weight: 500; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4);
    max-width: 320px; font-size: 14px; line-height: 1.4;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.transition = 'opacity 0.4s';
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 400);
  }, 4000);
}

async function startExtraction() {
  if (isExtracting) return;
  isExtracting = true;

  const url = window.location.href;
  let data = [];

  try {
    if (url.includes('web.whatsapp.com')) {
      data = await extractWhatsAppGroup();
    } else if (url.includes('facebook.com/groups')) {
      data = await extractFacebookGroupImproved();
    } else {
      showNotification("❌ Cette extension ne fonctionne que sur WhatsApp Web ou Facebook Groups.", 'error');
      isExtracting = false;
      return;
    }

    extractedData = data;
    updateFloatingCount(data.length);

    // Envoi au popup
    chrome.runtime.sendMessage({
      action: "extractionComplete",
      data: data,
      success: data.length > 0
    });

    if (data.length > 0) {
      showNotification(`✅ ${data.length} contacts extraits avec succès !\nOuvre le popup de l'extension pour exporter.`, 'success');
    } else {
      showNotification("⚠️ Aucun membre détecté. Scrolle un peu dans la liste puis réessaie.", 'info');
    }
  } catch (e) {
    console.error(e);
    showNotification("❌ Erreur pendant l'extraction. Regarde la console (F12).", 'error');
  }

  isExtracting = false;
}

// ====================== FACEBOOK - Version améliorée ======================
async function extractFacebookGroupImproved() {
  console.log("🔍 Extraction Facebook Group...");

  let members = [];
  let lastHeight = 0;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    attempts++;

    const cards = document.querySelectorAll('div[role="article"], div.x1iyjqo2, div[role="listitem"], div.x1yztbdb, div.x78zum5.xdt5ytf');

    cards.forEach(card => {
      const nameEl = card.querySelector('strong, span[dir="auto"], a > span, div.x1xmf6yo span');
      const name = nameEl ? nameEl.textContent.trim() : '';
      const linkEl = card.querySelector('a[href*="facebook.com/"]');
      const profileUrl = linkEl ? linkEl.href.split('?')[0] : '';
      const fullText = card.textContent || '';
      const emailMatch = fullText.match(emailRegex);

      if (name && name.length > 2 && !members.some(m => m.name === name)) {
        members.push({
          name: name,
          email: emailMatch ? emailMatch[0] : '',
          phone: '',
          profile: profileUrl,
          source: 'Facebook'
        });
      }
    });

    window.scrollBy(0, 1500);
    await new Promise(r => setTimeout(r, 1100));
    updateFloatingCount(members.length);

    if (document.body.scrollHeight === lastHeight && attempts > 15) break;
    lastHeight = document.body.scrollHeight;
  }

  return members;
}

// ====================== WHATSAPP (simplifié) ======================
async function extractWhatsAppGroup() {
  console.log("🔍 Extraction WhatsApp Web...");
  // Pour l'instant on retourne un tableau vide (tu peux remettre l'ancien code si besoin)
  return [];
}

function updateFloatingCount(count) {
  const countEl = document.getElementById('float-count');
  if (countEl) countEl.textContent = count > 999 ? '999+' : count;
}

// Communication avec le popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    startExtraction().then(() => {
      sendResponse({ success: true, data: extractedData });
    });
    return true;
  }
});

setTimeout(() => {
  addFloatingButton();
  console.log("✅ Group Email Extractor chargé (sans alert bloquant)");
}, 1500);