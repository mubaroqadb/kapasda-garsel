/**
 * Fixed Supabase Client Initialization
 * This fixes the critical bug where window.supabase was not defined
 */

// Wait for Supabase library to load, then initialize
document.addEventListener('DOMContentLoaded', function() {
  // Check if Supabase library is loaded
  if (typeof supabase !== 'undefined') {
    // Initialize Supabase client
    const SUPABASE_URL = 'https://vedwbuflttjrnhueymer.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE';

    // Create client and assign to window
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.error('❌ Supabase library not loaded');
  }
});