import { supabase } from './auth.mjs';

export let dataPembanding = {};
export let allKecamatanData = {};

export async function loadDataPembanding() {
  const defaults = {
    '1.1':55,'1.2':50,'2.1':4000,'2.2':40,'3.1':72,'3.2':200,
    '4.1':8.61,'4.2':82.43,'4.3':109.52,'5.1':1117,'6.1':5.2,'7.1':2,
    '8.1':70,'9.1':1,'10.1':40,'11.1':5.43,'11.2':45000000,'11.3':74.24,
    '11.4':7.83,'12.1':1,'12.2':1,'12.3':1,'12.4':1,'12.5':1,'12.6':1,
    '13.1':4780000000000,'14.1':538000000000,'15.1':5,'16.1':28,'16.2':32,
    '16.3':36,'17.1':2500,'17.2':1000,'18.1':2850,'19.1':2680000,'19.2':12500,'20.1':3
  };

  try {
    const { data } = await supabase.from('data_pembanding').select('*');
    dataPembanding = {};
    data.forEach(r => dataPembanding[r.subindikator_kode] = r.nilai_max);
  } catch (e) { console.warn('Pakai default pembanding'); }

  Object.keys(defaults).forEach(k => {
    if (!dataPembanding[k]) dataPembanding[k] = defaults[k];
  });
}

export async function loadAllKecamatanData() {
  const { data } = await supabase.from('penilaian').select('*');
  allKecamatanData = {};
  data?.forEach(row => {
    allKecamatanData[row.kecamatan_id] = row;
  });
}

export async function saveKecamatanData(kecId, formData, total) {
  const { error } = await supabase
    .from('penilaian')
    .upsert({ kecamatan_id: kecId, data: formData, total_nilai: total }, { onConflict: 'kecamatan_id' });
  if (error) throw error;
  await loadAllKecamatanData();
}