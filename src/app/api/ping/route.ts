/**
 * Connectivity-check endpoint for the offline sync indicator.
 * Must stay free of auth/Supabase calls — it gets polled from every open tab,
 * and hitting Supabase here drains the database's Disk IO budget.
 */
export function GET() {
  return new Response(null, { status: 204 })
}
