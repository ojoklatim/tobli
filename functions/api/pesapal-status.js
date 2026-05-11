export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const orderTrackingId = url.searchParams.get('orderTrackingId');
    const urlMerchantRef = url.searchParams.get('merchantRef') || url.searchParams.get('OrderMerchantReference');

    if (!orderTrackingId) throw new Error("Missing orderTrackingId");

    const pesapalMode = env.PESAPAL_MODE || '';
    const pesapalBaseUrl = (pesapalMode === 'sandbox' || env.PESAPAL_SANDBOX === 'true')
      ? 'https://cybqa.pesapal.com/v3/api'
      : 'https://pay.pesapal.com/v3/api';

    // 1. Authenticate with Pesapal
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

    // 2. Get transaction status
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

    // 3. If COMPLETED (1) and we have a reference → update DB
    const merchantRef = urlMerchantRef || statusData.merchant_reference;
    let dbError = null;

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
      if (['076', '077', '078', '039'].includes(prefix)) method = 'MTN';
      else if (['075', '070'].includes(prefix)) method = 'Airtel';
      else if (statusData.payment_method) method = statusData.payment_method;

      const insforgeUrl = (env.VITE_INSFORGE_URL || env.INSFORGE_URL || '').replace(/\/+$/, '');
      const anonKey = env.VITE_INSFORGE_ANON_KEY || env.INSFORGE_ANON_KEY;

      if (!insforgeUrl || !anonKey) {
        dbError = 'Missing INSFORGE env vars';
      } else if (!business_id) {
        dbError = 'Could not parse business_id';
      } else {
        try {
          const { createClient } = await import('@insforge/sdk');
          const client = createClient({ baseUrl: insforgeUrl, anonKey });

          const { error: rpcError } = await client.database.rpc('process_subscription_payment', {
            target_business_id: business_id,
            payment_amount: statusData.amount || 1000,
            payment_method: method,
            pesapal_ref: statusData.confirmation_code
          });

          if (rpcError) {
            dbError = `RPC failed: ${rpcError.message}`;
          }
        } catch (sdkErr) {
          dbError = `SDK Error: ${sdkErr.message}`;
        }
      }
    }

    // 4. Return
    return new Response(JSON.stringify({
      status: statusData.payment_status_description,
      statusCode,
      status_code: statusCode,
      confirmationCode: statusData.confirmation_code,
      paymentMethod: statusData.payment_method,
      paymentAccount: statusData.payment_account,
      dbError
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
