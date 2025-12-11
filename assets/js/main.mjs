import { checkAuth, logout } from './auth.mjs';
import { loadDashboard } from './dashboard.mjs';
import { setupForm } from './form.mjs';
import { setupRekap } from './rekap.mjs';
import { setupAdmin } from './admin.mjs';

export async function initApp() {
  const ok = await checkAuth();
  if (!ok) return;

  const loading = document.getElementById('loading');

  try {
    await Promise.all([
      loadDashboard(),
      setupForm(),
      setupRekap(),
      setupAdmin()
    ]);

    loading.style.transition = 'opacity 0.8s';
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 900);
  } catch (e) {
    loading.innerHTML = `<div class="text-center text-red-600 text-xl">Gagal: ${e.message}<br><button onclick="location.reload()" class="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl">Reload</button></div>`;
  }

  document.querySelectorAll('[data-tab]').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.getElementById(b.dataset.tab).classList.add('active');
      b.classList.add('active');
    };
  });

  document.getElementById('btnLogout').onclick = logout;
}