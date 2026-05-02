export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { business_id, phone_number, first_name, last_name, email } = await request.json();
    
    // 1. POST to Pesapal Auth/RequestToken
    const tokenRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ 
        consumer_key: env.PESAPAL_CONSUMER_KEY, 
        consumer_secret: env.PESAPAL_CONSUMER_SECRET 
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.status !== "200") throw new Error("Pesapal auth failed: " + JSON.stringify(tokenData));

    // 2. POST to Pesapal Transactions/SubmitOrderRequest
    const merchantRef = `${business_id}-${Date.now()}`; 
    const orderBody = {
      id: merchantRef,
      currency: "UGX",
      amount: 1000,
      description: `Tobli Subscription: ${business_id}`,
      callback_url: env.TOBLI_CALLBACK_URL || `${new URL(request.url).origin}/dashboard`,
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

    const orderRes = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenData.token}`
      },
      body: JSON.stringify(orderBody)
    });
    const orderData = await orderRes.json();
    
    if (orderData.status !== "200") {
      throw new Error(orderData.error?.message || "Failed to submit order");
    }

    // 3. Return
    return new Response(JSON.stringify({ 
      redirectUrl: orderData.redirect_url, 
      orderTrackingId: orderData.order_tracking_id, 
      merchantRef 
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
