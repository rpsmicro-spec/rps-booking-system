/**
 * Type for objects with address fields (Job or Customer)
 */
type Addressable = {
  address_street?: string | null
  address_area?: string | null
  address_city?: string | null
  address_state?: string | null
  address_pincode?: string | null
}

/**
 * Format address from separate address fields
 * Returns formatted address string or null if no address fields are present
 */
export function formatAddress(item: Addressable): string | null {
  const street = item.address_street?.trim()
  const area = item.address_area?.trim()
  const city = item.address_city?.trim()
  const state = item.address_state?.trim()
  const pincode = item.address_pincode?.trim()

  const parts: string[] = []
  if (street) parts.push(street)
  if (area) parts.push(area)
  if (city || state) {
    const cityState = [city, state].filter(Boolean).join(', ')
    if (cityState) parts.push(cityState)
  }
  if (pincode) parts.push(pincode)

  return parts.length > 0 ? parts.join('\n') : null
}

/**
 * Format address as a single line (for emails, etc.)
 */
export function formatAddressSingleLine(item: Addressable): string | null {
  const street = item.address_street?.trim()
  const area = item.address_area?.trim()
  const city = item.address_city?.trim()
  const state = item.address_state?.trim()
  const pincode = item.address_pincode?.trim()

  const parts: string[] = []
  if (street) parts.push(street)
  if (area) parts.push(area)
  if (city) parts.push(city)
  if (state) parts.push(state)
  if (pincode) parts.push(pincode)

  return parts.length > 0 ? parts.join(', ') : null
}

