exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email } = JSON.parse(event.body || '{}');
  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email invalide' }) };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Allosticker <noreply@autocarnet.fr>',
        to: email,
        subject: '🎴 Tu es sur la liste — Allosticker arrive bientôt !',
        html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#18181f;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e1e28,#0f0f14);padding:40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:48px;margin-bottom:12px;">🎴</div>
            <div style="font-family:Georgia,serif;font-size:36px;font-weight:900;color:#FFD93D;letter-spacing:2px;">Allosticker</div>
            <div style="color:#8585a0;font-size:14px;margin-top:6px;font-weight:600;">La plateforme d'échange de stickers & cartes</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="color:#F0EFF6;font-size:26px;margin:0 0 16px;font-weight:900;">Tu es sur la liste ! 🎉</h1>
            <p style="color:#8585a0;font-size:16px;line-height:1.6;margin:0 0 24px;font-weight:600;">
              Super nouvelle — tu fais partie des premiers à rejoindre <strong style="color:#F0EFF6;">Allosticker</strong>. 
              On te préviendra en avant-première dès que la bêta est ouverte.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e28;border-radius:16px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <span style="font-size:24px;">🎯</span>
                  <span style="color:#F0EFF6;font-size:15px;font-weight:800;margin-left:12px;">Matching automatique de stickers</span>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <span style="font-size:24px;">📍</span>
                  <span style="color:#F0EFF6;font-size:15px;font-weight:800;margin-left:12px;">Échanges de proximité</span>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;">
                  <span style="font-size:24px;">🔔</span>
                  <span style="color:#F0EFF6;font-size:15px;font-weight:800;margin-left:12px;">Alertes sur tes manquants</span>
                </td>
              </tr>
            </table>

            <p style="color:#8585a0;font-size:14px;line-height:1.6;margin:0;font-weight:600;">
              En attendant, partage Allosticker autour de toi — plus on est nombreux, plus les échanges sont faciles ! 🚀
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="color:#8585a0;font-size:12px;margin:0;font-weight:600;">
              Tu reçois cet email car tu t'es inscrit sur <strong>allosticker.fr</strong><br>
              © 2026 Allosticker — propulsé par <a href="https://axionappstudio.com" style="color:#FFD93D;text-decoration:none;">Axion App Studio</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
        `
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Erreur envoi email' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur serveur' }) };
  }
};
