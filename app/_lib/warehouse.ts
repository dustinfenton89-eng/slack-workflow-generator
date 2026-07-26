import type { ShippingAddress } from "./shipping";

/** Where sellers ship their calculator to. Configure via env vars before going live. */
export function getWarehouseAddress(): ShippingAddress {
  return {
    name: process.env.WAREHOUSE_NAME || "CalcSwap Receiving",
    address1: process.env.WAREHOUSE_ADDRESS1 || "123 Main St",
    address2: process.env.WAREHOUSE_ADDRESS2 || null,
    city: process.env.WAREHOUSE_CITY || "Columbus",
    state: process.env.WAREHOUSE_STATE || "OH",
    zip: process.env.WAREHOUSE_ZIP || "43210",
  };
}
