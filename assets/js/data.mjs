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
      .select('kecamatan_id, desa_id, data, total_nilai, updated_at');

    if (error) {
      console.error('Database error loading penilaian:', error);
      throw new Error('Gagal mengakses database penilaian');
    }

    allKecamatanData = {};

    // Handle case when data is null or empty
    if (!data || data.length === 0) {
      console.warn('No penilaian data found in database');
      return;
    }

    data.forEach(row => {
      // Validate row data before processing
      if (!row.kecamatan_id) {
        console.warn('Skipping penilaian row with missing kecamatan_id:', row);
        return;
      }
      
      // Use different keys for kecamatan and desa data
      const dataKey = row.desa_id ? `desa_${row.desa_id}` : row.kecamatan_id;
      
      allKecamatanData[dataKey] = {
        data: row.data || {},
        total_nilai: row.total_nilai || 0,
        updated_at: row.updated_at
      };
    });

    console.log(`Loaded penilaian data for ${Object.keys(allKecamatanData).length} entries`);
  } catch (err) {
    console.error('Error loading penilaian:', err);
    showToast('Gagal memuat data penilaian', true);
    allKecamatanData = {};
    // Re-throw error so calling functions can handle it appropriately
    throw err;
  }
}

// Simpan data kecamatan (dipakai form.mjs & admin.mjs)
export async function saveKecamatanData(dataKey, formData, totalNilai) {
  // Validate inputs
  if (!dataKey) {
    const error = new Error('Data key tidak valid');
    console.error('Save error:', error);
    showToast(error.message, true);
    throw error;
  }

  if (!formData || typeof formData !== 'object') {
    const error = new Error('Data form tidak valid');
    console.error('Save error:', error);
    showToast(error.message, true);
    throw error;
  }

  // Extract kecamatan_id and desa_id from dataKey
  let kecamatanId, desaId;
  if (typeof dataKey === 'string' && dataKey.startsWith('desa_')) {
    // This is desa data
    desaId = dataKey.replace('desa_', '');
    // For desa data, we need to get the kecamatan_id from the desa record
    try {
      const { data: desaData } = await supabase
        .from('desa')
        .select('kecamatan_id')
        .eq('id', desaId)
        .single();
      
      if (desaData) {
        kecamatanId = desaData.kecamatan_id;
      } else {
        throw new Error(`Desa dengan ID ${desaId} tidak ditemukan`);
      }
    } catch (error) {
      console.error('Error getting kecamatan_id for desa:', error);
      throw new Error('Gagal mendapatkan data kecamatan untuk desa');
    }
  } else {
    // This is kecamatan data
    kecamatanId = dataKey;
    desaId = null;
  }

  const payload = {
    kecamatan_id: kecamatanId,
    desa_id: desaId,
    data: formData,
    total_nilai: totalNilai || 0,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('penilaian')
      .upsert(payload, { onConflict: desaId ? 'desa_id,status' : 'kecamatan_id,status' });

    if (error) {
      console.error('Database error saving data:', error);
      throw new Error('Gagal menyimpan data ke database');
    }

    // Update memori langsung
    allKecamatanData[dataKey] = {
      data: formData,
      total_nilai: totalNilai || 0,
      updated_at: payload.updated_at
    };

    showToast('Data berhasil disimpan!');
  } catch (err) {
    console.error('Error saving data:', err);
    const errorMessage = err.message || 'Gagal menyimpan data';
    showToast(errorMessage, true);
    throw err;
  }
}

// Hitung ulang semua skor setelah admin ubah pembanding
export async function recalculateAllScores() {
  const entries = Object.entries(allKecamatanData);
  if (entries.length === 0) return;

  const updates = [];

  for (const [dataKey, record] of entries) {
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

    // Extract kecamatan_id and desa_id from dataKey
    let kecamatanId, desaId;
    if (typeof dataKey === 'string' && dataKey.startsWith('desa_')) {
      desaId = dataKey.replace('desa_', '');
      // Get kecamatan_id from desa data
      try {
        const { data: desaData } = await supabase
          .from('desa')
          .select('kecamatan_id')
          .eq('id', desaId)
          .single();
        
        if (desaData) {
          kecamatanId = desaData.kecamatan_id;
        }
      } catch (error) {
        console.error('Error getting kecamatan_id for recalculation:', error);
      }
    } else {
      kecamatanId = dataKey;
    }

    updates.push({
      kecamatan_id: Number(kecamatanId),
      desa_id: desaId ? Number(desaId) : null,
      total_nilai: Math.round(total)
    });
  }

  try {
    const { error } = await supabase
      .from('penilaian')
      .upsert(updates, { onConflict: 'kecamatan_id,status' });

    if (error) throw error;

    await loadAllKecamatanData();
    showToast('Semua skor berhasil diperbarui!');
  } catch (err) {
    showToast('Gagal recalculate skor', true);
    console.error(err);
  }
}