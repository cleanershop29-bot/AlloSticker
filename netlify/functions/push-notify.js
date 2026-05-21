/**
 * ALLOSTICKER — push-notify.js
 * Netlify Function : envoie une notification push web à un utilisateur
 *
 * Variables Netlify requises :
 *   VAPID_PUBLIC_KEY  = BBAdTdH2a784SRbln_VEsNKq7ttKd_ZomVr5Dd6Fc362JSsSzib7Rrus3IbaUlBCI13ifzBEHOb_Ul4dxCP9eEc
 *   VAPID_PRIVATE_KEY = T4UVVIkNeRIq0BzC2cC-4kSMW2eRD2VJvtfrKQ75vj8
 *   VAPID_EMAIL       = mailto:contact@allosticker.fr
 *   SUPABASE_URL      = https://gyierirtxsroaqlaphax.supabase.co
 *   SUPABASE_SERVICE_KEY = (ta clé service_role)
 *   ADMIN_SECRET      = Jj0624988240@
 */

const webpush = require('web-push');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gyierirtxsroaqlaphax.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aWVyaXJ0eHNyb2FxbGFwaGF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk3MTQ5NCwiZXhwIjoyMDk0NTQ3NDk0fQ.fYelgh24iaUHsf5ip3ldil8GiLI6BiZ_QDQh9fHNzFA';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'Jj0624988240@';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BBAdTdH2a784SRbln_VEsNKq7ttKd_ZomVr5Dd6Fc362JSsSzib7Rrus3IbaUlBCI13ifzBEHOb_Ul4dxCP9eEc';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'T4UVVIkNeRIq0BzC2cC-4kSMW2eRD2VJvtfrKQ75vj8';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       || 'mailto:contact@allosticker.fr';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const { userId, title, body: msgBody, url, adminKey } = JSON.parse(event.body || '{}');

  if (adminKey !== ADMIN_SECRET) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
  }
  if (!userId || !title) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId et title requis' }) };
  }

  try {
    // Récupérer les subscriptions de l'utilisateur
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=subscription`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    const subs = await res.json();
    if (!subs?.length) return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, reason: 'Aucune subscription' }) };

    const payload = JSON.stringify({
      title,
      body: msgBody || '',
      url: url || '/app.html',
      tag: 'allosticker-' + Date.now(),
      icon: '/allosticker-icon-192.png',
    });

    let sent = 0;
    const expired = [];

    await Promise.all(subs.map(async ({ subscription }) => {
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        // Subscription expirée → la supprimer
        if (err.statusCode === 410 || err.statusCode === 404) {
          expired.push(subscription.endpoint);
        }
      }
    }));

    // Nettoyer les subscriptions expirées
    if (expired.length) {
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: { in: expired } })
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ sent, expired: expired.length }) };

  } catch (err) {
    console.error('push-notify error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
