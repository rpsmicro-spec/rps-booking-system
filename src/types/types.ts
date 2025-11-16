/**
 * Re-export database types for easier imports
 * These types are generated from the Supabase database schema
 */

import type { Database } from './database.types'

// Extract table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Job = Tables<'jobs'>
export type JobInsert = TablesInsert<'jobs'>
export type JobUpdate = TablesUpdate<'jobs'>

export type JobStatusHistory = Tables<'job_status_history'>
export type JobStatusHistoryInsert = TablesInsert<'job_status_history'>
export type JobStatusHistoryUpdate = TablesUpdate<'job_status_history'>

export type CleanupLog = Tables<'cleanup_log'>
export type CleanupLogInsert = TablesInsert<'cleanup_log'>
export type CleanupLogUpdate = TablesUpdate<'cleanup_log'>

export type User = Tables<'users'>
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>

// Job status type - extract the non-null status values
// Since the database allows null, we need to create a union of the actual status values
export type JobStatus = 'collected' | 'in_progress' | 'completed' | 'delivered'

// Database type for Supabase client
export type SupabaseDatabase = Database

