// assets/js/auth.mjs

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { showToast } from './utils.mjs';

const SUPABASE_URL = 'https://vedwbuflttjrnhueymer.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State global untuk user
export let currentUser = null;
export let userRole = null;
export let userKecamatanId = null;
export let userKecamatanName = null;

export async function checkAuth() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      window.location.href = 'login.html';
      return false;
    }

    currentUser = session.user;

    // Ambil profil dari tabel profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nama, role, kecamatan_id')
      .eq('user_id', currentUser.id)
      .single();

    if (profileError || !profile) {
      showToast('Profil tidak ditemukan. Hubungi admin.', true);
      await supabase.auth.signOut();
      window.location.href = 'login.html';
      return false;
    }

    userRole = profile.role;
    userKecamatanId = profile.kecamatan_id;

    // Update info di header
    document.getElementById('userInfo').textContent = 
      `${profile.nama || currentUser.email} (${userRole.toUpperCase()})`;

    // Jika user adalah kecamatan, ambil nama kecamatannya
    if (userRole === 'kecamatan' && userKecamatanId) {
      const { data: kec, error } = await supabase
        .from('kecamatan')
        .select('nama')
        .eq('id', userKecamatanId)
        .single();

      if (!error && kec) {
        userKecamatanName = kec.nama;
        document.getElementById('currentKecamatan').textContent = userKecamatanName;
      }
    }

    // Sembunyikan tab Admin jika bukan admin
    if (userRole !== 'admin') {
      const adminTab = document.querySelector('[data-tab="admin"]');
      if (adminTab) adminTab.style.display = 'none';
    }

    return true;
  } catch (err) {
    console.error('Error in checkAuth:', err);
    showToast('Gagal memuat data pengguna', true);
    window.location.href = 'login.html';
    return false;
  }
}

export async function logout() {
  if (!confirm('Yakin ingin keluar dari aplikasi?')) return;

  try {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  } catch (err) {
    showToast('Gagal logout', true);
    console.error(err);
  }
}