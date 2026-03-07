// Shared constants for email preview (underscore = hidden from preview sidebar)
export const COMPANY_INFO = {
  NAME: 'RPS Micro Electronics',
  ADDRESS: 'No. 249, New Tiny Sector\nAmbattur Industrial Estate\nChennai - 600 058',
  PHONE: '+91 98849 01472',
  TEL: '044-42753826',
  EMAIL: 'rpsmicro@gmail.com',
  GOOGLE_MAPS_LINK: 'https://maps.app.goo.gl/QBra9hMt327mzUe77?g_st=ipc',
} as const

export const STATUS_LABELS: Record<string, string> = {
  collected: 'Collected',
  in_progress: 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
}

export const LOGO_URL =
  'https://vkboymfxqspiffwaivxj.supabase.co/storage/v1/object/public/file-assets/images/Logo.png'
