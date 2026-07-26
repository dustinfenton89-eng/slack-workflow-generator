export type Condition = "New" | "Like New" | "Good" | "Fair";

export type PaymentMethod = "venmo" | "paypal" | "cashapp" | "zelle" | "stripe";

export type TradeInStatus =
  | "awaiting_shipment"
  | "shipped"
  | "received"
  | "paid"
  | "rejected"
  | "cancelled";

export type TradeIn = {
  id: string;
  created_at: string;
  seller_token: string;
  model_key: string;
  brand: string;
  model: string;
  condition: Condition;
  payout_cents: number;
  seller_name: string;
  seller_email: string;
  payment_method: PaymentMethod;
  payment_handle: string;
  ship_from_name: string;
  ship_from_address1: string;
  ship_from_address2: string | null;
  ship_from_city: string;
  ship_from_state: string;
  ship_from_zip: string;
  status: TradeInStatus;
  label_url: string | null;
  label_is_demo: boolean;
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
  received_at: string | null;
  paid_at: string | null;
  admin_notes: string | null;
  payout_reference: string | null;
};

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
