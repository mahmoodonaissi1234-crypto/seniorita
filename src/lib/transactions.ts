export const ALLOWED_TRANSACTION_TYPES = ["sale", "expense"] as const;
export type TransactionType = (typeof ALLOWED_TRANSACTION_TYPES)[number];
