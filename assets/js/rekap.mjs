import { allKecamatanData, loadAllKecamatanData } from './data.mjs';
import { supabase } from './data.mjs';
import { formatDate } from './utils.mjs';
import { BATAS_LAYAK } from './indikator.mjs';
import XLSX from 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

export async function setupRekap() {
  await renderTable();
}

async function renderTable() {
  await loadAllKecamatanData();
  const tbody = document.getElementById('rekapTableBody') || document.querySelector('#rekap tbody');
  if (!tbody) return;

  const sorted = Object.entries(allKecamatanData)
    .map(([id, val]) => ({ id: parseInt(id), ...val }))
    .sort((a, b) => b.total_nilai - a.total_nilai);

  const { data: kecList } = await supabase.from('kecamatan').select('id, nama');

  tbody.innerHTML = sorted.map((item, idx) => {
    const kec = kecList.find(k => k.id === item.id);
    const status = item.total_nilai >= BATAS_LAYAK ? 'LAYAK' : 'BELUM LAYAK';
    const badge = item.total_nilai >= BATAS_LAYAK
      ? '<span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">LAYAK</span>'
      : '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">BELUM</span>';

    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 font-bold text-gray-700">${idx + 1}</td>
        <td class="px-6 py-4">${kec?.nama || '??'}</td>
        <td class="px-6 py-4 text-center text-xl font-bold">${item.total_nilai || 0}</td>
        <td class="px-6 py-4 text-center">${badge}</td>
        <td class="px-6 py-4 text-center text-sm text-gray-600">${formatDate(item.updated_at)}</td>
      </tr>
    `;
  }).join('');
}

window.exportExcel = async () => {
  await loadAllKecamatanData();
  const data = Object.entries(allKecamatanData).map(([id, val]) => ({
    Kecamatan: 'loading...',
    Skor: val.total_nilai,
    Status: val.total_nilai >= BATAS_LAYAK ? 'LAYAK' : 'BELUM LAYAK'
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.mjson_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Rekap");
  XLSX.writeFile(wb, "KAPASDA_Rekapitulasi.xlsx");
};