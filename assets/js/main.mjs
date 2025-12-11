// assets/js/main.mjs

import { checkAuth, logout } from './auth.mjs';
import { loadDashboard } from './dashboard.mjs';
import { setupForm } from './form.mjs';
import { setupRekap } from './rekap.mjs';
import { setupAdmin } from './admin.mjs';
import { loadDataPembanding, loadAllKecamatanData } from './data.mjs';

export async function initApp() {
  // Buat client jika belum ada (fix null AuthClient)
  if (!window.supabase) {
    window.supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  // 1. Cek autentikasi dulu
  const authOK = await checkAuth();
  if (!authOK) return;

  const loadingOverlay = document.getElementById('loadingOverlay');

  try {
    // 2. Load data global terlebih dahulu
    await Promise.all([
      loadDataPembanding(),
      loadAllKecamatanData()
    ]);

    // 3. Setup semua tab secara paralel (lebih cepat)
    await Promise.all([
      loadDashboard(),
      setupForm(),
      setupRekap(),
      setupAdmin()
    ]);

    // 4. Sembunyikan loading dengan animasi halus
    loadingOverlay.style.transition = 'opacity 0.6s ease';
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      loadingOverlay.remove();
    }, 700);

  } catch (error) {
    console.error('Gagal inisialisasi aplikasi:', error);
    loadingOverlay.innerHTML = `
      <div class="text-center">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Aplikasi</p>
        <p class="text-gray-700 mb-4">${error.message || 'Terjadi kesalahan'}</p>
        <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition">
          Muat Ulang
        </button>
      </div>`;
  }

  // 5. Setup navigasi tab
  document.querySelectorAll('[data-tab="dashboard"]').classList.add('active');
  document.getElementById('dashboard').classList.add('active');

  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      // Hapus active dari semua
      document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      // Tambah active ke yang diklik
      button.classList.add('active');
      const targetId = button.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // 6. Tombol logout
  document.getElementById('btnLogout')?.addEventListener('click', logout);
}

// Jalankan aplikasi
initApp();