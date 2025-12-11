// assets/js/form.mjs

import { supabase, userRole, userKecamatanId, userKecamatanName } from './auth.mjs';
import { dataPembanding, allKecamatanData, loadAllKecamatanData, saveKecamatanData } from './data.mjs';
import { showToast } from './utils.mjs';
import { INDIKATORS, BATAS_LAYAK } from './indikator.mjs';

let currentKecamatanId = null;

// Inisialisasi tab Form
export async function setupForm() {
  const container = document.getElementById('form');
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-md p-5 mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div class="flex flex-wrap gap-4">
          ${userRole === 'admin' ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Kecamatan</label>
            <select id="selectKecamatan" class="w-full md:w-56 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">-- Pilih Kecamatan --</option>
            </select>
          </div>` : ''}
        </div>
        <div class="flex gap-2">
          <button id="saveDataBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2">
            Simpan
          </button>
          <button id="resetFormBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2">
            Reset
          </button>
        </div>
      </div>

      <div id="statusDisplay" class="mb-6 p-4 rounded-lg bg-gray-100">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="text-center md:text-left">
            <p class="text-gray-600 text-sm">Total Nilai</p>
            <p id="totalNilai" class="text-4xl font-bold text-blue-600">0</p>
          </div>
          <div class="text-center">
            <p class="text-gray-600 text-sm">Total Bobot</p>
            <p class="text-2xl font-semibold text-gray-700">100</p>
          </div>
          <div id="statusKelayakan" class="px-6 py-3 rounded-lg text-white font-bold text-lg status-tidak-layak">
            TIDAK LAYAK
          </div>
        </div>
      </div>

      <div id="formIndicators" class="space-y-4"></div>
    </div>`;

  // Jika user adalah kecamatan → langsung set ke kecamatan miliknya
  if (userRole === 'kecamatan') {
    // Validate that kecamatan user has valid data
    if (!userKecamatanId) {
      console.error('Kecamatan user missing userKecamatanId');
      container.innerHTML = `
        <div class="bg-white rounded-xl shadow-md p-5 mb-6">
          <div class="text-center py-8">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <p class="text-xl font-bold text-red-600 mb-2">Data Kecamatan Tidak Ditemukan</p>
            <p class="text-gray-700 mb-4">Akun Anda tidak terhubung dengan data kecamatan yang valid. Silakan hubungi administrator.</p>
          </div>
        </div>`;
      return;
    }
    
    currentKecamatanId = userKecamatanId;
    
    // Use fallback name if userKecamatanName is not available
    const displayName = userKecamatanName || `Kecamatan ID: ${userKecamatanId}`;
    
    const statusDisplay = document.querySelector('#statusDisplay > div > div:first-child');
    if (statusDisplay) {
      statusDisplay.insertAdjacentHTML('afterbegin', `
        <p class="text-lg font-medium text-gray-700 mb-2">Kecamatan: <strong>${displayName}</strong></p>
      `);
    }
  }

  // Jika admin → isi dropdown
  if (userRole === 'admin') {
    await populateKecamatanSelect();
    // Add event listener for kecamatan select
    document.getElementById('selectKecamatan').addEventListener('change', onKecamatanChange);
  }

  // Add event listeners for buttons
  document.getElementById('saveDataBtn').addEventListener('click', saveData);
  document.getElementById('resetFormBtn').addEventListener('click', resetForm);

  // Load data pertama kali
  await loadFormData();
}

// Isi dropdown kecamatan (hanya untuk admin)
async function populateKecamatanSelect() {
  const { data, error } = await supabase
    .from('kecamatan')
    .select('id, nama')
    .order('nama', { ascending: true });

  if (error) {
    showToast('Gagal memuat daftar kecamatan', true);
    return;
  }

  const select = document.getElementById('selectKecamatan');
  data.forEach(kec => {
    const option = document.createElement('option');
    option.value = kec.id;
    option.textContent = kec.nama;
    select.appendChild(option);
  });
}

// Dipanggil saat admin ganti kecamatan
async function onKecamatanChange() {
  const select = document.getElementById('selectKecamatan');
  currentKecamatanId = select.value ? Number(select.value) : null;
  await loadFormData();
};

// Render semua indikator + hitung skor real-time
async function loadFormData() {
  if (userRole === 'admin' && !currentKecamatanId) {
    document.getElementById('formIndicators').innerHTML = '<p class="text-center text-gray-500 py-8">Silakan pilih kecamatan terlebih dahulu</p>';
    updateTotal(0);
    return;
  }

  if (userRole === 'kecamatan' && !currentKecamatanId) {
    if (userKecamatanId) {
      currentKecamatanId = userKecamatanId;
    } else {
      document.getElementById('formIndicators').innerHTML = '<p class="text-center text-red-500 py-8">Error: Data kecamatan tidak tersedia. Silakan refresh halaman atau hubungi administrator.</p>';
      updateTotal(0);
      return;
    }
  }

  try {
    await loadAllKecamatanData();
  } catch (error) {
    console.error('Failed to load kecamatan data:', error);
    document.getElementById('formIndicators').innerHTML = '<p class="text-center text-red-500 py-8">Gagal memuat data kecamatan. Silakan coba lagi nanti.</p>';
    updateTotal(0);
    return;
  }
  
  const savedData = allKecamatanData[currentKecamatanId]?.data || {};

  const container = document.getElementById('formIndicators');
  container.innerHTML = '';

  let totalScore = 0;

  INDIKATORS.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'bg-gray-50 rounded-lg p-4 indicator-group';
    groupDiv.innerHTML = `<h3 class="font-bold text-lg text-gray-800 mb-4">${group.no}. ${group.nama}</h3>`;

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    group.subs.forEach(sub => {
      const value = savedData[sub.id] ?? '';
      const inputValue = value === null ? '' : value;

      const ratio = sub.type === 'ratio' && value !== '' && value !== null
        ? value / dataPembanding[sub.id]
        : value;

      const skor = sub.skor(ratio ?? value ?? '');
      totalScore += skor * sub.bobot;

      const item = document.createElement('div');
      item.className = 'bg-white p-4 rounded-lg border';
      item.innerHTML = `
        <p class="text-sm font-medium text-gray-700">${sub.id} – ${sub.nama}</p>
        <input 
          type="number" 
          step="any" 
          data-id="${sub.id}"
          value="${inputValue}"
          class="input-field mt-2 w-full px-3 py-2 border rounded-lg"
          placeholder="Masukkan nilai">
        <div class="mt-2 text-xs text-gray-600">
          Pembanding: <strong>${dataPembanding[sub.id] || '?'}</strong>
          → Skor: <strong>${skor}</strong> × ${sub.bobot} = <strong>${skor * sub.bobot}</strong>
        </div>
      `;

      // Real-time update saat input berubah
      item.querySelector('input').addEventListener('input', () => loadFormData());

      grid.appendChild(item);
    });

    groupDiv.appendChild(grid);
    container.appendChild(groupDiv);
  });

  updateTotal(totalScore);
}

