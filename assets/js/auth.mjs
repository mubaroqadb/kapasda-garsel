// assets/js/auth.mjs - Fixed version
import { showToast } from './utils.mjs';

// Use the global Supabase client created in supabase-init.js
export const supabase = window.supabase;

// State global
export let currentUser = null;
export let userRole = null;
export let userKecamatanId = null;
export let userKecamatanName = null;
export let userDesaId = null;
export let userDesaName = null;

export async function checkAuth() {
  try {
    // Check if Supabase client is properly initialized
    if (!supabase || !supabase.auth) {
      throw new Error('Supabase client not initialized properly');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return false;
    }

    currentUser = session.user;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nama, role, kecamatan_id, desa_id')
      .eq('user_id', currentUser.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Gagal mengambil data profil pengguna');
    }

    if (!profile) {
      console.error('User profile not found for user ID:', currentUser.id);
      throw new Error('Profil pengguna tidak ditemukan');
    }

    userRole = profile.role;
    userKecamatanId = profile.kecamatan_id;
    userDesaId = profile.desa_id;

    // Add validation for kecamatan users
    if (userRole === 'kecamatan' && !userKecamatanId) {
      console.error('Kecamatan user missing kecamatan_id:', currentUser.id);
      throw new Error('Pengguna kecamatan tidak memiliki ID kecamatan yang valid');
    }

    // Add validation for desa users
    if (userRole === 'desa' && !userDesaId) {
      console.error('Desa user missing desa_id:', currentUser.id);
      throw new Error('Pengguna desa tidak memiliki ID desa yang valid');
    }

    if (userKecamatanId) {
      try {
        const { data: kecData, error: kecError } = await supabase
          .from('kecamatan')
          .select('nama')
          .eq('id', userKecamatanId)
          .single();

        if (kecError) {
          console.error('Error fetching kecamatan data:', kecError);
          userKecamatanName = `Kecamatan ID: ${userKecamatanId}`;
        } else {
          userKecamatanName = kecData?.nama || `Kecamatan ID: ${userKecamatanId}`;
        }
      } catch (err) {
        console.error('Exception fetching kecamatan data:', err);
        userKecamatanName = `Kecamatan ID: ${userKecamatanId}`;
      }
    }

    // Load desa name if applicable
    if (userDesaId) {
      try {
        const { data: desaData, error: desaError } = await supabase
          .from('desa')
          .select('nama')
          .eq('id', userDesaId)
          .single();

        if (desaError) {
          console.error('Error fetching desa data:', desaError);
          userDesaName = `Desa ID: ${userDesaId}`;
        } else {
          userDesaName = desaData?.nama || `Desa ID: ${userDesaId}`;
        }
      } catch (err) {
        console.error('Exception fetching desa data:', err);
        userDesaName = `Desa ID: ${userDesaId}`;
      }
    }

    document.getElementById('userInfo').textContent = `${profile.nama || currentUser.email} (${userRole.toUpperCase()})`;

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