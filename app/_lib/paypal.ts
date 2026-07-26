const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

export type PayoutResult = {
  batchId: string;
  itemId: string | null;
  status: string;
};

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET environment variable is not set.");
  }

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth error: ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/**
 * Sends a payout to a seller's PayPal email via the Payouts API. Funded from
 * the platform's own PayPal balance — this is a real transfer, not a link.
 */
export async function sendPayPalPayout(
  recipientEmail: string,
  amountCents: number,
  note: string,
  senderItemId: string
): Promise<PayoutResult> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: senderItemId,
        email_subject: "You have a payout from CalcSwap!",
        email_message: "Thanks for trading in your calculator. Here's your payout.",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: { value: (amountCents / 100).toFixed(2), currency: "USD" },
          receiver: recipientEmail,
          note,
          sender_item_id: senderItemId,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.message || data?.details?.[0]?.issue || JSON.stringify(data);
    throw new Error(`PayPal payout error: ${message}`);
  }

  const item = data.items?.[0];
  return {
    batchId: data.batch_header?.payout_batch_id,
    itemId: item?.payout_item_id || null,
    status: item?.transaction_status || data.batch_header?.batch_status || "UNKNOWN",
  };
}
