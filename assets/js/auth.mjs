import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { showToast } from './utils.mjs';

const SUPABASE_URL = 'https://vedwbuflttjrnhueymer.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export let currentUser = null;
export let userRole = null;
export let userKecamatanId = null;
export let userKecamatanName = null;

export async function checkAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return false;
    }

    currentUser = session.user;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (profileError) throw profileError;

    userRole = profile.role;
    userKecamatanId = profile.kecamatan_id;

    if (userKecamatanId) {
      const { data: kecData } = await supabase
        .from('kecamatan')
        .select('nama')
        .eq('id', userKecamatanId)
        .single();

      userKecamatanName = kecData?.nama || '';
    }

    document.getElementById('userInfo').textContent = `${profile.nama || profile.email} (${userRole.toUpperCase()})`;
    document.getElementById('currentKecamatan').textContent = userKecamatanName || '';

    if (userRole !== 'admin') {
      document.querySelector('[data-tab="admin"]').classList.add('hidden');
    }

    // Verify database schema (persis seperti asli)
    const schemaValid = await verifyDatabaseSchema();
    if (!schemaValid) {
      showToast('Skema database tidak valid. Hubungi administrator.', true);
      return false;
    }

    return true;
  } catch (err) {
    showToast('Error loading user data', true);
    console.error(err);
    return false;
  }
}

async function verifyDatabaseSchema() {
  try {
    const { data, error } = await supabase
      .from('penilaian')
      .select('*')
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const requiredColumns = ['id', 'kecamatan_id', 'data', 'total_nilai', 'status'];
      const available = Object.keys(data[0]);
      for (const col of requiredColumns) {
        if (!available.includes(col)) {
          console.error(`Missing column ${col} in penilaian table`);
          return false;
        }
      }
    }

    return true;
  } catch (err) {
    console.error('Schema verification error:', err);
    return false;
  }
}

export async function logout() {
  if (!confirm('Keluar dari aplikasi?')) return;

  try {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  } catch (err) {
    showToast('Error during logout', true);
    console.error(err);
  }
}