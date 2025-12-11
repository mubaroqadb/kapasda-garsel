import { allKecamatanData, loadAllKecamatanData, dataPembanding } from './data.mjs';
import { userRole, supabase } from './auth.mjs';
import { formatDate } from './utils.mjs';
import { BATAS_LAYAK } from './indikator.mjs';

let chartRanking = null;
let chartPie = null;

export async function loadDashboard() {
  await loadAllKecamatanData();
  const container = document.getElementById('dashboard');
  container.innerHTML = `
    <h2 class="text-3xl font-bold text-center text-gray-800 mb-10">Dashboard Penilaian Kecamatan</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10" id="statsCards"></div>
    <div class="grid lg:grid-cols-2 gap-8 mb-10">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h3 class="text-xl font-bold text-gray-800 mb-6">Ranking Skor Kecamatan</h3>
        <canvas id="chartRanking"></canvas>
      </div>
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h3 class="text-xl font-bold text-gray-800 mb-6">Distribusi Status</h3>
        <canvas id="chartPie"></canvas>
      </div>
    </div>
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <h3 class="text-xl font-bold text-gray-800 mb-6">Status Per Kecamatan</h3>
      <div id="kecamatanCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
    </div>
  `;

  renderStats();
  renderRankingChart();
  renderPieChart();
  renderKecamatanCards();
}

function renderStats() {
  const totalKec = Object.keys(allKecamatanData).length;
  const layak = Object.values(allKecamatanData).filter(k => k.total_nilai >= BATAS_LAYAK).length;

  const cards = [
    { label: 'Total Kecamatan', value: 15, icon: 'fa-map-marked-alt', color: 'blue' },
    { label: 'Sudah Diisi', value: totalKec, icon: 'fa-check-circle', color: 'green' },
    { label: 'LAYAK', value: layak, icon: 'fa-thumbs-up', color: 'emerald' },
    { label: 'BELUM LAYAK', value: totalKec - layak, icon: 'fa-exclamation-triangle', color: 'red' }
  ];

  document.getElementById('statsCards').innerHTML = cards.map(c => `
    <div class="bg-white rounded-2xl shadow-xl p-6 card-hover">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-gray-500 text-sm">${c.label}</p>
          <p class="text-4xl font-bold text-${c.color}-600 mt-2">${c.value}</p>
        </div>
        <i class="fas ${c.icon} text-4xl text-${c.color}-200"></i>
      </div>
    </div>
  `).join('');
}

function renderRankingChart() {
  const sorted = Object.entries(allKecamatanData)
    .map(([id, val]) => ({ id: parseInt(id), ...val }))
    .sort((a, b) => b.total_nilai - a.total_nilai);

  const labels = sorted.map(async item => {
    const { data } = await supabase.from('kecamatan').select('nama').eq('id', item.id).single();
    return data.nama;
  });

  // Karena async, kita pakai Promise.all
  Promise.all(labels).then(names => {
    if (chartRanking) chartRanking.destroy();
    chartRanking = new Chart(document.getElementById('chartRanking'), {
      type: 'bar',
      data: {
        labels: names,
        datasets: [{
          label: 'Skor Total',
          data: sorted.map(i => i.total_nilai),
          backgroundColor: sorted.map((_, i) => i === 0 ? '#10b981' : 'rgba(59, 130, 246, 0.7)'),
          borderRadius: 8,
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  });
}

function renderPieChart() {
  const layak = Object.values(allKecamatanData).filter(k => k.total_nilai >= BATAS_LAYAK).length;
  const tidak = Object.keys(allKecamatanData).length - layak;

  if (chartPie) chartPie.destroy();
  chartPie = new Chart(document.getElementById('chartPie'), {
    type: 'doughnut',
    data: {
      labels: ['Layak', 'Belum Layak'],
      datasets: [{
        data: [layak, tidak],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

async function renderKecamatanCards() {
  const container = document.getElementById('kecamatanCards');
  const { data: kecList } = await supabase.from('kecamatan').select('id, nama');

  container.innerHTML = kecList.map(kec => {
    const data = allKecamatanData[kec.id];
    const skor = data?.total_nilai || 0;
    const status = skor >= BATAS_LAYAK ? 'LAYAK' : 'BELUM LAYAK';
    const bg = skor >= BATAS_LAYAK ? 'bg-emerald-100 border-emerald-500' : 'bg-red-100 border-red-500';

    return `
      <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 ${bg} card-hover">
        <h4 class="font-bold text-lg text-gray-800">${kec.nama}</h4>
        <p class="text-3xl font-bold mt-3 ${skor >= BATAS_LAYAK ? 'text-emerald-600' : 'text-red-600'}">${skor}</p>
        <p class="text-sm text-gray-600 mt-2">${status}</p>
        <p class="text-xs text-gray-500 mt-3">Update: ${data ? formatDate(data.updated_at) : 'Belum diisi'}</p>
      </div>
    `;
  }).join('');
}