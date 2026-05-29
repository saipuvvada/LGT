export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Forward payload to FormSubmit from the server side.
    // This strips browser-specific Vercel preview/deployment headers (Origin/Referer)
    // that trigger FormSubmit's strict client-side spam and bot filters.
    console.log('Sending server-side email dispatch...');
    const response = await fetch('https://formsubmit.co/ajax/saipuvvada12@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://formsubmit.co/',
        'Origin': 'https://formsubmit.co',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log('FormSubmit API response status:', response.status, data);
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Server-side email dispatch failed:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}
