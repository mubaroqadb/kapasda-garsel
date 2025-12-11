// assets/js/admin.mjs

import { supabase, userRole } from './auth.mjs';
import { dataPembanding, loadDataPembanding, allKecamatanData } from './data.mjs';
import { showToast } from './utils.mjs';
import { INDIKATORS } from './indikator.mjs';

export async function setupAdmin() {
  // Hanya admin yang boleh masuk
  if (userRole !== 'admin') {
    document.getElementById('admin').innerHTML = `
      <div class="text-center py-20">
        <i class="fas fa-lock text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600">Akses Ditolak</p>
        <p class="text-gray-600">Halaman ini hanya untuk Administrator</p>
      </div>`;
    return;
  }

  await loadDataPembanding();

  const container = document.getElementById('admin');
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-md p-5 mb-6">
      <h3 class="font-semibold text-gray-700 mb-4"><i class="fas fa-database mr-2"></i>Edit Data Pembanding</h3>
      <p class="text-gray-500 text-sm mb-4">Data pembanding digunakan sebagai acuan perhitungan rasio dan skor.</p>
      
      <div id="adminDataPembanding" class="space-y-6"></div>

      <div class="mt-8 flex flex-wrap gap-3">
        <button id="savePembandingBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center gap-2">
          <i class="fas fa-save"></i> Simpan Data Pembanding
        </button>
        <button id="resetPembandingBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition flex items-center gap-2">
          <i class="fas fa-undo"></i> Reset ke Default
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md p-5">
      <h3 class="font-semibold text-gray-700 mb-4"><i class="fas fa-tools mr-2"></i>Kelola Data</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button id="clearAllBtn" class="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition">
          <i class="fas fa-trash mr-2"></i>Hapus Semua Data
        </button>
        <button id="backupBtn" class="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition">
          <i class="fas fa-download mr-2"></i>Backup Data
        </button>
        <button id="exportCsvBtn" class="bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg transition">
          <i class="fas fa-file-csv mr-2"></i>Export CSV
        </button>
        <label class="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg cursor-pointer text-center transition">
          <i class="fas fa-upload mr-2"></i>Restore Data
          <input type="file" id="restoreFile" accept=".json" class="hidden">
        </label>
      </div>
    </div>`;

  renderPembandingInputs();

  // Event listener
  document.getElementById('savePembandingBtn').onclick = saveDataPembanding;
  document.getElementById('resetPembandingBtn').onclick = resetDataPembanding;
  document.getElementById('clearAllBtn').onclick = clearAllData;
  document.getElementById('backupBtn').onclick = backupAllData;
  document.getElementById('exportCsvBtn').onclick = exportPenilaianCSV;
  document.getElementById('restoreFile').onchange = importAllData;
}

function renderPembandingInputs() {
  const container = document.getElementById('adminDataPembanding');
  container.innerHTML = '';

  INDIKATORS.forEach(group => {
    group.subs.forEach(sub => {
      const div = document.createElement('div');
      div.className = 'flex items-center gap-4 p-4 bg-gray-50 rounded-lg';
      div.innerHTML = `
        <div class="flex-1">
          <p class="font-medium text-gray-700">${sub.id} - ${sub.nama}</p>
          <p class="text-xs text-gray-500">Bobot: ${sub.bobot} | Tipe: ${sub.type}</p>
        </div>
        <input 
          type="number" 
          step="any"
          data-id="${sub.id}"
          value="${dataPembanding[sub.id] || sub.pembanding}"
          class="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
      `;
      container.appendChild(div);
    });
  });
}

async function saveDataPembanding() {
  const inputs = document.querySelectorAll('#adminDataPembanding input');
  const updates = [];

  inputs.forEach(input => {
    const id = input.dataset.id;
    const value = parseFloat(input.value) || 0;
    const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === id);

    updates.push({
      subindikator_kode: id,
      subindikator_nama: sub.nama,
      nilai_max: value,
      rumus: sub.type
    });

    // Update memori langsung
    dataPembanding[id] = value;
  });

  try {
    const { error } = await supabase
      .from('data_pembanding')
      .upsert(updates, { onConflict: 'subindikator_kode' });

    if (error) throw error;

    showToast('Data pembanding berhasil disimpan!');
    // Refresh semua perhitungan jika perlu bisa ditambahkan di sini
  } catch (err) {
    showToast('Gagal menyimpan data pembanding!', true);
    console.error(err);
  }
}

function resetDataPembanding() {
  if (!confirm('Reset semua nilai pembanding ke default?')) return;

  INDIKATORS.forEach(group => {
    group.subs.forEach(sub => {
      const input = document.querySelector(`input[data-id="${sub.id}"]`);
      if (input) input.value = sub.pembanding;
      dataPembanding[sub.id] = sub.pembanding;
    });
  });

  showToast('Nilai pembanding direset ke default');
}

async function clearAllData() {
  if (!confirm('HAPUS SEMUA DATA PENILAIAN? Tindakan ini tidak bisa dibatalkan!')) return;
  if (!confirm('YAKIN SEKALI? Semua data kecamatan akan hilang permanen!')) return;

  try {
    const { error } = await supabase.from('penilaian').delete().neq('id', 0); // hapus semua
    if (error) throw error;
    showToast('Semua data berhasil dihapus');
    location.reload();
  } catch (err) {
    showToast('Gagal menghapus data', true);
  }
}

async function backupAllData() {
  const data = {
    pembanding: dataPembanding,
    penilaian: Object.values(allKecamatanData)
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kapasda-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  showToast('Backup berhasil di-download');
}

function exportPenilaianCSV() {
  // Akan dibuat di rekap.mjs nanti
  alert('Fungsi export CSV akan tersedia di tab Rekap');
}

async function importAllData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      // Logika restore bisa ditambahkan jika diperlukan
      showToast('Restore dari file belum diimplementasikan');
    } catch {
      showToast('File backup tidak valid', true);
    }
  };
  reader.readAsText(file);
}