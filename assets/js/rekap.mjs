// Modern rekap module for KAPASDA with enhanced features

import { supabase } from './auth.mjs';
import { allKecamatanData, loadAllKecamatanData } from './data.mjs';
import { BATAS_LAYAK } from './indikator.mjs';
import { showToast, showLoading, hideLoading, handleApiError, formatNumber, formatDate, exportToCSV, debounce, createPagination } from './utils.mjs';

// Rekap state management
const rekapState = {
  data: [],
  filteredData: [],
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
  filters: {
    search: '',
    status: 'all',
    sortBy: 'total_nilai',
    sortDirection: 'desc'
  },
  isLoading: false
};

/**
 * Modern rekap setup with enhanced features
 */
export async function setupRekap() {
  const container = document.getElementById('rekap');
  
  // Show skeleton while loading
  container.innerHTML = createRekapSkeleton();
  
  try {
    console.log('📊 Loading rekap data...');
    await loadRekapData();
    renderModernRekap();
    initializeRekapEventListeners();
    console.log('✅ Rekap loaded successfully');
  } catch (error) {
    console.error('❌ Rekap loading failed:', error);
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Data Rekap</p>
        <p class="text-gray-600 mb-4">${handleApiError(error)}</p>
        <button onclick="location.reload()" class="btn-primary">
          <i class="fas fa-sync mr-2"></i>Muat Ulang
        </button>
      </div>
    `;
  }
}

/**
 * Create rekap skeleton loading
 */
function createRekapSkeleton() {
  return `
    <div class="space-y-6">
      <!-- Filters Skeleton -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="skeleton skeleton-title mb-4"></div>
        <div class="flex gap-3">
          <div class="skeleton skeleton-button"></div>
          <div class="skeleton skeleton-button"></div>
          <div class="skeleton skeleton-button"></div>
        </div>
      </div>
      
      <!-- Table Skeleton -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="skeleton skeleton-title mb-4"></div>
        <div class="overflow-x-auto">
          <table class="table-modern w-full">
            <thead class="bg-gray-50">
              <tr>
                ${Array(5).fill().map(() => `
                  <th class="skeleton skeleton-text"></th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${Array(5).fill().map(() => `
                <tr>
                  ${Array(5).fill().map(() => `
                    <td class="skeleton skeleton-text"></td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pagination Skeleton -->
      <div class="flex justify-center mt-6">
        <div class="skeleton skeleton-button"></div>
      </div>
    </div>
  `;
}

/**
 * Load rekap data with optimization
 */
async function loadRekapData() {
  try {
    showLoading('Memuat data rekap...');
    
    await loadAllKecamatanData();
    
    // Get kecamatan list
    const { data: kecamatanList, error } = await supabase
      .from('kecamatan')
      .select('id, nama')
      .order('nama');
    
    if (error) throw error;
    if (!kecamatanList || kecamatanList.length === 0) {
      console.warn('No kecamatan data found');
      rekapState.data = [];
      return;
    }
    
    // Transform data for table
    rekapState.data = kecamatanList.map(kec => {
      const data = allKecamatanData[kec.id];
      return {
        id: kec.id,
        nama: kec.nama,
        total_nilai: data?.total_nilai || 0,
        status: data?.total_nilai >= BATAS_LAYAK ? 'LAYAK' : 'TIDAK LAYAK',
        updated_at: data?.updated_at
      };
    });
    
    // Apply initial filters
    applyFilters();
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error loading rekap data:', error);
    showToast(handleApiError(error, 'Gagal memuat data rekap'), true, 'error');
    rekapState.data = [];
  }
}

/**
 * Render modern rekap interface
 */
function renderModernRekap() {
  const container = document.getElementById('rekap');
  if (!container) return;
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Enhanced Filters -->
      ${createRekapFilters()}
      
      <!-- Enhanced Table -->
      ${createRekapTable()}
      
      <!-- Enhanced Pagination -->
      ${createRekapPagination()}
      
      <!-- Export Options -->
      ${createExportOptions()}
    </div>
  `;
  
  // Initialize components
  initializeFilters();
  renderTable();
  renderPagination();
}

/**
 * Create enhanced filters section
 */
function createRekapFilters() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h3 class="font-semibold text-gray-700">
          <i class="fas fa-filter mr-2"></i>
          Filter Data
        </h3>
        
        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div class="search-box flex-1">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              id="searchRekap"
              placeholder="Cari nama kecamatan..."
              class="search-input"
            >
          </div>
          
          <select id="filterStatusRekap" class="input-field">
            <option value="all">Semua Status</option>
            <option value="layak">LAYAK</option>
            <option value="tidak_layak">TIDAK LAYAK</option>
          </select>
          
          <select id="sortByRekap" class="input-field">
            <option value="total_nilai">Total Nilai</option>
            <option value="nama">Nama Kecamatan</option>
            <option value="updated_at">Terakhir Update</option>
          </select>
          
          <button id="refreshRekap" class="btn-secondary">
            <i class="fas fa-sync mr-2"></i>
            Refresh
          </button>
        </div>
      </div>
      
      <!-- Filter Summary -->
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex justify-between items-center text-sm text-gray-600">
          <span>
            <i class="fas fa-chart-bar mr-1"></i>
            Menampilkan <span id="showingCount">0</span> dari <span id="totalCount">0</span> data
          </span>
          <span class="hidden sm:inline">
            <i class="fas fa-check-circle text-green-500 mr-1"></i>
            <span id="layakCount">0</span> LAYAK
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create enhanced table
 */
function createRekapTable() {
  return `
    <div class="bg-white rounded-xl shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table-modern w-full">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th class="cursor-pointer hover:bg-gray-100" onclick="sortTable('nama')">
                <div class="flex items-center gap-2">
                  <span>No</span>
                  <i class="fas fa-sort text-xs"></i>
                </div>
              </th>
              <th class="cursor-pointer hover:bg-gray-100" onclick="sortTable('nama')">
                <div class="flex items-center gap-2">
                  <span>Kecamatan</span>
                  <i class="fas fa-sort text-xs"></i>
                </div>
              </th>
              <th class="cursor-pointer hover:bg-gray-100" onclick="sortTable('total_nilai')">
                <div class="flex items-center gap-2">
                  <span>Total Nilai</span>
                  <i class="fas fa-sort text-xs"></i>
                </div>
              </th>
              <th class="cursor-pointer hover:bg-gray-100" onclick="sortTable('status')">
                <div class="flex items-center gap-2">
                  <span>Status</span>
                  <i class="fas fa-sort text-xs"></i>
                </div>
              </th>
              <th class="cursor-pointer hover:bg-gray-100" onclick="sortTable('updated_at')">
                <div class="flex items-center gap-2">
                  <span>Terakhir Update</span>
                  <i class="fas fa-sort text-xs"></i>
                </div>
              </th>
            </tr>
          </thead>
          <tbody id="rekapTableBody">
            <!-- Table rows will be rendered here -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Create pagination
 */
function createRekapPagination() {
  return `
    <div class="flex justify-between items-center mt-6">
      <div class="pagination-info text-sm text-gray-600">
        Menampilkan <span id="paginationStart">0</span> - <span id="paginationEnd">0</span> 
        dari <span id="paginationTotal">0</span> data
      </div>
      
      <div class="pagination-controls" id="paginationControls">
        <!-- Pagination buttons will be rendered here -->
      </div>
    </div>
  `;
}

/**
 * Create export options
 */
function createExportOptions() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-semibold text-gray-700 mb-4">
        <i class="fas fa-download mr-2"></i>
        Ekspor Data
      </h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button onclick="exportToExcel()" class="btn-secondary w-full">
          <i class="fas fa-file-excel mr-2"></i>
          Export Excel
        </button>
        
        <button onclick="exportToPDF()" class="btn-secondary w-full">
          <i class="fas fa-file-pdf mr-2"></i>
          Export PDF
        </button>
        
        <button onclick="exportToCSV()" class="btn-secondary w-full">
          <i class="fas fa-file-csv mr-2"></i>
          Export CSV
        </button>
        
        <button onclick="printTable()" class="btn-secondary w-full">
          <i class="fas fa-print mr-2"></i>
          Cetak
        </button>
      </div>
    </div>
  `;
}

/**
 * Initialize filters with event listeners
 */
function initializeFilters() {
  const searchInput = document.getElementById('searchRekap');
  const statusFilter = document.getElementById('filterStatusRekap');
  const sortFilter = document.getElementById('sortByRekap');
  const refreshBtn = document.getElementById('refreshRekap');
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', handleFilterChange);
  }
  
  if (sortFilter) {
    sortFilter.addEventListener('change', handleSortChange);
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }
}

/**
 * Initialize event listeners
 */
function initializeRekapEventListeners() {
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      printTable();
    }
  });
}

/**
 * Handle search with debouncing
 */
function handleSearch(event) {
  rekapState.filters.search = event.target.value.toLowerCase();
  applyFilters();
}

/**
 * Handle filter change
 */
function handleFilterChange(event) {
  const { name, value } = event.target;
  
  if (name === 'filterStatusRekap') {
    rekapState.filters.status = value;
  }
  
  applyFilters();
}

/**
 * Handle sort change
 */
function handleSortChange(event) {
  rekapState.filters.sortBy = event.target.value;
  rekapState.filters.sortDirection = 'desc';
  applyFilters();
}

/**
 * Handle refresh
 */
async function handleRefresh() {
  const refreshBtn = document.getElementById('refreshRekap');
  const originalContent = refreshBtn.innerHTML;
  
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memuat...';
  
  try {
    await loadRekapData();
    applyFilters();
    showToast('Data berhasil diperbarui', false, 'success');
  } catch (error) {
    showToast(handleApiError(error), true, 'error');
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = originalContent;
  }
}

/**
 * Apply filters to data
 */
function applyFilters() {
  let filtered = [...rekapState.data];
  
  // Apply search filter
  if (rekapState.filters.search) {
    filtered = filtered.filter(item => 
      item.nama.toLowerCase().includes(rekapState.filters.search)
    );
  }
  
  // Apply status filter
  if (rekapState.filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === rekapState.filters.status);
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let aValue = a[rekapState.filters.sortBy];
    let bValue = b[rekapState.filters.sortBy];
    
    // Handle string comparison
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (rekapState.filters.sortDirection === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
  
  rekapState.filteredData = filtered;
  rekapState.currentPage = 1;
  rekapState.totalPages = Math.ceil(filtered.length / rekapState.itemsPerPage);
  
  renderTable();
  renderPagination();
  updateFilterSummary();
}

/**
 * Render table with pagination
 */
function renderTable() {
  const tbody = document.getElementById('rekapTableBody');
  if (!tbody) return;
  
  const startIndex = (rekapState.currentPage - 1) * rekapState.itemsPerPage;
  const endIndex = startIndex + rekapState.itemsPerPage;
  const pageData = rekapState.filteredData.slice(startIndex, endIndex);
  
  if (pageData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-search text-4xl mb-2"></i>
          <p class="text-lg">Tidak ada data yang sesuai dengan filter</p>
          <p class="text-sm">Coba ubah filter atau kata kunci pencarian</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = pageData.map((item, index) => {
    const isLayak = item.status === 'LAYAK';
    const statusClass = isLayak ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    
    return `
      <tr class="hover:bg-blue-50 transition-colors">
        <td class="px-6 py-4 text-left">${startIndex + index + 1}</td>
        <td class="px-6 py-4 text-left font-medium">${item.nama}</td>
        <td class="px-6 py-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <span class="font-bold ${isLayak ? 'text-green-600' : 'text-red-600'}">
              ${formatNumber(item.total_nilai)}
            </span>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="h-2 rounded-full transition-all duration-500 ${
                isLayak ? 'bg-green-500' : 'bg-red-500'
              }" style="width: ${Math.min((item.total_nilai / 500) * 100, 100)}%"></div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${statusClass}">
            ${item.status}
          </span>
        </td>
        <td class="px-6 py-4 text-center text-sm text-gray-500">
          ${formatDate(item.updated_at, { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Render pagination controls
 */
function renderPagination() {
  const container = document.getElementById('paginationControls');
  if (!container) return;
  
  container.innerHTML = createPagination(
    rekapState.currentPage,
    rekapState.totalPages,
    (page) => {
      rekapState.currentPage = page;
      renderTable();
      updatePaginationInfo();
    }
  );
  
  updatePaginationInfo();
}

/**
 * Update pagination info
 */
function updatePaginationInfo() {
  const startElement = document.getElementById('paginationStart');
  const endElement = document.getElementById('paginationEnd');
  const totalElement = document.getElementById('paginationTotal');
  
  if (startElement && endElement && totalElement) {
    const startIndex = (rekapState.currentPage - 1) * rekapState.itemsPerPage;
    const endIndex = Math.min(startIndex + rekapState.itemsPerPage, rekapState.filteredData.length);
    
    startElement.textContent = startIndex + 1;
    endElement.textContent = endIndex;
    totalElement.textContent = rekapState.filteredData.length;
  }
}

/**
 * Update filter summary
 */
function updateFilterSummary() {
  const showingCount = document.getElementById('showingCount');
  const totalCount = document.getElementById('totalCount');
  const layakCount = document.getElementById('layakCount');
  
  if (showingCount && totalCount && layakCount) {
    showingCount.textContent = rekapState.filteredData.length;
    totalCount.textContent = rekapState.data.length;
    
    const layakCountValue = rekapState.filteredData.filter(item => item.status === 'LAYAK').length;
    layakCount.textContent = layakCountValue;
  }
}

/**
 * Sort table
 */
function sortTable(field) {
  if (rekapState.filters.sortBy === field) {
    // Toggle sort direction
    rekapState.filters.sortDirection = rekapState.filters.sortDirection === 'desc' ? 'asc' : 'desc';
  } else {
    // Change sort field
    rekapState.filters.sortBy = field;
    rekapState.filters.sortDirection = 'desc';
  }
  
  applyFilters();
}

/**
 * Export to Excel with enhanced features
 */
async function exportToExcel() {
  if (rekapState.filteredData.length === 0) {
    showToast('Tidak ada data untuk diekspor', true, 'warning');
    return;
  }
  
  try {
    showLoading('Mengekspor data...');
    
    const exportData = rekapState.filteredData.map((item, index) => ({
      No: index + 1,
      Kecamatan: item.nama,
      'Total Nilai': item.total_nilai,
      Status: item.status,
      'Terakhir Update': formatDate(item.updated_at)
    }));
    
    // Sort by total nilai descending
    exportData.sort((a, b) => b['Total Nilai'] - a['Total Nilai']);
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Data KAPASDA");
    
    // Add metadata
    if (!wb.Props) wb.Props = [];
    wb.Props.push({
      FilterInfo: JSON.stringify(rekapState.filters),
      ExportDate: new Date().toISOString(),
      ExportedBy: 'KAPASDA System'
    });
    
    XLSX.writeFile(wb, `KAPASDA_Rekap_${new Date().toISOString().slice(0,10)}.xlsx`);
    
    hideLoading();
    showToast('Data berhasil diekspor ke Excel', false, 'success');
  } catch (error) {
    hideLoading();
    console.error('Export error:', error);
    showToast(handleApiError(error, 'Gagal mengekspor data'), true, 'error');
  }
}

/**
 * Export to PDF
 */
function exportToPDF() {
  showToast('Fitur export PDF akan segera tersedia', false, 'info');
}

/**
 * Export to CSV with enhanced features
 */
function exportToCSV() {
  if (rekapState.filteredData.length === 0) {
    showToast('Tidak ada data untuk diekspor', true, 'warning');
    return;
  }
  
  try {
    showLoading('Mengekspor data...');
    
    const exportData = rekapState.filteredData.map((item, index) => ({
      No: index + 1,
      Kecamatan: item.nama,
      'Total Nilai': item.total_nilai,
      Status: item.status,
      'Terakhir Update': formatDate(item.updated_at)
    }));
    
    // Sort by total nilai descending
    exportData.sort((a, b) => b['Total Nilai'] - a['Total Nilai']);
    
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `KAPASDA_Rekap_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    hideLoading();
    showToast('Data berhasil diekspor ke CSV', false, 'success');
  } catch (error) {
    hideLoading();
    console.error('CSV export error:', error);
    showToast(handleApiError(error, 'Gagal mengekspor CSV'), true, 'error');
  }
}

/**
 * Print table
 */
function printTable() {
  window.print();
}

// Export functions for other modules
export { 
  rekapState,
  loadRekapData,
  exportToExcel,
  exportToCSV
};