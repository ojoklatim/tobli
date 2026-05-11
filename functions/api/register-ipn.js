export async function onRequestGet(context) {
  const { env, request } = context;
  const consumerKey = env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = env.PESAPAL_CONSUMER_SECRET;

  try {
    const pesapalBaseUrl = (env.PESAPAL_MODE === 'sandbox' || env.PESAPAL_SANDBOX === 'true')
      ? 'https://cybqa.pesapal.com/v3/api'
      : 'https://pay.pesapal.com/v3/api';

    const tokenRes = await fetch(`${pesapalBaseUrl}/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.status !== "200" || !tokenData.token) {
      return new Response(JSON.stringify({ error: 'Auth failed', details: tokenData }), { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const ipnUrl = `${origin}/api/pesapal-ipn`;

    const ipnRes = await fetch(`${pesapalBaseUrl}/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenData.token}`
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'POST'
      })
    });
    
    const ipnData = await ipnRes.json();
    return new Response(JSON.stringify(ipnData), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
