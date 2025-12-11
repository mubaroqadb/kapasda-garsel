import { checkAuth, logout } from './auth.mjs';
import { loadDashboard } from './dashboard.mjs';
import { setupForm } from './form.mjs';
import { setupRekap } from './rekap.mjs';
import { setupAdmin } from './admin.mjs';

export async function initApp() {
  const authOk = await checkAuth();
  if (!authOk) return;

  // Setup semua modul
  await loadDashboard();
  await setupForm();
  await setupRekap();
  await setupAdmin();

  // Tab navigation
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.getElementById(btn.dataset.tab).classList.add('active');
      btn.classList.add('active');
    });
  });

  document.getElementById('btnLogout').addEventListener('click', logout);

  document.getElementById('loading').remove();
}