function updateTotal(total) {
  document.getElementById('totalNilai').textContent = Math.round(total);

  const statusEl = document.getElementById('statusKelayakan');
  if (total >= BATAS_LAYAK) {
    statusEl.textContent = 'LAYAK';
    statusEl.className = 'px-6 py-3 rounded-lg text-white font-bold text-lg status-layak';
  } else {
    statusEl.textContent = 'TIDAK LAYAK';
    statusEl.className = 'px-6 py-3 rounded-lg text-white font-bold text-lg status-tidak-layak';
  }
}

// Simpan data
async function saveData() {
  if (!currentKecamatanId) {
    showToast('Pilih kecamatan terlebih dahulu', true);
    return;
  }

  const inputs = document.querySelectorAll('#formIndicators input');
  const formData = {};

  inputs.forEach(input => {
    const val = input.value.trim();
    formData[input.dataset.id] = val === '' ? null : Number(val);
  });

  let total = 0;
  INDIKATORS.forEach(g => {
    g.subs.forEach(s => {
      const v = formData[s.id];
      if (v !== null && v !== undefined) {
        const ratio = s.type === 'ratio' ? v / dataPembanding[s.id] : v;
        const skor = s.skor(ratio);
        total += skor * s.bobot;
      }
    });
  });

  try {
    await saveKecamatanData(currentKecamatanId, formData, Math.round(total));
    await loadFormData(); // refresh tampilan
    showToast('Data berhasil disimpan!');
  } catch (err) {
    showToast('Gagal menyimpan data', true);
  }
};

// Reset form
async function resetForm() {
  if (confirm('Reset semua nilai ke kosong?')) {
    document.querySelectorAll('#formIndicators input').forEach(i => i.value = '');
    loadFormData();
  }
};