export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: "Expected JSON body" }), { status: 400 });
    }

    const { business_id, phone_number, first_name, last_name, email } = await request.json();
    
    const pesapalMode = env.PESAPAL_MODE || '';
    const pesapalBaseUrl = (pesapalMode === 'sandbox' || env.PESAPAL_SANDBOX === 'true')
      ? 'https://cybqa.pesapal.com/v3/api'
      : 'https://pay.pesapal.com/v3/api';

    // 1. Auth with Pesapal
    const tokenRes = await fetch(`${pesapalBaseUrl}/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ 
        consumer_key: env.PESAPAL_CONSUMER_KEY, 
        consumer_secret: env.PESAPAL_CONSUMER_SECRET 
      })
    });

    const tokenText = await tokenRes.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      throw new Error(`Pesapal Auth server returned an invalid response (HTML). This usually means the service is down or keys are incorrect.`);
    }

    if (tokenData.status !== "200") {
      throw new Error(`Pesapal auth failed (${tokenData.status}): ${tokenData.error?.message || tokenData.message || JSON.stringify(tokenData)}`);
    }

    // 2. Submit Order
    const merchantRef = `${business_id}-${Date.now()}`; 
    const origin = new URL(request.url).origin;
    const orderBody = {
      id: merchantRef,
      currency: "UGX",
      amount: 880,
      description: `Tobli Subscription: ${business_id}`,
      callback_url: env.TOBLI_CALLBACK_URL || `${origin}/dashboard`,
      notification_id: env.PESAPAL_NOTIFICATION_ID,
      billing_address: {
        email_address: email || "info@tobli.ug",
        phone_number: phone_number || "",
        first_name: first_name || "Business",
        last_name: last_name || "Owner",
        country_code: "UG",
        line_1: "Kampala",
        city: "Kampala",
        state: "Central",
        zip_code: "0000"
      }
    };

    const orderRes = await fetch(`${pesapalBaseUrl}/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenData.token}`
      },
      body: JSON.stringify(orderBody)
    });

    const orderText = await orderRes.text();
    let orderData;
    try {
      orderData = JSON.parse(orderText);
    } catch (e) {
      throw new Error("Pesapal Order server returned an invalid response (HTML).");
    }
    
    if (orderData.status !== "200") {
      throw new Error(`Failed to submit order (${orderData.status}): ${orderData.error?.message || orderData.message || JSON.stringify(orderData)}`);
    }

    // 3. Return
    return new Response(JSON.stringify({ 
      redirectUrl: orderData.redirect_url, 
      orderTrackingId: orderData.order_tracking_id, 
      merchantRef 
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (err) {
    console.error("[HANDLER ERROR]", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}



