// assets/js/auth.mjs

import { showToast } from './utils.mjs';

// Gunakan window.supabase dari CDN
export const supabase = window.supabase.createClient(
  'https://vedwbuflttjrnhueymer.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE'
);

// State global
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nama, role, kecamatan_id')
      .eq('user_id', currentUser.id)
      .single();

    if (error) throw error;

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

    document.getElementById('userInfo').textContent = `${profile.nama || currentUser.email} (${userRole.toUpperCase()})`;
    document.getElementById('currentKecamatan').textContent = userKecamatanName || '';

    // Sembunyikan tab admin jika bukan admin
    if (userRole !== 'admin') {
      const adminTab = document.querySelector('[data-tab="admin"]');
      if (adminTab) adminTab.classList.add('hidden');
    }

    return true;
  } catch (error) {
    showToast('Gagal memuat profil', true);
    console.error('Auth error:', error);
    window.location.href = 'login.html';
    return false;
  }
}

export async function logout() {
  if (!confirm('Keluar dari aplikasi?')) return;

  try {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    showToast('Gagal logout', true);
    console.error('Logout error:', error);
  }
}