import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type ShippingAddress = {
  name: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  zip: string;
};

export type GeneratedLabel = {
  labelUrl: string;
  trackingNumber: string;
  carrier: string;
  isDemo: boolean;
};

const SHIPPO_API = "https://api.goshippo.com";

/**
 * A small padded box, sized for a graphing calculator + charger. Good
 * enough as a default since we never know what box the seller has on hand.
 */
const DEFAULT_PARCEL = {
  length: "9",
  width: "6",
  height: "2",
  distance_unit: "in",
  weight: "1",
  mass_unit: "lb",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toShippoAddress(addr: ShippingAddress) {
  return {
    name: addr.name,
    street1: addr.address1,
    street2: addr.address2 || undefined,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    country: "US",
  };
}

async function createRealShippoLabel(
  addressFrom: ShippingAddress,
  addressTo: ShippingAddress,
  apiKey: string
): Promise<GeneratedLabel> {
  const headers = {
    Authorization: `ShippoToken ${apiKey}`,
    "Content-Type": "application/json",
  };

  const shipmentRes = await fetch(`${SHIPPO_API}/shipments/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      address_from: toShippoAddress(addressFrom),
      address_to: toShippoAddress(addressTo),
      parcels: [DEFAULT_PARCEL],
      async: false,
    }),
  });

  if (!shipmentRes.ok) {
    throw new Error(`Shippo shipment error: ${await shipmentRes.text()}`);
  }

  const shipment = await shipmentRes.json();
  type ShippoRate = { object_id: string; amount: string; provider: string };
  const rates: ShippoRate[] = shipment.rates || [];
  if (rates.length === 0) {
    throw new Error("Shippo returned no shipping rates for this route.");
  }

  const cheapest = rates.reduce((best, rate) =>
    parseFloat(rate.amount) < parseFloat(best.amount) ? rate : best
  );

  const transactionRes = await fetch(`${SHIPPO_API}/transactions/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      rate: cheapest.object_id,
      label_file_type: "PDF",
      async: false,
    }),
  });

  if (!transactionRes.ok) {
    throw new Error(`Shippo transaction error: ${await transactionRes.text()}`);
  }

  const transaction = await transactionRes.json();

  let attempts = 0;
  let current = transaction;
  while (current.status === "QUEUED" && attempts < 10) {
    await sleep(1000);
    const pollRes = await fetch(`${SHIPPO_API}/transactions/${transaction.object_id}`, {
      headers,
    });
    current = await pollRes.json();
    attempts += 1;
  }

  if (current.status !== "SUCCESS") {
    throw new Error(
      `Shippo label purchase failed: ${current.messages?.[0]?.text || current.status}`
    );
  }

  return {
    labelUrl: current.label_url,
    trackingNumber: current.tracking_number,
    carrier: cheapest.provider,
    isDemo: false,
  };
}

async function createDemoLabel(
  addressFrom: ShippingAddress,
  addressTo: ShippingAddress,
  referenceId: string
): Promise<GeneratedLabel> {
  const trackingNumber = `DEMO${referenceId.replace(/-/g, "").slice(0, 16).toUpperCase()}`;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([288, 432]); // 4in x 6in label
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 400;
  const draw = (
    text: string,
    opts: { size?: number; useBold?: boolean; color?: [number, number, number] } = {}
  ) => {
    page.drawText(text, {
      x: 16,
      y,
      size: opts.size ?? 10,
      font: opts.useBold ? bold : font,
      color: opts.color ? rgb(...opts.color) : rgb(0, 0, 0),
    });
    y -= (opts.size ?? 10) + 6;
  };

  draw("DEMO SHIPPING LABEL — NOT VALID FOR MAILING", {
    size: 11,
    useBold: true,
    color: [0.8, 0, 0],
  });
  draw("Configure SHIPPO_API_KEY to issue real, free prepaid postage.", { size: 8 });
  y -= 10;

  draw("FROM:", { useBold: true });
  draw(addressFrom.name);
  draw(addressFrom.address1);
  if (addressFrom.address2) draw(addressFrom.address2);
  draw(`${addressFrom.city}, ${addressFrom.state} ${addressFrom.zip}`);
  y -= 14;

  draw("TO:", { useBold: true, size: 12 });
  draw(addressTo.name, { size: 14, useBold: true });
  draw(addressTo.address1, { size: 12 });
  if (addressTo.address2) draw(addressTo.address2, { size: 12 });
  draw(`${addressTo.city}, ${addressTo.state} ${addressTo.zip}`, { size: 12 });
  y -= 20;

  draw("CARRIER: USPS (Demo)", { useBold: true });
  draw(`TRACKING #: ${trackingNumber}`, { useBold: true });
  y -= 10;
  draw(`REFERENCE: ${referenceId}`, { size: 8 });

  const pdfBytes = await pdfDoc.save();
  const base64 = Buffer.from(pdfBytes).toString("base64");

  return {
    labelUrl: `data:application/pdf;base64,${base64}`,
    trackingNumber,
    carrier: "USPS (Demo)",
    isDemo: true,
  };
}

export async function generateShippingLabel(
  addressFrom: ShippingAddress,
  addressTo: ShippingAddress,
  referenceId: string
): Promise<GeneratedLabel> {
  const apiKey = process.env.SHIPPO_API_KEY;
  if (apiKey) {
    return createRealShippoLabel(addressFrom, addressTo, apiKey);
  }
  return createDemoLabel(addressFrom, addressTo, referenceId);
}
