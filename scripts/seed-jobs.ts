/**
 * Seed script to generate jobs for testing pagination
 * Run with: npx tsx scripts/seed-jobs.ts
 */

// Load environment variables from .env.local
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '../src/lib/supabase/admin'
import { INDIAN_CITIES } from '../src/lib/data/indian-cities'
import { getFinancialYearString } from '../src/lib/job-number'

// Material types for realistic data
const MATERIAL_TYPES = [
  'PCB Assembly',
  'Component Sourcing',
  'PCB Design',
  'Prototype Development',
  'Bulk Manufacturing',
  'Quality Testing',
  'Repair Service',
  'Custom Electronics',
  'Microcontroller Programming',
  'Sensor Integration',
]

// Company name prefixes and suffixes for variety
const COMPANY_PREFIXES = [
  'Tech',
  'Electronics',
  'Digital',
  'Smart',
  'Advanced',
  'Precision',
  'Micro',
  'Nano',
  'Global',
  'Innovative',
  'Modern',
  'Future',
  'Elite',
  'Prime',
  'Apex',
]

const COMPANY_SUFFIXES = [
  'Solutions',
  'Systems',
  'Technologies',
  'Industries',
  'Enterprises',
  'Corporation',
  'Ltd',
  'Pvt Ltd',
  'Inc',
  'Group',
  'Services',
  'Works',
  'Manufacturing',
]

// Contact person names
const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rahul', 'Kavita',
  'Suresh', 'Meera', 'Arjun', 'Divya', 'Kiran', 'Pooja', 'Nikhil', 'Swati',
  'Manoj', 'Ritu', 'Deepak', 'Neha', 'Vishal', 'Shreya', 'Ankit', 'Tanvi',
  'Ravi', 'Anita', 'Sandeep', 'Jyoti', 'Gaurav', 'Monika'
]

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Jain',
  'Verma', 'Agarwal', 'Malhotra', 'Kapoor', 'Chopra', 'Bansal', 'Shah',
  'Desai', 'Joshi', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Rao', 'Narayan'
]

const DESIGNATIONS = [
  'Manager', 'Director', 'CEO', 'CTO', 'Project Manager', 'Operations Manager',
  'Production Head', 'Quality Manager', 'Technical Lead', 'Senior Engineer',
  'Procurement Manager', 'Business Development Manager', 'General Manager'
]

// Status distribution for variety
const STATUSES: Array<'collected' | 'in_progress' | 'completed' | 'delivered'> = [
  'collected',
  'in_progress',
  'completed',
  'delivered',
]

/**
 * Generate a random Indian phone number
 */
function generatePhoneNumber(): string {
  const prefixes = ['91', '']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(6000000000 + Math.random() * 3999999999)
  return prefix ? `${prefix}${number}` : number.toString()
}

/**
 * Generate a random email
 */
function generateEmail(companyName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.in']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const name = companyName.toLowerCase().replace(/\s+/g, '')
  const random = Math.floor(Math.random() * 1000)
  return `${name}${random}@${domain}`
}

/**
 * Generate a random pincode (6 digits)
 */
function generatePincode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generate a random company name
 */
function generateCompanyName(): string {
  const prefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)]
  const suffix = COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)]
  return `${prefix} ${suffix}`
}

/**
 * Generate a random contact person
 */
function generateContactPerson() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  const designation = DESIGNATIONS[Math.floor(Math.random() * DESIGNATIONS.length)]
  
  return {
    name: `${firstName} ${lastName}`,
    designation,
  }
}

/**
 * Generate a random date within the last 6 months
 */
function generateBookingDate(): Date {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
  return new Date(randomTime)
}

/**
 * Generate a delivery date (after booking date, within 30 days)
 */
function generateDeliveryDate(bookingDate: Date): Date | null {
  // 70% chance of having a delivery date
  if (Math.random() > 0.7) return null
  
  const daysAfter = Math.floor(Math.random() * 30) + 1
  const deliveryDate = new Date(bookingDate)
  deliveryDate.setDate(deliveryDate.getDate() + daysAfter)
  
  // Don't set delivery date in the future
  const now = new Date()
  if (deliveryDate > now) {
    return null
  }
  
  return deliveryDate
}

/**
 * Generate a job number in the format RPS-{number}/{year}
 */
function generateJobNumber(sequenceNumber: number): string {
  const financialYear = getFinancialYearString()
  return `RPS-${sequenceNumber}/${financialYear}`
}

/**
 * Generate special requirements text
 */
