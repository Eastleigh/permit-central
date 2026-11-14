export const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const PRICE_CENTS = Number(process.env.PRICE_CENTS || 9900);
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 7);
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@getpermitcentral.com";
export const SUPPORT_PHONE = "(737) 405-6870";
export const SUPPORT_PHONE_TEL = "tel:+17374056870";
export const GUARANTEE_DAYS = 30;
export const PRICE_LABEL =`$${(PRICE_CENTS / 100).toFixed(PRICE_CENTS % 100 ? 2 : 0)}`;

/** Local development without Stripe/Resend keys: emails print to the console, billing can be skipped. */
export const isDevMode = process.env.NODE_ENV !== "production";

export const parseList = (v: FormDataEntryValue | string | null | undefined) =>
  String(v ?? "").split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

export const isZip = (v: string) => /^\d{5}$/.test(v);
