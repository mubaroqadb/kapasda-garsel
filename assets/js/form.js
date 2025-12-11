import { supabase, userKecamatanId, userRole } from './auth.js';
import { dataPembanding, saveKecamatanData, loadAllKecamatanData } from './data.js';
import { INDIKATORS, BATAS_LAYAK } from './indikator.js';
import { showToast, formatNumber } from './utils.js';

let currentKecamatanId = null;

export async function setupForm() {
  await renderKecamatanSelect();

  document.getElementById('selectKecamatan')?.addEventListener('change', async (e) => {
    currentKecamatanId = parseInt(e.target.selectedOptions[0].dataset.id);
    await loadFormData();
  });

  // Jika user hanya kecamatan, langsung load datanya
  if (userRole === 'kecamatan') {
    currentKecamatanId = userKecamatanId;
    document.getElementById('formKecamatanName').textContent = userKecamatanName;
    await loadFormData();
  }
}

async function renderKecamatanSelect() {
  {
  const { data } = await supabase.from('kecamatan').select('id, nama').order('nama');
  const select = document.getElementById('selectKecamatan');
  if (!select) return;

  select.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
  data.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.nama;
    opt.dataset.id = k.id;
    opt.textContent = k.nama;
    if (k.id === userKecamatanId) opt.selected = true;
    select.appendChild(opt);
  });

  if (userRole === 'kecamatan') select.disabled = true;
}

export async function loadFormData() {
  const container = document.getElementById('formIndicators');
  if (!container) return;
  container.innerHTML = '';

  // Ambil data dari memori
  const saved = allKecamatanData[currentKecamatanId]?.data || {};

  let total = 0;
  INDIKATORS.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'bg-gray-50 rounded-xl p-6 mb-6 shadow';
    groupEl.innerHTML = `<h3 class="text-lg font-bold text-gray-800 mb-4">${group.no}. ${group.nama}</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="group-${group.no}"></div>`;
    container.appendChild(groupEl);

    group.subs.forEach(sub => {
      const val = saved[sub.id] || '';
      const ratio = sub.type === 'ratio' && val ? (val / dataPembanding[sub.id]) : null;
      const skor = sub.skor(sub.type === 'ratio' ? ratio : val);
      total += skor * sub.bobot;

      const div = document.createElement('div');
      div.className = 'bg-white p-4 rounded-lg border';
      div.innerHTML = `
        <p class="font-medium text-gray-700">${sub.id} – ${sub.nama}</p>
        <input type="number" step="any" data-id="${sub.id}" value="${val}" class="mt-2 w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500">
        <p class="text-sm text-gray-600 mt-2">Pembanding: ${formatNumber(dataPembanding[sub.id])} → Skor: <strong>${skor}</strong> × ${sub.bobot} = ${skor * sub.bobot}</p>
      `;
      document.getElementById(`group-${group.no}`).appendChild(div);
    });
  });

  document.getElementById('totalNilai').textContent = Math.round(total);
  document.getElementById('progressFill').style.width = `${Math.min(total / BATAS_LAYAK * 100, 100)}%`;
  document.getElementById('progressText').textContent = `${Math.round(total / BATAS_LAYAK * 100)}%`;
  const statusEl = document.getElementById('statusKelayakan');
  if (total >= BATAS_LAYAK) {
    statusEl.textContent = 'LAYAK';
    statusEl.className = 'px-10 py-6 rounded-2xl text-white text-2xl font-bold status-layak';
  } else {
    statusEl.textContent = 'BELUM LAYAK';
    statusEl.className = 'px-10 py-6 rounded-2xl text-white text-2xl font-bold status-tidak-layak';
  }
}

window.saveData = async () => {
  if (!currentKecamatanId) return showToast('Pilih kecamatan dulu!', true);

  const inputs = document.querySelectorAll('#formIndicators input');
  const formData = {};
  inputs.forEach(inp => {
    formData[inp.dataset.id] = inp.value === '' ? null : parseFloat(inp.value);
  });

  let total = 0;
  INDIKATORS.forEach(g => {
    g.subs.forEach(s => {
      const v = formData[s.id];
      const ratio = s.type === 'ratio' && v ? v / dataPembanding[s.id] : v;
      const skor = s.skor(ratio ?? v ?? '');
      total += skor * s.bobot;
    });
  });

  try {
    await saveKecamatanData(currentKecamatanId, formData, Math.round(total));
    await loadAllKecamatanData();
    // refresh dashboard & rekap
    if (window.loadDashboard) window.loadDashboard();
    if (window.setupRekap) window.setupRekap();
  } catch (e) {
    showToast('Gagal menyimpan: ' + e.message, true);
  }
};

window.resetForm = () => {
  if (!confirm('Reset semua input?')) return;
  document.querySelectorAll('#formIndicators input').forEach(i => i.value = '');
  loadFormData();
};