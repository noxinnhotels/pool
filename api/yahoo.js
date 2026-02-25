export default async function handler(req, res) {
  // CORS headers — her yerden erişime izin ver
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'url parametresi gerekli' });
  }

  // Sadece Yahoo Finance URL'lerine izin ver (güvenlik)
  const decodedUrl = decodeURIComponent(url);
  if (!decodedUrl.startsWith('https://query1.finance.yahoo.com') &&
      !decodedUrl.startsWith('https://query2.finance.yahoo.com')) {
    return res.status(403).json({ error: 'Sadece Yahoo Finance URLleri desteklenir' });
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance hatası: ${response.status}` });
    }

    const data = await response.json();

    // 15 saniye cache — Vercel edge'de önbellekler, API kotasını korur
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Veri çekilemedi', detail: error.message });
  }
}
