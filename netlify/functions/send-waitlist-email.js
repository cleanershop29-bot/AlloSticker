exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  // Vérif clé admin
  const { subject, body: msgBody, adminKey } = JSON.parse(event.body || '{}');
  if (adminKey !== process.env.ADMIN_SECRET) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Non autorisé' }) };
  }
  if (!subject || !msgBody) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Sujet et message requis' }) };
  }

  try {
    // Récupérer la waitlist depuis Supabase
    const sbRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/waitlist_allosticker?select=email&order=created_at`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        }
      }
    );
    const waitlist = await sbRes.json();
    if (!waitlist?.length) return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };

    const emails = waitlist.map(r => r.email);

    // Envoyer via Resend (batch)
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#18181f;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.08)">
<tr><td style="background:linear-gradient(135deg,#1e1e28,#0f0f14);padding:36px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08)">
  <img src="https://allosticker.fr/allosticker-icon-512.png" width="70" height="70" style="border-radius:16px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto" alt="Allosticker">
  <div style="font-size:28px;font-weight:900;color:#FFD93D;letter-spacing:2px">ALLOSTICKER</div>
  <div style="color:#8585a0;font-size:12px;margin-top:4px;font-weight:600">Échange tes stickers &amp; cartes</div>
</td></tr>
<tr><td style="padding:36px 32px">
  <h1 style="color:#F0EFF6;font-size:22px;margin:0 0 16px;font-weight:900">${subject}</h1>
  <div style="color:#8585a0;font-size:15px;line-height:1.8;font-weight:600;white-space:pre-wrap">${msgBody}</div>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,.08);text-align:center">
  <a href="https://allosticker.fr/app.html" style="display:inline-block;background:#FFD93D;color:#0f0f14;font-size:14px;font-weight:900;padding:13px 32px;border-radius:100px;text-decoration:none">🚀 Ouvrir l'app</a>
</td></tr>
<tr><td style="padding:16px 32px;text-align:center">
  <p style="color:#8585a0;font-size:11px;margin:0;font-weight:600">
    Tu reçois cet email car tu es inscrit sur <strong>allosticker.fr</strong>
  </p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    // Envoyer en batch de 50 (limite Resend)
    let sent = 0;
    const BATCH = 50;
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH);
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          batch.map(to => ({
            from: 'Allosticker <contact@axionappstudio.com>',
            to,
            subject,
            html,
          }))
        ),
      });
      if (res.ok) sent += batch.length;
    }

    return { statusCode: 200, body: JSON.stringify({ sent, total: emails.length }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur serveur: ' + err.message }) };
  }
};
