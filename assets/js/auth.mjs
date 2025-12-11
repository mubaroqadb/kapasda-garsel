// assets/js/auth.mjs

import { showToast } from './utils.mjs';

// Gunakan window.supabase dari CDN (tidak perlu createClient lagi)
export const supabase = window.supabase;

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