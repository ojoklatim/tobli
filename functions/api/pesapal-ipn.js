import { createClient } from '@insforge/sdk';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    console.log('[IPN] Received payload:', body);

    const orderTrackingId = body.OrderTrackingId || body.orderTrackingId;
    const notificationType = body.OrderNotificationType || body.orderNotificationType;
    
    if (notificationType !== 'IPNCHANGE') {
      return new Response('OK', { status: 200 });
    }

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
    const tokenData = await tokenRes.json();
    if (tokenData.status !== "200") throw new Error("Pesapal auth failed");

    // 2. Get Status
    const statusRes = await fetch(
      `${pesapalBaseUrl}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenData.token}`
        }
      }
    );
    const statusData = await statusRes.json();
    const statusCode = parseInt(statusData.status_code, 10);
    const merchantRef = statusData.merchant_reference;

    // 3. If COMPLETED (1) → Update DB via SDK
    if (statusCode === 1 && merchantRef && statusData.confirmation_code) {
      const parts = merchantRef.split('-');
      const business_id = parts.slice(0, -1).join('-');

      // Derive method
      let method = 'Unknown';
      const phone = statusData.payment_account || '';
      const digits = phone.replace(/\D/g, '');
      let normalized = digits;
      if (digits.startsWith('256') && digits.length === 12) normalized = digits;
      else if (digits.startsWith('0') && digits.length === 10) normalized = '256' + digits.slice(1);
      const prefix = normalized.slice(3, 6);
      if (['076','077','078','039'].includes(prefix)) method = 'MTN';
      else if (['075','070'].includes(prefix)) method = 'Airtel';
      else if (statusData.payment_method) method = statusData.payment_method;

      const insforgeUrl = (env.VITE_INSFORGE_URL || env.INSFORGE_URL || '').replace(/\/+$/, '');
      const anonKey = env.VITE_INSFORGE_ANON_KEY || env.INSFORGE_ANON_KEY;

      if (insforgeUrl && anonKey && business_id) {
        const client = createClient({ baseUrl: insforgeUrl, anonKey });

        await client.database.rpc('process_subscription_payment', {
          target_business_id: business_id,
          payment_amount: statusData.amount || 1000,
          payment_method: method,
          pesapal_ref: statusData.confirmation_code
        });
      }
    }

    return new Response(JSON.stringify({ 
      orderTrackingId, 
      merchantReference: merchantRef,
      status: "processed" 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, status: 500 }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

