// assets/js/data.mjs

import { supabase } from './auth.mjs';
import { showToast } from './utils.mjs';
import { INDIKATORS } from './indikator.mjs';

export let dataPembanding = {};
export let allKecamatanData = {};

// Default pembanding — 100% persis dari kode awal Anda
const defaultPembanding = {
  '1.1': 55, '1.2': 50,
  '2.1': 4000, '2.2': 40,
  '3.1': 72, '3.2': 200,
  '4.1': 8.61, '4.2': 82.43, '4.3': 109.52,
  '5.1': 1117,
  '6.1': 5.2,
  '7.1': 2,
  '8.1': 70,
  '9.1': 1,
  '10.1': 40,
  '11.1': 5.43, '11.2': 45000000, '11.3': 74.24, '11.4': 7.83,
  '12.1': 1, '12.2': 1, '12.3': 1, '12.4': 1, '12.5': 1, '12.6': 1,
  '13.1': 4780000000000,
  '14.1': 538000000000,
  '15.1': 5,
  '16.1': 28, '16.2': 32, '16.3': 36,
  '17.1': 2500, '17.2': 1000,
  '18.1': 2850,
  '19.1': 2680000, '19.2': 12500,
  '20.1': 3
};

// Load data pembanding dari Supabase + fallback ke default
export async function loadDataPembanding() {
  try {
    const { data, error } = await supabase
      .from('data_pembanding')
      .select('subindikator_kode, nilai_max');

    if (error && error.code !== 'PGRST116') throw error;

    dataPembanding = {};

    if (data && data.length > 0) {
      data.forEach(row => {
        dataPembanding[row.subindikator_kode] = row.nilai_max;
      });
    }

    // Pastikan semua kunci ada
    Object.keys(defaultPembanding).forEach(key => {
      if (!(key in dataPembanding)) {
        dataPembanding[key] = defaultPembanding[key];
      }
    });

  } catch (err) {
    console.warn('Gagal load data_pembanding, pakai default', err);
    dataPembanding = { ...defaultPembanding };
  }
}

// Load semua data penilaian kecamatan dari Supabase
export async function loadAllKecamatanData() {
  try {
    const { data, error } = await supabase
      .from('penilaian')
      .select('kecamatan_id, data, total_nilai, updated_at');

    if (error) throw error;

    allKecamatanData = {};

    data?.forEach(row => {
      allKecamatanData[row.kecamatan_id] = {
        data: row.data || {},
        total_nilai: row.total_nilai || 0,
        updated_at: row.updated_at
      };
    });

  } catch (err) {
    console.error('Error loading penilaian:', err);
    showToast('Gagal memuat data penilaian', true);
    allKecamatanData = {};
  }
}

// Simpan data kecamatan (dipakai form.mjs & admin.mjs)
export async function saveKecamatanData(kecamatanId, formData, totalNilai) {
  const payload = {
    kecamatan_id: kecamatanId,
    data: formData,
    total_nilai: totalNilai,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('penilaian')
      .upsert(payload, { onConflict: 'kecamatan_id' });

    if (error) throw error;

    // Update memori langsung
    allKecamatanData[kecamatanId] = {
      data: formData,
      total_nilai: totalNilai,
      updated_at: payload.updated_at
    };

    showToast('Data berhasil disimpan!');
  } catch (err) {
    console.error('Error saving kecamatan data:', err);
    showToast('Gagal menyimpan data: ' + err.message, true);
    throw err;
  }
}

// Hitung ulang semua skor setelah admin ubah pembanding
export async function recalculateAllScores() {
  const entries = Object.entries(allKecamatanData);
  if (entries.length === 0) return;

  const updates = [];

  for (const [kecId, record] of entries) {
    let total = 0;
    const saved = record.data || {};

    INDIKATORS.forEach(group => {
      group.subs.forEach(sub => {
        const val = saved[sub.id];
        if (val !== null && val !== undefined && val !== '') {
          const ratio = sub.type === 'ratio' ? val / dataPembanding[sub.id] : val;
          const skor = sub.skor(ratio ?? val);
          total += skor * sub.bobot;
        }
      });
    });

    updates.push({
      kecamatan_id: Number(kecId),
      total_nilai: Math.round(total)
    });
  }

  try {
    const { error } = await supabase
      .from('penilaian')
      .upsert(updates, { onConflict: 'kecamatan_id' });

    if (error) throw error;

    await loadAllKecamatanData();
    showToast('Semua skor berhasil diperbarui!');
  } catch (err) {
    showToast('Gagal recalculate skor', true);
    console.error(err);
  }
}