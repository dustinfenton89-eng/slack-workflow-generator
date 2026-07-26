import type { PaymentMethod } from "./types";

export type PaymentLink = {
  label: string;
  /** Primary link to open — deep-links into the app when possible. */
  href: string;
  /** Plain-text info to show so the buyer can always pay manually. */
  manualInstructions: string;
};

/**
 * Venmo/Cash App have no guaranteed cross-platform "open with amount
 * prefilled" web link, and Zelle has no public link at all (it's routed
 * through each bank's own app). We always show the manual instructions
 * alongside the best-effort deep link so payment never gets stuck on a
 * broken link.
 */
export function buildPaymentLink(
  method: PaymentMethod,
  handle: string,
  amountDollars: string,
  note: string
): PaymentLink {
  switch (method) {
    case "venmo":
      return {
        label: "Pay with Venmo",
        href: `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(
          handle
        )}&amount=${amountDollars}&note=${encodeURIComponent(note)}`,
        manualInstructions: `Open Venmo, pay @${handle} exactly ${amountDollars} with the note "${note}".`,
      };
    case "paypal":
      return {
        label: "Pay with PayPal",
        href: `https://paypal.me/${encodeURIComponent(handle)}/${amountDollars}`,
        manualInstructions: `Open paypal.me/${handle}/${amountDollars}, or send ${amountDollars} to ${handle} in PayPal with the note "${note}".`,
      };
    case "cashapp":
      return {
        label: "Pay with Cash App",
        href: `https://cash.app/$${encodeURIComponent(handle)}/${amountDollars}`,
        manualInstructions: `Open Cash App, pay $${handle} exactly ${amountDollars} with the note "${note}".`,
      };
    case "zelle":
      return {
        label: "Pay with Zelle",
        href: "",
        manualInstructions: `Open your bank's app, send a Zelle payment for ${amountDollars} to ${handle} with the note "${note}". Zelle doesn't support prefilled payment links, so this has to be entered manually.`,
      };
  }
}
