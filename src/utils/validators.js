/**
 * OrderFlow — Validation Helpers
 */

/**
 * Check if a PIN is exactly 4 digits.
 * @param {string} pin
 * @returns {boolean}
 */
export function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

/**
 * Ensure two PINs are not identical.
 * @param {string} pin1
 * @param {string} pin2
 * @returns {boolean}
 */
export function arePinsDifferent(pin1, pin2) {
  return pin1 !== pin2;
}

/**
 * Validate an order object has the minimum required fields.
 *
 * @param {{ customerName?: string, items?: Array<{ product: string, quantity: number }> }} order
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function isValidOrder(order) {
  const errors = [];

  if (!order) {
    return { valid: false, errors: ['Order data is required'] };
  }

  if (!order.customerName || !order.customerName.trim()) {
    errors.push('Customer name is required');
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    order.items.forEach((item, idx) => {
      if (!item.product || !item.product.trim()) {
        errors.push(`Item ${idx + 1}: product name is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${idx + 1}: quantity must be a positive number`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
