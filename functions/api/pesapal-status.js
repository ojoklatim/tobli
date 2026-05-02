export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const orderTrackingId = url.searchParams.get('orderTrackingId');

    if (!orderTrackingId) throw new Error("Missing orderTrackingId");

    // 1. Authenticate with Pesapal
    const tokenRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ 
        consumer_key: env.PESAPAL_CONSUMER_KEY, 
        consumer_secret: env.PESAPAL_CONSUMER_SECRET 
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.status !== "200") throw new Error("Pesapal auth failed");

    // 2. Call GetTransactionStatus
    const statusRes = await fetch(`https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenData.token}`
      }
    });
    const statusData = await statusRes.json();

    // 3. Return status
    return new Response(JSON.stringify({ 
      status: statusData.payment_status_description, 
      statusCode: statusData.status_code, 
      confirmationCode: statusData.confirmation_code,
      paymentMethod: statusData.payment_method,
      paymentAccount: statusData.payment_account
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
