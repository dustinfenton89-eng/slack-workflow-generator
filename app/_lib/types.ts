export type Condition = "New" | "Like New" | "Good" | "Fair";

export type ListingStatus = "available" | "pending" | "sold" | "removed";

export type PaymentMethod = "venmo" | "paypal" | "cashapp" | "zelle";

export type OrderStatus =
  | "awaiting_payment"
  | "payment_claimed"
  | "payment_confirmed"
  | "label_created"
  | "shipped"
  | "completed"
  | "cancelled";

export type Listing = {
  id: string;
  created_at: string;
  seller_token: string;
  seller_email: string;
  seller_name: string;
  title: string;
  brand: string;
  model: string;
  condition: Condition;
  price_cents: number;
  description: string;
  photo_url: string | null;
  venmo_username: string | null;
  paypal_username: string | null;
  cashapp_cashtag: string | null;
  zelle_contact: string | null;
  ship_from_name: string;
  ship_from_address1: string;
  ship_from_address2: string | null;
  ship_from_city: string;
  ship_from_state: string;
  ship_from_zip: string;
  status: ListingStatus;
};

export type Order = {
  id: string;
  created_at: string;
  listing_id: string;
  buyer_token: string;
  buyer_email: string;
  buyer_name: string;
  ship_to_name: string;
  ship_to_address1: string;
  ship_to_address2: string | null;
  ship_to_city: string;
  ship_to_state: string;
  ship_to_zip: string;
  payment_method: PaymentMethod;
  amount_cents: number;
  status: OrderStatus;
  buyer_marked_paid_at: string | null;
  seller_confirmed_at: string | null;
  label_url: string | null;
  label_is_demo: boolean;
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
};

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
