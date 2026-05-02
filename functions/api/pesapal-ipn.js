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
      // a. Parse business_id from merchant reference (TOBLI-{id}-{ts})
      const parts = OrderMerchantReference.split('-');
      // id can be a UUID, which itself contains hyphens. So slice from 1 to length-1 and join back.
      const business_id = parts.slice(1, -1).join('-');

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

      // c. Call Insforge REST API with service role key
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const insforgeHeaders = {
        'Content-Type': 'application/json',
        'apikey': env.INSFORGE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.INSFORGE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      };

      // INSERT into subscriptions
      await fetch(`${env.INSFORGE_URL}/rest/v1/subscriptions`, {
        method: 'POST',
        headers: insforgeHeaders,
        body: JSON.stringify({
          business_id,
          amount: 1000,
          paid_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          method,
          pesapal_reference: statusData.confirmation_code
        })
      });

      // UPDATE businesses
      await fetch(`${env.INSFORGE_URL}/rest/v1/businesses?id=eq.${business_id}`, {
        method: 'PATCH',
        headers: insforgeHeaders,
        body: JSON.stringify({ 
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString() 
        })
      });

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
