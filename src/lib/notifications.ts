// Stubbed notification channel (TICKET-123): there's no real email
// infrastructure yet, so "sending" a low-stock alert just logs it. Swapping
// in a real provider later only means changing this one function.
export function notifyLowStock(itemName: string, stock: number, threshold: number) {
  console.log(
    `[low-stock email stub] Would notify owner: "${itemName}" is low on stock (${stock} left, threshold ${threshold}).`
  );
}
