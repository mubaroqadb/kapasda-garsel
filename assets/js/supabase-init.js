/**
 * Fixed Supabase Client Initialization
 * This fixes the critical bug where window.supabase was not defined
 */

// Initialize Supabase client globally before importing modules
const SUPABASE_URL = 'https://vedwbuflttjrnhueymer.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE';

// Create global Supabase client - FIXED VERSION
window.supabase = window.supabase && window.supabase.createClient ?
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) :
    supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized successfully');
