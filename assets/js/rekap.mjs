// assets/js/rekap.mjs

import { supabase } from './auth.mjs';
import { allKecamatanData, loadAllKecamatanData } from './data.mjs';
import { BATAS_LAYAK } from './indikator.mjs';
import { showToast } from './utils.mjs';

export async function setupRekap() {
  const container = document.getElementById('rekap');
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-md p-5 mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 class="font-semibold text-gray-700"><i class="fas fa-table mr-2"></i>Rekap Data Seluruh Kecamatan</h3>
        <div class="flex gap-2">
          <button id="exportExcelBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2">
            <i class="fas fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table id="rekapTable" class="min-w-full divide-y divide-gray-200">
          <thead id="rekapTableHead" class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kecamatan</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Nilai</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir Update</th>
            </tr>
          </thead>
          <tbody id="rekapTableBody" class="bg-white divide-y divide-gray-200"></tbody>
        </table>
      </div>
    </div>`;

  // Add event listener for export button
  document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
  
  await updateRekapTable();
}

async function updateRekapTable() {
  await loadAllKecamatanData();

  const { data: kecamatanList, error } = await supabase
    .from('kecamatan')
    .select('id, nama')
    .order('nama');

  if (error) {
    showToast('Gagal memuat daftar kecamatan', true);
    return;
  }

  const tbody = document.getElementById('rekapTableBody');
  tbody.innerHTML = '';

  // Sort berdasarkan total_nilai descending
  const sorted = Object.entries(allKecamatanData)
    .map(([id, record]) => ({
      id: Number(id),
      nama: kecamatanList.find(k => k.id === Number(id))?.nama || 'Tidak diketahui',
      total_nilai: record.total_nilai || 0,
      updated_at: record.updated_at
    }))
    .sort((a, b) => b.total_nilai - a.total_nilai);

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Tidak ada data</td></tr>';
    return;
  }

  sorted.forEach((item, index) => {
    const isLayak = item.total_nilai >= BATAS_LAYAK;
    const status = isLayak ? 'LAYAK' : 'TIDAK LAYAK';
    const statusClass = isLayak ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-3 text-left">${index + 1}</td>
      <td class="px-4 py-3 text-left">${item.nama}</td>
      <td class="px-4 py-3 text-center">${item.total_nilai}</td>
      <td class="px-4 py-3 text-center">
        <span class="px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
          ${status}
        </span>
      </td>
      <td class="px-4 py-3 text-center text-sm text-gray-500">
        ${item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Export to Excel (persis seperti asli, dengan XLSX)
async function exportExcel() {
  await loadAllKecamatanData();

  const { data: kecamatanList } = await supabase
    .from('kecamatan')
    .select('id, nama');

  const exportData = Object.entries(allKecamatanData)
    .map(([id, record]) => ({
      No: '', // akan diisi nanti setelah sort
      Kecamatan: kecamatanList.find(k => k.id === Number(id))?.nama || 'Tidak diketahui',
      'Total Nilai': record.total_nilai || 0,
      Status: (record.total_nilai || 0) >= BATAS_LAYAK ? 'LAYAK' : 'TIDAK LAYAK',
      'Terakhir Update': record.updated_at ? new Date(record.updated_at).toLocaleDateString('id-ID') : '-'
    }));

  // Sort berdasarkan total_nilai descending dan isi No
  exportData.sort((a, b) => b['Total Nilai'] - a['Total Nilai']);
  exportData.forEach((row, index) => row.No = index + 1);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Data");

  XLSX.writeFile(wb, 'KAPASDA_Rekap.xlsx');
};