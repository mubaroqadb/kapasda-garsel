import { showToast } from './utils.js';

const SUPABASE_URL = 'https://vedwbuflttjrnhueymer.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZHdidWZsdHRqcm5odWV5bWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY3MDIsImV4cCI6MjA4MDE4MjcwMn0.qqo9_4u8rRRDRh74Jq-PGyc-0md_fO5TgQl9Wap44kE';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export let userRole = null;
export let userKecamatanId = null;
export let userKecamatanName = null;

export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.href = 'login.html';
    return false;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, kecamatan_id, nama')
    .eq('user_id', session.user.id)
    .single();

  if (error || !profile) {
    showToast('Gagal memuat profil', true);
    return false;
  }

  userRole = profile.role;
  userKecamatanId = profile.kecamatan_id;

  if (userKecamatanId) {
    const { data } = await supabase
      .from('kecamatan')
      .select('nama')
      .eq('id', userKecamatanId)
      .single();
    userKecamatanName = data?.nama || 'Unknown';
  }

  document.getElementById('userInfo').textContent = `${profile.nama || session.user.email} (${userRole.toUpperCase()})`;

  // Sembunyikan tab yang tidak diizinkan
  if (userRole === 'kecamatan') {
    document.querySelector('[data-tab="admin"]').style.display = 'none';
  }

  return true;
}

export async function logout() {
  if (!confirm('Yakin ingin keluar?')) return;
  await supabase.auth.signOut();
  location.href = 'login.html';
}