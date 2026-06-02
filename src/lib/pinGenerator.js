/**
 * Generate a unique 4-digit PIN
 * Range: 1000-9999 to ensure exactly 4 digits
 */
export const generatePin = () => {
  return String(Math.floor(Math.random() * 9000) + 1000)
}

/**
 * Validate if a PIN is in correct format (4 digits)
 */
export const isValidPin = (pin) => {
  return /^\d{4}$/.test(String(pin))
}
