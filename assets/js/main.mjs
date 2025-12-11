// assets/js/main.mjs

import { checkAuth, logout } from './auth.mjs';
import { loadDashboard } from './dashboard.mjs';
import { setupForm } from './form.mjs';
import { setupRekap } from './rekap.mjs';
import { setupAdmin } from './admin.mjs';
import { loadDataPembanding, loadAllKecamatanData } from './data.mjs';

export async function initApp() {
  console.log('Initializing KAPASDA application...');
  
  const loadingOverlay = document.getElementById('loading');
  if (!loadingOverlay) {
    console.error('Loading overlay element not found');
    return;
  }

  try {
    // 1. Cek autentikasi dulu
    console.log('Checking authentication...');
    const authOK = await checkAuth();
    if (!authOK) {
      console.log('Authentication failed, redirecting to login');
      return;
    }
    console.log('Authentication successful');

    // 2. Load data global terlebih dahulu
    console.log('Loading global data...');
    await Promise.all([
      loadDataPembanding().catch(err => {
        console.error('Failed to load data pembanding:', err);
        // Continue without pembanding data, will use defaults
        return { error: err };
      }),
      loadAllKecamatanData().catch(err => {
        console.error('Failed to load kecamatan data:', err);
        // Continue without kecamatan data
        return { error: err };
      })
    ]);
    console.log('Global data loaded');

    // 3. Setup semua tab secara paralel (lebih cepat)
    console.log('Setting up application tabs...');
    await Promise.all([
      loadDashboard().catch(err => {
        console.error('Failed to load dashboard:', err);
        return { error: err };
      }),
      setupForm().catch(err => {
        console.error('Failed to setup form:', err);
        return { error: err };
      }),
      setupRekap().catch(err => {
        console.error('Failed to setup rekap:', err);
        return { error: err };
      }),
      setupAdmin().catch(err => {
        console.error('Failed to setup admin:', err);
        return { error: err };
      })
    ]);
    console.log('Application tabs setup complete');

    // 4. Sembunyikan loading dengan animasi halus
    loadingOverlay.style.transition = 'opacity 0.6s ease';
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      loadingOverlay.remove();
    }, 700);
    console.log('Application initialization complete');

  } catch (error) {
    console.error('Critical error during application initialization:', error);
    
    // Determine error type for better user message
    let errorMessage = 'Terjadi kesalahan yang tidak diketahui';
    let errorDetails = '';
    
    if (error.message) {
      if (error.message.includes('profil')) {
        errorMessage = 'Gagal memuat profil pengguna';
        errorDetails = 'Periksa koneksi internet dan coba lagi';
      } else if (error.message.includes('kecamatan')) {
        errorMessage = 'Data kecamatan tidak valid';
        errorDetails = 'Hubungi administrator untuk memperbaiki data akun Anda';
      } else if (error.message.includes('database') || error.message.includes('network')) {
        errorMessage = 'Gagal terhubung ke server';
        errorDetails = 'Periksa koneksi internet Anda';
      } else {
        errorMessage = error.message;
        errorDetails = 'Coba muat ulang halaman';
      }
    }
    
    loadingOverlay.innerHTML = `
      <div class="text-center">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Aplikasi</p>
        <p class="text-lg text-gray-700 mb-2">${errorMessage}</p>
        <p class="text-sm text-gray-600 mb-4">${errorDetails}</p>
        <div class="flex gap-3 justify-center">
          <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
            Muat Ulang
          </button>
          <button onclick="window.location.href='login.html'" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition">
            Login Ulang
          </button>
        </div>
        <details class="mt-4 text-left">
          <summary class="text-sm text-gray-500 cursor-pointer">Detail Teknis</summary>
          <pre class="text-xs text-gray-600 mt-2 overflow-auto max-w-md mx-auto">${error.stack || error.message}</pre>
        </details>
      </div>`;
  }

  // 5. Setup navigasi tab
  document.querySelectorAll('[data-tab="dashboard"]').forEach(tab => tab.classList.add('active'));
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
