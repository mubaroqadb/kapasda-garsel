// assets/js/dashboard.mjs

import { supabase } from './auth.mjs';
import { allKecamatanData, loadAllKecamatanData } from './data.mjs';
import { showToast } from './utils.mjs';
import { BATAS_LAYAK } from './indikator.mjs';

let chartKecamatan = null;
let chartKelayakan = null;

export async function loadDashboard() {
  await loadAllKecamatanData();

  const container = document.getElementById('dashboard');
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-md p-5 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total Kecamatan</p>
            <p id="statTotalKec" class="text-3xl font-bold text-blue-600">15</p>
          </div>
          <div class="bg-blue-100 p-3 rounded-full">
            <i class="fas fa-map-marker-alt text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-5 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Sudah Input</p>
            <p id="statSudahInput" class="text-3xl font-bold text-green-600">0</p>
          </div>
          <div class="bg-green-100 p-3 rounded-full">
            <i class="fas fa-check-circle text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-5 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">LAYAK</p>
            <p id="statLayak" class="text-3xl font-bold text-emerald-600">0</p>
          </div>
          <div class="bg-emerald-100 p-3 rounded-full">
            <i class="fas fa-thumbs-up text-emerald-600 text-xl"></i>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-5 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">TIDAK LAYAK</p>
            <p id="statTidakLayak" class="text-3xl font-bold text-red-600">0</p>
          </div>
          <div class="bg-red-100 p-3 rounded-full">
            <i class="fas fa-thumbs-down text-red-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-md p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Perbandingan Nilai per Kecamatan</h3>
        <canvas id="chartKecamatan"></canvas>
      </div>
      <div class="bg-white rounded-xl shadow-md p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Status Kelayakan</h3>
        <canvas id="chartKelayakan"></canvas>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md p-5">
      <h3 class="font-semibold text-gray-700 mb-4">Status per Kecamatan</h3>
      <div id="kecamatanCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"></div>
    </div>`;

  updateStats();
  renderChartKecamatan();
  renderChartKelayakan();
  renderKecamatanCards();
}

function updateStats() {
  const totalKec = 15;
  const sudahInput = Object.keys(allKecamatanData).length;
  const layak = Object.values(allKecamatanData).filter(d => (d.total_nilai || 0) >= BATAS_LAYAK).length;
  const tidakLayak = sudahInput - layak;

  document.getElementById('statTotalKec').textContent = totalKec;
  document.getElementById('statSudahInput').textContent = sudahInput;
  document.getElementById('statLayak').textContent = layak;
  document.getElementById('statTidakLayak').textContent = tidakLayak;
}

async function renderChartKecamatan() {
  const { data: kecList } = await supabase.from('kecamatan').select('id,nama').order('nama');

  const labels = [];
  const values = [];

  kecList.forEach(kec => {
    labels.push(kec.nama);
    const data = allKecamatanData[kec.id];
    values.push(data?.total_nilai || 0);
  });

  if (chartKecamatan) chartKecamatan.destroy();

  chartKecamatan = new Chart(document.getElementById('chartKecamatan'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Nilai',
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true, max: 600, ticks: { stepSize: 100 } }
      }
    }
  });
}

function renderChartKelayakan() {
  const layak = Object.values(allKecamatanData).filter(d => (d.total_nilai || 0) >= BATAS_LAYAK).length;
  const tidakLayak = Object.keys(allKecamatanData).length - layak;

  if (chartKelayakan) chartKelayakan.destroy();

  chartKelayakan = new Chart(document.getElementById('chartKelayakan'), {
    type: 'doughnut',
    data: {
      labels: ['LAYAK', 'TIDAK LAYAK'],
      datasets: [{
        data: [layak, tidakLayak],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { mode: 'index' }
      }
    }
  });
}

async function renderKecamatanCards() {
  const { data: kecList } = await supabase.from('kecamatan').select('id,nama').order('nama');
  const container = document.getElementById('kecamatanCards');
  container.innerHTML = '';

  for (const kec of kecList) {
    const data = allKecamatanData[kec.id];
    const skor = data?.total_nilai || 0;
    const status = skor >= BATAS_LAYAK ? 'LAYAK' : 'TIDAK LAYAK';
    const bgClass = skor >= BATAS_LAYAK ? 'bg-emerald-100 border-emerald-500' : 'bg-red-100 border-red-500';

    const card = document.createElement('div');
    card.className = `bg-white rounded-lg shadow-md p-5 text-center border-l-4 ${bgClass} card-hover`;
    card.innerHTML = `
      <h4 class="font-bold text-lg text-gray-800">${kec.nama}</h4>
      <p class="text-3xl font-bold mt-3 ${skor >= BATAS_LAYAK ? 'text-emerald-600' : 'text-red-600'}">${skor}</p>
      <p class="text-sm font-medium mt-2 ${skor >= BATAS_LAYAK ? 'text-emerald-700' : 'text-red-700'}">${status}</p>
      <p class="text-xs text-gray-500 mt-2">
        ${data?.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : 'Belum diisi'}
      </p>
    `;
    container.appendChild(card);
  }
}