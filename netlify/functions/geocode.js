// Netlify function : géocodage ville via Nominatim (OpenStreetMap)
// Respecte la politique d'usage Nominatim : 1 req/s max, User-Agent identifié,
// déclenché uniquement par action utilisateur directe.
// Politique complète : https://operations.osmfoundation.org/policies/nominatim/

exports.handler = async (event) => {
  const q = event.queryStringParameters?.q;
  if(!q) return { statusCode: 400, body: JSON.stringify({ error: 'Paramètre q requis' }) };

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=fr`;
    const res = await fetch(url, {
      headers: {
        // User-Agent obligatoire selon la politique Nominatim
        'User-Agent': 'Allosticker/1.0 (contact@allosticker.fr)',
        'Referer': 'https://allosticker.fr',
      }
    });

    if(!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Erreur Nominatim' }) };
    }

    const data = await res.json();
    if(!data?.length) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false })
      };
    }

    const result = data[0];
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache 24h pour éviter les requêtes répétées
      },
      body: JSON.stringify({
        found: true,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display: result.display_name,
      })
    };
  } catch(err) {
    console.error('Geocode error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
