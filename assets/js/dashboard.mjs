// Modern dashboard module for KAPASDA

import { supabase } from './auth.mjs';
import { allKecamatanData, loadAllKecamatanData } from './data.mjs';
import { showToast, showLoading, hideLoading, handleApiError, formatNumber, formatDate, createSkeleton, debounce } from './utils.mjs';
import { BATAS_LAYAK } from './indikator.mjs';

// Chart instances with modern configuration
let chartKecamatan = null;
let chartKelayakan = null;
let isUpdating = false;

// Dashboard state
const dashboardState = {
  data: {},
  filters: {
    search: '',
    status: 'all'
  },
  sort: {
    field: 'total_nilai',
    direction: 'desc'
  }
};

/**
 * Modern dashboard loading with skeleton screens
 */
export async function loadDashboard() {
  const container = document.getElementById('dashboard');
  
  // Show skeleton while loading
  container.innerHTML = createDashboardSkeleton();
  
  try {
    console.log('📊 Loading dashboard data...');
    await loadAllKecamatanData();
    
    // Render dashboard with modern UI
    renderModernDashboard();
    console.log('✅ Dashboard loaded successfully');
    
  } catch (error) {
    console.error('❌ Dashboard loading failed:', error);
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Dashboard</p>
        <p class="text-gray-600 mb-4">${handleApiError(error)}</p>
        <button onclick="location.reload()" class="btn-primary">
          <i class="fas fa-sync mr-2"></i>Muat Ulang
        </button>
      </div>
    `;
  }
}

/**
 * Create dashboard skeleton loading screen
 */
function createDashboardSkeleton() {
  return `
    <div class="space-y-6">
      <!-- Stats Cards Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${Array(4).fill().map(() => `
          <div class="stat-card">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
        `).join('')}
      </div>
      
      <!-- Charts Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${Array(2).fill().map(() => `
          <div class="chart-container">
            <div class="skeleton skeleton-title"></div>
            <div class="h-64 skeleton"></div>
          </div>
        `).join('')}
      </div>
      
      <!-- Kecamatan Cards Skeleton -->
      <div class="bg-white rounded-xl shadow-md p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Status per Kecamatan</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          ${Array(15).fill().map(() => `
            <div class="bg-gray-50 rounded-lg p-5">
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-title mt-3"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render modern dashboard with enhanced UI
 */
function renderModernDashboard() {
  const container = document.getElementById('dashboard');
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Enhanced Stats Cards -->
      ${createStatsCards()}
      
      <!-- Search and Filters -->
      ${createFilters()}
      
      <!-- Enhanced Charts -->
      ${createCharts()}
      
      <!-- Enhanced Kecamatan Cards -->
      ${createKecamatanGrid()}
    </div>
  `;
  
  // Initialize components
  initializeStats();
  initializeCharts();
  initializeFilters();
  renderKecamatanCards();
}

/**
 * Create modern stats cards
 */
function createStatsCards() {
  const stats = calculateStats();
  
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat-card primary">
        <div class="flex items-center justify-between">
          <div>
            <p class="stat-label">Total Kecamatan</p>
            <p class="stat-value text-blue-600">${stats.total}</p>
          </div>
          <div class="bg-blue-100 p-3 rounded-full">
            <i class="fas fa-map-marker-alt text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card success">
        <div class="flex items-center justify-between">
          <div>
            <p class="stat-label">Sudah Input</p>
            <p class="stat-value text-green-600">${stats.sudahInput}</p>
          </div>
          <div class="bg-green-100 p-3 rounded-full">
            <i class="fas fa-check-circle text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card success">
        <div class="flex items-center justify-between">
          <div>
            <p class="stat-label">LAYAK</p>
            <p class="stat-value text-emerald-600">${stats.layak}</p>
          </div>
          <div class="bg-emerald-100 p-3 rounded-full">
            <i class="fas fa-thumbs-up text-emerald-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card danger">
        <div class="flex items-center justify-between">
          <div>
            <p class="stat-label">TIDAK LAYAK</p>
            <p class="stat-value text-red-600">${stats.tidakLayak}</p>
          </div>
          <div class="bg-red-100 p-3 rounded-full">
            <i class="fas fa-thumbs-down text-red-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create modern filters section
 */
function createFilters() {
  return `
    <div class="bg-white rounded-xl shadow-md p-5">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 class="font-semibold text-gray-700">
          <i class="fas fa-filter mr-2"></i>Filter Data
        </h3>
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div class="search-box flex-1">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              id="searchKecamatan"
              placeholder="Cari kecamatan..."
              class="search-input"
            >
          </div>
          <select id="filterStatus" class="input-field">
            <option value="all">Semua Status</option>
            <option value="layak">LAYAK</option>
            <option value="tidak_layak">TIDAK LAYAK</option>
            <option value="belum_input">Belum Input</option>
          </select>
          <button id="refreshBtn" class="btn-secondary">
            <i class="fas fa-sync mr-2"></i>Refresh
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create modern charts section
 */
function createCharts() {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="chart-container">
        <h3 class="chart-title">
          <i class="fas fa-chart-bar mr-2"></i>
          Perbandingan Nilai per Kecamatan
        </h3>
        <div class="relative h-80">
          <canvas id="chartKecamatan"></canvas>
        </div>
      </div>
      
      <div class="chart-container">
        <h3 class="chart-title">
          <i class="fas fa-chart-pie mr-2"></i>
          Status Kelayakan
        </h3>
        <div class="relative h-80">
          <canvas id="chartKelayakan"></canvas>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create modern kecamatan grid
 */
function createKecamatanGrid() {
  return `
    <div class="bg-white rounded-xl shadow-md p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold text-gray-700">
          <i class="fas fa-map mr-2"></i>
          Status per Kecamatan
        </h3>
        <div class="text-sm text-gray-500">
          <span id="kecamatanCount">0</span> kecamatan
        </div>
      </div>
      <div id="kecamatanCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <!-- Cards will be rendered here -->
      </div>
    </div>
  `;
}

/**
 * Calculate dashboard statistics
 */
function calculateStats() {
  const totalKec = 15;
  const sudahInput = Object.keys(allKecamatanData).length;
  const layak = Object.values(allKecamatanData).filter(d => (d.total_nilai || 0) >= BATAS_LAYAK).length;
  const tidakLayak = sudahInput - layak;

  return {
    total: totalKec,
    sudahInput,
    layak,
    tidakLayak,
    persentaseInput: totalKec > 0 ? (sudahInput / totalKec * 100).toFixed(1) : 0,
    persentaseLayak: sudahInput > 0 ? (layak / sudahInput * 100).toFixed(1) : 0
  };
}

/**
 * Initialize stats with animations
 */
function initializeStats() {
  const stats = calculateStats();
  
  // Animate numbers
  animateValue('statTotalKec', 0, stats.total, 1000);
  animateValue('statSudahInput', 0, stats.sudahInput, 1000);
  animateValue('statLayak', 0, stats.layak, 1000);
  animateValue('statTidakLayak', 0, stats.tidakLayak, 1000);
}

/**
 * Animate number counting
 */
function animateValue(elementId, start, end, duration) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const startTime = performance.now();
  const updateValue = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(start + (end - start) * progress);
    
    element.textContent = formatNumber(current);
    
    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  };
  
  requestAnimationFrame(updateValue);
}

/**
 * Initialize modern charts
 */
async function initializeCharts() {
  try {
    await renderChartKecamatan();
    await renderChartKelayakan();
  } catch (error) {
    console.error('Chart initialization failed:', error);
    showToast('Gagal memuat grafik', true, 'error');
  }
}

/**
 * Initialize filters with event listeners
 */
function initializeFilters() {
  const searchInput = document.getElementById('searchKecamatan');
  const statusFilter = document.getElementById('filterStatus');
  const refreshBtn = document.getElementById('refreshBtn');
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', handleFilterChange);
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }
}

/**
 * Handle search with debouncing
 */
function handleSearch(event) {
  dashboardState.filters.search = event.target.value.toLowerCase();
  renderKecamatanCards();
}

/**
 * Handle filter change
 */
function handleFilterChange(event) {
  dashboardState.filters.status = event.target.value;
  renderKecamatanCards();
}

/**
 * Handle refresh with loading state
 */
async function handleRefresh() {
  const refreshBtn = document.getElementById('refreshBtn');
  const originalContent = refreshBtn.innerHTML;
  
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memuat...';
  
  try {
    showLoading('Memuat ulang data...');
    await loadAllKecamatanData();
    renderKecamatanCards();
    hideLoading();
    showToast('Data berhasil diperbarui', false, 'success');
  } catch (error) {
    hideLoading();
    showToast(handleApiError(error), true, 'error');
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = originalContent;
  }
}

/**
 * Render modern kecamatan chart
 */
async function renderChartKecamatan() {
  try {
    const { data: kecList, error } = await supabase
      .from('kecamatan')
      .select('id,nama')
      .order('nama');
    
    if (error) throw error;
    if (!kecList || kecList.length === 0) {
      console.warn('No kecamatan data found');
      return;
    }

    const labels = [];
    const values = [];

    kecList.forEach(kec => {
      labels.push(kec.nama);
      const data = allKecamatanData[kec.id];
      values.push(data?.total_nilai || 0);
    });

    if (chartKecamatan) chartKecamatan.destroy();

    const ctx = document.getElementById('chartKecamatan');
    if (!ctx) return;

    chartKecamatan = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Nilai',
          data: values,
          backgroundColor: values.map(value => 
            value >= BATAS_LAYAK ? 'rgba(16, 185, 129, 0.8)' : 'rgba(59, 130, 246, 0.8)'
          ),
          borderColor: values.map(value => 
            value >= BATAS_LAYAK ? '#10b981' : '#2563eb'
          ),
          borderWidth: 2,
          borderRadius: 8,
          maxBarThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { 
            mode: 'index', 
            intersect: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 600, 
            ticks: { 
              stepSize: 100,
              callback: function(value) {
                return formatNumber(value);
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });
  } catch (error) {
    console.error('Error rendering kecamatan chart:', error);
    throw error;
  }
}

/**
 * Render modern kelayakan chart
 */
function renderChartKelayakan() {
  const layak = Object.values(allKecamatanData).filter(d => (d.total_nilai || 0) >= BATAS_LAYAK).length;
  const tidakLayak = Object.keys(allKecamatanData).length - layak;

  if (chartKelayakan) chartKelayakan.destroy();

  const ctx = document.getElementById('chartKelayakan');
  if (!ctx) return;

  chartKelayakan = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['LAYAK', 'TIDAK LAYAK'],
      datasets: [{
        data: [layak, tidakLayak],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 15,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000
      }
    }
  });
}