function generateSpecialRequirements(): string | null {
  const requirements = [
    'Handle with care - fragile components',
    'Rush order - priority processing required',
    'Custom packaging required',
    'Temperature controlled storage needed',
    'ISO certified process required',
    'RoHS compliance mandatory',
    'Lead-free soldering only',
    'Special testing procedures required',
    'Customer inspection required before delivery',
    'Express delivery requested',
  ]
  
  // 30% chance of having special requirements
  if (Math.random() > 0.3) return null
  
  return requirements[Math.floor(Math.random() * requirements.length)]
}

/**
 * Generate notes
 */
function generateNotes(): string | null {
  const notes = [
    'Customer prefers morning delivery',
    'Follow up required after completion',
    'Previous customer - good relationship',
    'New customer - handle with extra care',
    'Large order - coordinate with warehouse',
    'Special discount applied',
    'Payment pending - verify before delivery',
    'Customer requested callback',
  ]
  
  // 40% chance of having notes
  if (Math.random() > 0.4) return null
  
  return notes[Math.floor(Math.random() * notes.length)]
}

/**
 * Main seed function
 */
async function seedJobs(count: number = 100) {
  console.log(`🌱 Starting to seed ${count} jobs...`)
  
  const adminClient = createAdminClient()
  
  // Get current job number settings to determine starting number
  const { data: settings } = await adminClient
    .from('job_number_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  
  const currentJobNumber = settings?.next_number || 1
  
  // Get a random city for variety
  const cities = INDIAN_CITIES
  const jobs = []
  
  for (let i = 0; i < count; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)]
    const companyName = generateCompanyName()
    const contactPerson = generateContactPerson()
    const bookingDate = generateBookingDate()
    const deliveryDate = generateDeliveryDate(bookingDate)
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
    const jobNumber = generateJobNumber(currentJobNumber + i)
    
    // Generate street address
    const streetNumbers = ['123', '456', '789', '12A', '45B', '78C', 'Block A', 'Unit 5', 'Plot 10']
    const streetNames = ['Main Road', 'Industrial Area', 'Tech Park', 'Business Park', 'Sector', 'Phase']
    const street = `${streetNumbers[Math.floor(Math.random() * streetNumbers.length)]}, ${streetNames[Math.floor(Math.random() * streetNames.length)]}`
    
    const job = {
      job_number: jobNumber,
      customer_name: companyName,
      contact_person_name: contactPerson.name,
      contact_person_designation: contactPerson.designation,
      address_street: street,
      address_area: city.value,
      address_city: city.value,
      address_state: city.state,
      address_pincode: generatePincode(),
      contact_number: generatePhoneNumber(),
      email: generateEmail(companyName),
      material_type: MATERIAL_TYPES[Math.floor(Math.random() * MATERIAL_TYPES.length)],
      booking_date: bookingDate.toISOString(),
      delivery_date: deliveryDate?.toISOString() || null,
      status,
      special_requirements: generateSpecialRequirements(),
      notes: generateNotes(),
      before_photos: [],
      after_photos: [],
      created_at: bookingDate.toISOString(),
      updated_at: bookingDate.toISOString(),
    }
    
    jobs.push(job)
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated ${i + 1}/${count} jobs...`)
    }
  }
  
  console.log(`\n📦 Inserting ${count} jobs into database...`)
  
  // Insert in batches of 50 to avoid overwhelming the database
  const batchSize = 50
  let inserted = 0
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize)
    
    const { error } = await adminClient
      .from('jobs')
      .insert(batch)
      .select()
    
    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
      continue
    }
    
    inserted += batch.length
    console.log(`  ✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${inserted}/${count})`)
  }
  
  // Update job number settings to reflect the new highest number
  const newNextNumber = currentJobNumber + count
  if (settings) {
    await adminClient
      .from('job_number_settings')
      .update({ next_number: newNextNumber })
      .eq('id', settings.id)
  }
  
  console.log(`\n✅ Successfully seeded ${inserted} jobs!`)
  console.log(`📊 Job number counter updated to: ${newNextNumber}`)
  console.log(`\n💡 You can now test pagination with these jobs.`)
}

// Run the seed function
const jobCount = process.argv[2] ? parseInt(process.argv[2], 10) : 100

if (isNaN(jobCount) || jobCount <= 0) {
  console.error('❌ Invalid job count. Please provide a positive number.')
  console.log('Usage: npx tsx scripts/seed-jobs.ts [count]')
  console.log('Example: npx tsx scripts/seed-jobs.ts 150')
  process.exit(1)
}

seedJobs(jobCount)
  .then(() => {
    console.log('\n🎉 Seed script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error)
    process.exit(1)
  })

