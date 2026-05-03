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

    // 3. If COMPLETED (status_code === 1)
    if (statusData.status_code === 1) {
      // Parse business_id from merchant reference ({uuid}-{timestamp}).
      // UUIDs contain 4 hyphens, so we drop only the last segment (the timestamp).
      const parts = OrderMerchantReference.split('-');
      const business_id = parts.slice(0, -1).join('-');

      // Derive payment method from phone number
      let method = 'Unknown';
      const phone = statusData.payment_account || '';
      const digits = phone.replace(/\D/g, '');
      let normalized = phone;
      if (digits.startsWith('256') && digits.length === 12) normalized = digits;
      else if (digits.startsWith('0') && digits.length === 10) normalized = '256' + digits.slice(1);
      const prefix = normalized.slice(3, 6);
      if (['076','077','078','039'].includes(prefix)) method = 'MTN';
      if (['075','070'].includes(prefix)) method = 'Airtel';

      // Use VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY — these are the names
      // set in the Cloudflare Pages environment variables dashboard.
      const insforgeUrl = (env.VITE_INSFORGE_URL || '').replace(/\/+$/, '');
      const anonKey = env.VITE_INSFORGE_ANON_KEY;

      if (!insforgeUrl || !anonKey) {
        throw new Error("Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY env vars");
      }

      // Call the secure RPC function to update subscription + record transaction
      const res = await fetch(`${insforgeUrl}/rest/v1/rpc/process_subscription_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
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

      // Respond success to Pesapal (required format)
      return new Response(JSON.stringify({ 
        orderNotificationType: "IPNCHANGE", 
        orderTrackingId: OrderTrackingId, 
        orderMerchantReference: OrderMerchantReference, 
        status: 200 
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Non-completed status — tell Pesapal we received but nothing to do yet
    return new Response(JSON.stringify({ 
      orderNotificationType: "IPNCHANGE",
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: 200
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, status: 500 }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
