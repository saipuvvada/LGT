export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY;

  if (web3formsKey) {
    console.log('Routing email via Web3Forms...');
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: web3formsKey,
          ...req.body,
        }),
      });

      const data = await response.json();
      console.log('Web3Forms API response status:', response.status, data);
      return res.status(response.status).json({
        success: data.success,
        message: data.message,
      });
    } catch (error) {
      console.error('Web3Forms email dispatch failed:', error);
      return res.status(500).json({ success: false, message: error.message || 'Web3Forms Error' });
    }
  }

  // Fallback to FormSubmit if no Web3Forms key is set
  console.log('Routing email via FormSubmit (Fallback)...');
  try {
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