/**
 * Render kecamatan cards with filtering
 */
async function renderKecamatanCards() {
  try {
    const { data: kecList, error } = await supabase
      .from('kecamatan')
      .select('id,nama')
      .order('nama');
    
    if (error) throw error;
    if (!kecList || kecList.length === 0) {
      renderEmptyState();
      return;
    }

    // Apply filters
    const filteredKec = kecList.filter(kec => {
      const data = allKecamatanData[kec.id];
      const skor = data?.total_nilai || 0;
      const status = skor >= BATAS_LAYAK ? 'layak' : 'tidak_layak';
      
      // Search filter
      const matchesSearch = !dashboardState.filters.search || 
        kec.nama.toLowerCase().includes(dashboardState.filters.search);
      
      // Status filter
      const matchesStatus = dashboardState.filters.status === 'all' || 
        (dashboardState.filters.status === 'belum_input' && !data) ||
        status === dashboardState.filters.status;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filteredKec.sort((a, b) => {
      const dataA = allKecamatanData[a.id];
      const dataB = allKecamatanData[b.id];
      const skorA = dataA?.total_nilai || 0;
      const skorB = dataB?.total_nilai || 0;
      
      return dashboardState.sort.direction === 'desc' ? 
        skorB - skorA : skorA - skorB;
    });

    renderKecamatanCardsList(filteredKec);
    
    // Update count
    const countElement = document.getElementById('kecamatanCount');
    if (countElement) {
      countElement.textContent = filteredKec.length;
    }
    
  } catch (error) {
    console.error('Error rendering kecamatan cards:', error);
    showToast(handleApiError(error), true, 'error');
  }
}

/**
 * Render kecamatan cards list
 */
function renderKecamatanCardsList(kecList) {
  const container = document.getElementById('kecamatanCards');
  if (!container) return;
  
  if (kecList.length === 0) {
    renderEmptyState();
    return;
  }

  container.innerHTML = kecList.map(kec => {
    const data = allKecamatanData[kec.id];
    const skor = data?.total_nilai || 0;
    const status = skor >= BATAS_LAYAK ? 'LAYAK' : 'TIDAK LAYAK';
    const isLayak = skor >= BATAS_LAYAK;
    const hasData = !!data;
    
    return `
      <div class="data-card ${isLayak ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}" 
           onclick="openKecamatanDetail('${kec.nama}')">
        <div class="flex justify-between items-start mb-3">
          <h4 class="font-semibold text-gray-800">${kec.nama}</h4>
          <span class="px-3 py-1 rounded-full text-xs font-medium ${
            isLayak ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }">
            ${hasData ? status : 'Belum Input'}
          </span>
        </div>
        
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Total Nilai</span>
            <span class="text-2xl font-bold ${isLayak ? 'text-green-600' : 'text-red-600'}">
              ${formatNumber(skor)}
            </span>
          </div>
          
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="h-3 rounded-full transition-all duration-500 ${
              isLayak ? 'bg-green-500' : 'bg-red-500'
            }" style="width: ${Math.min((skor / 500) * 100, 100)}%"></div>
          </div>
          
          ${hasData ? `
            <div class="text-xs text-gray-500">
              <i class="far fa-clock mr-1"></i>
              ${formatDate(data.updated_at, { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          ` : `
            <div class="text-xs text-gray-400 italic">
              <i class="fas fa-info-circle mr-1"></i>
              Belum ada data
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render empty state
 */
function renderEmptyState() {
  const container = document.getElementById('kecamatanCards');
  if (!container) return;
  
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
      <p class="text-xl text-gray-600 mb-2">Tidak ada data yang ditemukan</p>
      <p class="text-gray-500">Coba ubah filter atau kata kunci pencarian</p>
    </div>
  `;
}

/**
 * Open kecamatan detail modal
 */
function openKecamatanDetail(kecamatanName) {
  // This would open a modal with detailed information
  // Implementation depends on requirements
  showToast(`Melihat detail ${kecamatanName}`, false, 'info');
}

// Export functions for other modules
export { 
  dashboardState,
  renderKecamatanCards,
  handleRefresh
};