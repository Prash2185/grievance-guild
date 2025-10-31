import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rckpbspubsqqrxfnebcf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJja3Bic3B1YnNxcXJ4Zm5lYmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDQ3NzEsImV4cCI6MjA3NzQyMDc3MX0.D5nyg9iJb_DkiJaLIr_ox4CDQAc4wf_0Hzbd0FJq8zI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

// Database types (will be updated as we create tables)
export type UserRole = 'student' | 'faculty' | 'admin';
export type GrievanceStatus = 'Submitted' | 'In Progress' | 'Resolved' | 'Closed';
export type GrievanceCategory = 'Academic' | 'Facility' | 'Examination' | 'Placement' | 'Other';
