/**
 * Duplicate job detection utilities
 * Checks for similar jobs based on customer name, phone, email, and dates
 */

import type { JobFormValues } from "@/features/jobs/components/JobForm";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number; // 0-100
  reasons: string[];
  similarJobs?: Array<{
    id: string;
    job_number: string;
    customer_name: string;
    booking_date: string;
  }>;
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  // Exact match after normalization
  if (s1.replace(/\s+/g, "") === s2.replace(/\s+/g, "")) return 95;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 80;
  
  // Calculate Levenshtein distance
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 100 : ((maxLen - distance) / maxLen) * 100;
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[\s\+\-\(\)]/g, "").trim();
}

/**
 * Check if two phone numbers are similar
 */
function phoneSimilarity(phone1: string, phone2: string): number {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  
  if (!normalized1 || !normalized2) return 0;
  if (normalized1 === normalized2) return 100;
  
  // Check if one is contained in the other (for cases like +91 vs without)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 90;
  }
  
  // Last 10 digits match
  const last10_1 = normalized1.slice(-10);
  const last10_2 = normalized2.slice(-10);
  if (last10_1 === last10_2 && last10_1.length === 10) return 95;
  
  return 0;
}

/**
 * Check if dates are within a certain range (e.g., same day or within 7 days)
 */
function dateSimilarity(date1: string, date2: string, daysThreshold: number = 7): number {
  if (!date1 || !date2) return 0;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 100; // Same day
  if (diffDays <= daysThreshold) return 80; // Within threshold
  return 0;
}

/**
 * Check for duplicate jobs
 */
export async function checkDuplicateJob(
  formData: JobFormValues,
  excludeJobId?: string
): Promise<DuplicateCheckResult> {
  try {
    // Fetch recent jobs (last 30 days) to check against
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const response = await fetch(
      `/api/jobs?dateFrom=${thirtyDaysAgo.toISOString().split("T")[0]}&limit=100`
    );
    
    if (!response.ok) {
      return { isDuplicate: false, similarity: 0, reasons: [] };
    }
    
    const { jobs } = await response.json();
    
    if (!jobs || jobs.length === 0) {
      return { isDuplicate: false, similarity: 0, reasons: [] };
    }
    
    const similarJobs: DuplicateCheckResult["similarJobs"] = [];
    let maxSimilarity = 0;
    const allReasons: string[] = [];
    
    for (const job of jobs) {
      // Skip if it's the same job being edited
      if (excludeJobId && job.id === excludeJobId) continue;
      
      let similarity = 0;
      const reasons: string[] = [];
      
      // Check customer name similarity
      const nameSim = stringSimilarity(formData.customer_name, job.customer_name);
      if (nameSim > 70) {
        similarity += nameSim * 0.4; // 40% weight
        reasons.push(`Similar customer name (${Math.round(nameSim)}% match)`);
      }
      
      // Check phone number similarity
      const phoneSim = phoneSimilarity(
        formData.contact_number || "",
        job.contact_number || ""
      );
      if (phoneSim > 80) {
        similarity += phoneSim * 0.3; // 30% weight
        reasons.push(`Same or similar phone number`);
      }
      
      // Check email similarity
      const emailSim = stringSimilarity(formData.email || "", job.email || "");
      if (emailSim > 80) {
        similarity += emailSim * 0.2; // 20% weight
        reasons.push(`Same or similar email`);
      }
      
      // Check booking date similarity (within 7 days)
      const dateSim = dateSimilarity(
        formData.booking_date,
        job.booking_date,
        7
      );
      if (dateSim > 0) {
        similarity += dateSim * 0.1; // 10% weight
        reasons.push(`Booking date within 7 days`);
      }
      
      // If similarity is high enough, add to similar jobs
      if (similarity > 50 && reasons.length > 0) {
        similarJobs.push({
          id: job.id,
          job_number: job.job_number,
          customer_name: job.customer_name,
          booking_date: job.booking_date,
        });
        
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          allReasons.push(...reasons);
        }
      }
    }
    
    // Consider it a duplicate if similarity > 70%
    const isDuplicate = maxSimilarity > 70;
    
    return {
      isDuplicate,
      similarity: Math.round(maxSimilarity),
      reasons: [...new Set(allReasons)], // Remove duplicates
      similarJobs: similarJobs.length > 0 ? similarJobs : undefined,
    };
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    return { isDuplicate: false, similarity: 0, reasons: [] };
  }
}

