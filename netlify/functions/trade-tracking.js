exports.handler = async (event) => {
  // GET /api/trade-tracking?id=TRADE_ID
  const tradeId = event.queryStringParameters?.id;
  if (!tradeId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>ID manquant</h1>'
    };
  }

  try {
    // Récupérer le trade
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/trades?id=eq.${tradeId}&select=id,statut,message_init,created_at,updated_at,proposer:profiles!proposer_id(nom),receiver:profiles!receiver_id(nom)`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        }
      }
    );
    const data = await res.json();
    const trade = data?.[0];

    if (!trade) {
      return { statusCode: 404, headers: { 'Content-Type': 'text/html' }, body: pageHtml('Échange introuvable', 'Cet échange n\'existe pas ou a été supprimé.', '❌', '#FF3D7F') };
    }

    const statusMap = {
      en_attente: { label: 'En attente de réponse', icon: '⏳', color: '#FFD93D' },
      accepte:    { label: 'Échange accepté ✓',     icon: '✅', color: '#3DFFB0' },
      refuse:     { label: 'Échange refusé',         icon: '❌', color: '#FF3D7F' },
      annule:     { label: 'Échange annulé',         icon: '🚫', color: '#8585a0' },
      complete:   { label: 'Échange terminé 🎉',      icon: '🎉', color: '#3DFFB0' },
    };
    const st = statusMap[trade.statut] || { label: trade.statut, icon: '📦', color: '#FFD93D' };
    const date = new Date(trade.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const body = `
      <div style="font-size:64px;margin-bottom:16px">${st.icon}</div>
      <h1 style="font-family:Bangers,cursive;font-size:28px;letter-spacing:1px;color:${st.color};margin-bottom:8px">${st.label}</h1>
      <div style="font-size:14px;color:#8585a0;font-weight:700;margin-bottom:20px">Mis à jour le ${date}</div>
      <div style="background:#1e1e28;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;margin-bottom:16px;text-align:left">
        <div style="font-size:12px;color:#8585a0;font-weight:800;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Échange entre</div>
        <div style="font-size:15px;font-weight:900;color:#F0EFF6">${trade.proposer?.nom||'—'} ↔ ${trade.receiver?.nom||'—'}</div>
      </div>
      ${trade.message_init ? `<div style="background:#1e1e28;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;text-align:left"><div style="font-size:12px;color:#8585a0;font-weight:800;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Message</div><div style="font-size:14px;font-weight:700;color:#F0EFF6">${trade.message_init}</div></div>` : ''}
      <a href="https://allosticker.fr/app.html" style="display:inline-block;margin-top:20px;background:#FFD93D;color:#0f0f14;font-size:15px;font-weight:900;padding:14px 32px;border-radius:100px;text-decoration:none">Ouvrir Allosticker</a>
    `;
    return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: pageHtml(st.label, body, '', '') };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: { 'Content-Type': 'text/html' }, body: pageHtml('Erreur', 'Une erreur est survenue.', '⚠️', '#FF3D7F') };
  }
};

function pageHtml(title, content, icon, color) {
  return `<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Allosticker</title>
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f0f14;color:#F0EFF6;font-family:'Nunito',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
.card{background:#18181f;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px 24px;max-width:400px;width:100%}
.logo{font-family:'Bangers',cursive;font-size:28px;letter-spacing:2px;color:#FFD93D;margin-bottom:24px;display:flex;align-items:center;justify-content:center;gap:8px}
.logo img{width:30px;height:30px;border-radius:7px}
</style>
</head>
<body>
<div class="card">
  <div class="logo"><img src="https://allosticker.fr/allosticker-icon-512.png" alt="">Allo<span style="color:#F0EFF6">sticker</span></div>
  ${content}
</div>
</body></html>`;
}
