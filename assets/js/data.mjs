import { supabase } from './auth.mjs';
import { showToast } from './utils.mjs';

const BATAS_LAYAK = 400;

export let dataPembanding = {};
export let allKecamatanData = {};

// Load semua data pembanding (default dari kode + override dari DB)
export async function loadDataPembanding() {
  const defaultPembanding = {
    '1.1': 55, '1.2': 50, '2.1': 4000, '2.2': 40, '3.1': 72, '3.2': 200,
    '4.1': 8.61, '4.2': 82.43, '4.3': 109.52, '5.1': 1117, '6.1': 5.2,
    '7.1': 2, '8.1': 70, '9.1': 1, '10.1': 40, '11.1': 5.43, '11.2': 45000000,
    '11.3': 74.24, '11.4': 7.83, '12.1': 1, '12.2': 1, '12.3': 1, '12.4': 1,
    '12.5': 1, '12.6': 1, '13.1': 4780000000000, '14.1': 538000000000,
    '15.1': 5, '16.1': 28, '16.2': 32, '16.3': 36, '17.1': 2500,
    '17.2': 1000, '18.1': 2850, '19.1': 2680000, '19.2': 12500, '20.1': 3
  };

  try {
    const { data } = await supabase.from('data_pembanding').select('*');
    data.forEach(row => {
      dataPembanding[row.subindikator_kode] = row.nilai_max;
    });
  } catch (e) {
    console.warn('Gagal load data pembanding dari DB, pakai default');
  }

  // Pastikan semua kunci ada
  Object.keys(defaultPembanding).forEach(k => {
    if (!(k in dataPembanding)) dataPembanding[k] = defaultPembanding[k];
  });
}

export async function loadAllKecamatanData() {
  const { data, error } = await supabase
    .from('penilaian')
    .select('kecamatan_id, data, total_nilai, updated_at')
    .neq('status', 'draft'); // optional

  allKecamatanData = {};
  data?.forEach(row => {
    allKecamatanData[row.kecamatan_id] = {
      data: row.data,
      total_nilai: row.total_nilai || 0,
      updated_at: row.updated_at
    };
  });
}

export async function saveKecamatanData(kecamatanId, formData, totalNilai) {
  const payload = {
    kecamatan_id: kecamatanId,
    data: formData,
    total_nilai: totalNilai,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('penilaian')
    .upsert(payload, { onConflict: 'kecamatan_id' });

  if (error) throw error;
  allKecamatanData[kecamatanId] = { ...payload };
  showToast('Data berhasil disimpan!');
}