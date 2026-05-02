export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { OrderNotificationType, OrderTrackingId, OrderMerchantReference } = await request.json();

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
    const statusRes = await fetch(`https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenData.token}`
      }
    });
    const statusData = await statusRes.json();

    // 3. If COMPLETED
    if (statusData.status_code === 1) {
      // a. Parse business_id from merchant reference ({uuid}-{ts})
      const parts = OrderMerchantReference.split('-');
      const business_id = parts.slice(0, -1).join('-');

      // b. Derive payment method from phone
      let method = 'Unknown';
      let phone = statusData.payment_account || '';
      const digits = phone.replace(/\D/g, '');
      let normalized = phone;
      if (digits.startsWith('256') && digits.length === 12) normalized = digits;
      else if (digits.startsWith('0') && digits.length === 10) normalized = '256' + digits.slice(1);
      
      const prefix = normalized.slice(3, 6);
      if (['076','077','078','039'].includes(prefix)) method = 'MTN';
      if (['075','070'].includes(prefix)) method = 'Airtel';

      // c. Call the secure RPC function
      const res = await fetch(`${env.INSFORGE_URL}/rest/v1/rpc/process_subscription_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.VITE_INSFORGE_ANON_KEY,
          'Authorization': `Bearer ${env.VITE_INSFORGE_ANON_KEY}`
        },
        body: JSON.stringify({
          target_business_id: business_id,
          payment_amount: 1000,
          payment_method: method,
          pesapal_ref: statusData.confirmation_code
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("DB Update Failed: " + errorText);
      }

      // d. Respond success to Pesapal
      return new Response(JSON.stringify({ 
        orderNotificationType: "IPNCHANGE", 
        orderTrackingId: OrderTrackingId, 
        orderMerchantReference: OrderMerchantReference, 
        status: 200 
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "Not completed", status: 500 }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, status: 500 }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
