/**
 * Simple hash using djb2 — works on HTTP and HTTPS.
 * crypto.subtle is HTTPS-only so we use a pure JS fallback.
 */
function djb2Hash(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0 // keep unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0')
}

export async function hashPin(pin) {
  const input = pin + 'five-things-salt'
  // Use crypto.subtle if available (HTTPS), otherwise fall back to djb2
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  return djb2Hash(input)
}

export async function verifyPin(pin, storedHash) {
  const hash = await hashPin(pin)
  return hash === storedHash
}
