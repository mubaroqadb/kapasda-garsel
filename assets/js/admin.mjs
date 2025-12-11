import { userRole } from './auth.mjs';
import { dataPembanding, loadDataPembanding, saveDataPembanding, recalculateAllKecamatan } from './data.mjs';
import { supabase } from './data.mjs';
import { showToast } from './utils.mjs';
import { INDIKATORS } from './indikator.mjs';

export async function setupAdmin() {
  if (userRole !== 'admin') {
    document.getElementById('admin').innerHTML = '<p class="text-center text-red-600 text-xl">Hanya admin yang boleh mengakses halaman ini.</p>';
    return;
  }

  await loadDataPembanding();
  renderPembandingTable();
}

function renderPembandingTable() {
  const container = document.getElementById('adminDataPembanding');
  container.innerHTML = INDIKATORS.map(group => `
    <div class="mb-8">
      <h4 class="font-bold text-lg mb-3">${group.no}. ${group.nama}</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${group.subs.map(sub => `
          <div class="bg-white p-4 rounded-lg border">
            <p class="font-medium">${sub.id} – ${sub.nama}</p>
            <input type="number" step="any" id="pemb_${sub.id}" value="${dataPembanding[sub.id] || sub.pembanding}" class="mt-2 w-full px-3 py-2 border rounded-lg">
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Tombol
  container.innerHTML += `
    <div class="flex gap-4 mt-8">
      <button onclick="savePembanding()" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg">Simpan Pembanding</button>
      <button onclick="resetPembanding()" class="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl shadow-lg">Reset Default</button>
    </div>
  `;
}

window.savePembanding = async () => {
  const updates = [];
  INDIKATORS.forEach(g => {
    g.subs.forEach(s => {
      const inp = document.getElementById(`pemb_${s.id}`);
      if (inp) {
        updates.push({
          subindikator_kode: s.id,
          subindikator_nama: s.nama,
          nilai_max: parseFloat(inp.value) || s.pembanding
        });
      }
    });
  });

  const { error } = await supabase.from('data_pembanding').upsert(updates, { onConflict: 'subindikator_kode' });
  if (error) {
    showToast('Gagal simpan pembanding', true);
  } else {
    await loadDataPembanding();
    showToast('Pembanding berhasil disimpan & semua skor diperbarui');
  }
};

window.resetPembanding = () => {
  if (!confirm('Reset ke nilai default?')) return;
  document.querySelectorAll('#adminDataPembanding input').forEach(inp => {
    const id = inp.id.replace('pemb_', '');
    const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === id);
    if (sub) inp.value = sub.pembanding;
  });
};