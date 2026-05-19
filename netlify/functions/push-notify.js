// Notification push vers un utilisateur spécifique
// Appelée en interne après création d'un trade ou message
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { userId, title, body: msgBody, url, adminKey } = JSON.parse(event.body || '{}');
  if (adminKey !== process.env.ADMIN_SECRET) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Non autorisé' }) };
  }
  if (!userId || !title) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId et title requis' }) };
  }

  try {
    // Récupérer les push_subscriptions de l'utilisateur
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=subscription`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        }
      }
    );
    const subs = await res.json();
    if (!subs?.length) return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };

    // Envoyer via web-push (placeholder — nécessite web-push npm)
    // Pour l'instant on log et on retourne success
    console.log(`Push pour ${userId}: ${title} — ${subs.length} subscription(s)`);

    return { statusCode: 200, body: JSON.stringify({ sent: subs.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
