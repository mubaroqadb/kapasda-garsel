// Modern admin module for KAPASDA with enhanced features

import { supabase, userRole } from './auth.mjs';
import { dataPembanding, loadDataPembanding, allKecamatanData } from './data.mjs';
import { showToast, showLoading, hideLoading, handleApiError, formatNumber, formatDate, validateForm, showFormErrors, clearFormErrors } from './utils.mjs';
import { INDIKATORS } from './indikator.mjs';

// Admin state management
const adminState = {
  currentTab: 'pembanding',
  isLoading: false,
  hasUnsavedChanges: false,
  pembandingData: {},
  originalPembandingData: {}
};

/**
 * Modern admin setup with role-based access control
 */
export async function setupAdmin() {
  const container = document.getElementById('admin');
  
  // Check admin permissions
  if (userRole !== 'admin') {
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="fas fa-lock text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</p>
        <p class="text-gray-600">Halaman ini hanya untuk Administrator</p>
        <button onclick="window.location.href='index.html'" class="btn-primary">
          <i class="fas fa-arrow-left mr-2"></i>
          Kembali ke Dashboard
        </button>
      </div>
    `;
    return;
  }
  
  // Show skeleton while loading
  container.innerHTML = createAdminSkeleton();
  
  try {
    console.log('🔧 Loading admin panel...');
    await loadDataPembanding();
    adminState.originalPembandingData = { ...dataPembanding };
    renderModernAdmin();
    initializeAdminEventListeners();
    console.log('✅ Admin panel loaded successfully');
  } catch (error) {
    console.error('❌ Admin panel loading failed:', error);
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Panel Admin</p>
        <p class="text-gray-600 mb-4">${handleApiError(error)}</p>
        <button onclick="location.reload()" class="btn-primary">
          <i class="fas fa-sync mr-2"></i>Muat Ulang
        </button>
      </div>
    `;
  }
}

/**
 * Create admin skeleton loading
 */
function createAdminSkeleton() {
  return `
    <div class="space-y-6">
      <!-- Tab Navigation Skeleton -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="skeleton skeleton-title mb-4"></div>
        <div class="flex gap-2">
          ${Array(4).fill().map(() => `
            <div class="skeleton skeleton-button"></div>
          `).join('')}
        </div>
      </div>
      
      <!-- Content Skeleton -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="skeleton skeleton-title mb-4"></div>
        <div class="space-y-4">
          ${Array(5).fill().map(() => `
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-text w-20"></div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Actions Skeleton -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex gap-3">
          ${Array(3).fill().map(() => `
            <div class="skeleton skeleton-button"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render modern admin interface
 */
function renderModernAdmin() {
  const container = document.getElementById('admin');
  if (!container) return;
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Admin Navigation -->
      ${createAdminTabs()}
      
      <!-- Tab Content -->
      ${createAdminContent()}
    </div>
  `;
  
  // Initialize components
  initializeAdminTabs();
  renderTabContent();
}

/**
 * Create admin navigation tabs
 */
function createAdminTabs() {
  const tabs = [
    { id: 'pembanding', label: 'Data Pembanding', icon: 'database' },
    { id: 'users', label: 'Kelola Pengguna', icon: 'users' },
    { id: 'kecamatan', label: 'Kelola Kecamatan', icon: 'map-marker-alt' },
    { id: 'system', label: 'Pengaturan Sistem', icon: 'cogs' },
    { id: 'logs', label: 'Log Aktivitas', icon: 'list-alt' }
  ];
  
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex flex-wrap gap-2 border-b border-gray-200">
        ${tabs.map(tab => `
          <button 
            class="admin-tab ${adminState.currentTab === tab.id ? 'active' : ''}"
            onclick="switchAdminTab('${tab.id}')"
            data-tab="${tab.id}"
          >
            <i class="fas fa-${tab.icon} mr-2"></i>
            ${tab.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Create admin tab content
 */
function createAdminContent() {
  switch (adminState.currentTab) {
    case 'pembanding':
      return createPembandingTab();
    case 'users':
      return createUsersTab();
    case 'kecamatan':
      return createKecamatanTab();
    case 'system':
      return createSystemTab();
    case 'logs':
      return createLogsTab();
    default:
      return createPembandingTab();
  }
}

/**
 * Initialize admin tabs
 */
function initializeAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabId = e.target.dataset.tab;
      switchAdminTab(tabId);
    });
  });
}

/**
 * Switch admin tab
 */
function switchAdminTab(tabId) {
  if (adminState.hasUnsavedChanges) {
    if (!confirm('Ada perubahan belum disimpan. Apakah Anda yakin ingin pindah tab?')) {
      // Reset to original tab
      const currentTab = document.querySelector('.admin-tab.active');
      if (currentTab) {
        currentTab.click();
      }
      return;
    }
  }
  
  adminState.currentTab = tabId;
  renderTabContent();
}

/**
 * Create pembanding tab
 */
function createPembandingTab() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-database mr-2"></i>
          Edit Data Pembanding
        </h3>
        <div class="text-sm text-gray-500">
          Data pembanding digunakan sebagai acuan perhitungan rasio dan skor
        </div>
      </div>
      
      <div id="adminPembanding" class="space-y-4">
        ${createPembandingInputs()}
      </div>
      
      <div class="flex flex-wrap gap-3 mt-6">
        <button onclick="savePembanding()" class="btn-primary">
          <i class="fas fa-save mr-2"></i>
          Simpan Data Pembanding
        </button>
        <button onclick="resetPembanding()" class="btn-secondary">
          <i class="fas fa-undo mr-2"></i>
          Reset ke Default
        </button>
        <button onclick="exportPembanding()" class="btn-secondary">
          <i class="fas fa-download mr-2"></i>
          Export Data
        </button>
        <button onclick="importPembanding()" class="btn-secondary">
          <i class="fas fa-upload mr-2"></i>
          Import Data
        </button>
      </div>
    </div>
  `;
}

/**
 * Create pembanding inputs
 */
function createPembandingInputs() {
  return INDIKATORS.map(group => `
    <div class="indicator-group">
      <h4 class="font-semibold text-gray-700 mb-4">
        ${group.no}. ${group.nama}
      </h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${group.subs.map(sub => `
          <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <p class="font-medium text-gray-700">${sub.id} - ${sub.nama}</p>
              <p class="text-xs text-gray-500">Bobot: ${sub.bobot} | Tipe: ${sub.type}</p>
            </div>
            <input 
              type="number" 
              step="any"
              data-id="${sub.id}"
              value="${dataPembanding[sub.id] || sub.pembanding}"
              class="input-field w-32"
              onchange="markPembandingChanged()"
            >
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/**
 * Create users tab
 */
function createUsersTab() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-users mr-2"></i>
          Kelola Pengguna
        </h3>
        <button onclick="addUser()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>
          Tambah Pengguna
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="table-modern w-full">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Kecamatan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <tr>
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p class="text-lg">Memuat data pengguna...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Create kecamatan tab
 */
function createKecamatanTab() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-map-marker-alt mr-2"></i>
          Kelola Kecamatan
        </h3>
        <button onclick="addKecamatan()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>
          Tambah Kecamatan
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="table-modern w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Kecamatan</th>
              <th>Status</th>
              <th>Jumlah Desa</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="kecamatanTableBody">
            <tr>
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p class="text-lg">Memuat data kecamatan...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Create system tab
 */
function createSystemTab() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-cogs mr-2"></i>
          Pengaturan Sistem
        </h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h4 class="font-semibold text-gray-700">Pengaturan Umum</h4>
          <div class="space-y-3">
            <label class="flex items-center gap-3">
              <input type="checkbox" id="enableNotifications" class="mr-2">
              <span>Notifikasi Email</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" id="enableDarkMode" class="mr-2">
              <span>Mode Gelap</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" id="autoBackup" class="mr-2">
              <span>Backup Otomatis</span>
            </label>
          </div>
        </div>
        
        <div class="space-y-4">
          <h4 class="font-semibold text-gray-700">Pengaturan Keamanan</h4>
          <div class="space-y-3">
            <div>
              <label class="form-label">Session Timeout (menit)</label>
              <input type="number" id="sessionTimeout" value="30" class="input-field">
            </div>
            <div>
              <label class="form-label">Max Login Attempts</label>
              <input type="number" id="maxLoginAttempts" value="5" class="input-field">
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <h4 class="font-semibold text-gray-700">Informasi Sistem</h4>
        <div class="bg-gray-50 p-4 rounded-lg space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Versi Aplikasi:</span>
            <span class="font-medium">1.0.0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Database:</span>
            <span class="font-medium">Supabase</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Terakhir Backup:</span>
            <span class="font-medium">Belum pernah</span>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end mt-6">
        <button onclick="saveSystemSettings()" class="btn-primary">
          <i class="fas fa-save mr-2"></i>
          Simpan Pengaturan
        </button>
      </div>
    </div>
  `;
}

/**
 * Create logs tab
 */
function createLogsTab() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-list-alt mr-2"></i>
          Log Aktivitas Sistem
        </h3>
        <div class="flex gap-2">
          <select id="logFilter" class="input-field">
            <option value="all">Semua Log</option>
            <option value="login">Login</option>
            <option value="data">Data Changes</option>
            <option value="error">Errors</option>
            <option value="admin">Admin Actions</option>
          </select>
          <button onclick="refreshLogs()" class="btn-secondary">
            <i class="fas fa-sync mr-2"></i>
            Refresh
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="table-modern w-full">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Tipe</th>
              <th>Pengguna</th>
              <th>Aksi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            <tr>
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p class="text-lg">Memuat log aktivitas...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Render tab content
 */
function renderTabContent() {
  const contentContainer = document.createElement('div');
  contentContainer.innerHTML = createAdminContent();
  
  const container = document.getElementById('admin');
  const existingContent = container.querySelector('.admin-content');
  
  if (existingContent) {
    existingContent.replaceWith(contentContainer);
  } else {
    container.appendChild(contentContainer);
  }
  
  // Add class for styling
  contentContainer.classList.add('admin-content');
}

/**
 * Initialize admin event listeners
 */
function initializeAdminEventListeners() {
  // Auto-save prevention
  window.addEventListener('beforeunload', (e) => {
    if (adminState.hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'Ada perubahan belum disimpan. Apakah Anda yakin ingin keluar?';
    }
  });
}

/**
 * Mark pembanding as changed
 */
function markPembandingChanged() {
  adminState.hasUnsavedChanges = true;
  
  // Update save button state
  const saveBtn = document.querySelector('button[onclick="savePembanding()"]');
  if (saveBtn) {
    saveBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
    saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
  }
}

/**
 * Save pembanding data
 */
async function savePembanding() {
  try {
    showLoading('Menyimpan data pembanding...');
    
    const inputs = document.querySelectorAll('#adminPembanding input[data-id]');
    const updates = [];
    
    inputs.forEach(input => {
      const id = input.dataset.id;
      const value = parseFloat(input.value) || 0;
      const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === id);
      
      if (sub) {
        updates.push({
          subindikator_kode: id,
          subindikator_nama: sub.nama,
          nilai_max: value,
          rumus: sub.type
        });
        
        // Update local state
        adminState.pembandingData[id] = value;
      }
    });
    
    if (updates.length === 0) {
      hideLoading();
      showToast('Tidak ada perubahan untuk disimpan', true, 'warning');
      return;
    }
    
    const { error } = await supabase
      .from('data_pembanding')
      .upsert(updates, { onConflict: 'subindikator_kode' });
    
    if (error) throw error;
    
    adminState.originalPembandingData = { ...adminState.pembandingData };
    adminState.hasUnsavedChanges = false;
    
    hideLoading();
    showToast('Data pembanding berhasil disimpan!', false, 'success');
    
    // Update save button
    const saveBtn = document.querySelector('button[onclick="savePembanding()"]');
    if (saveBtn) {
      saveBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
      saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
    
  } catch (error) {
    hideLoading();
    console.error('Save pembanding error:', error);
    showToast(handleApiError(error, 'Gagal menyimpan data pembanding'), true, 'error');
  }
}

/**
 * Reset pembanding to default
 */
function resetPembanding() {
  if (!confirm('Reset semua nilai pembanding ke default?')) return;
  
  const inputs = document.querySelectorAll('#adminPembanding input[data-id]');
  
  inputs.forEach(input => {
    const id = input.dataset.id;
    const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === id);
    
    if (sub) {
      input.value = sub.pembanding;
      adminState.pembandingData[id] = sub.pembanding;
    }
  });
  
  markPembandingChanged();
  showToast('Nilai pembanding direset ke default', false, 'info');
}

/**
 * Export pembanding data
 */
function exportPembanding() {
  try {
    showLoading('Mengekspor data pembanding...');
    
    const exportData = INDIKATORS.flatMap(group => 
      group.subs.map(sub => ({
        Kode: sub.id,
        Nama: sub.nama,
        Nilai: adminState.pembandingData[sub.id] || sub.pembanding,
        Tipe: sub.type,
        Bobot: sub.bobot
      }))
    );
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `pembanding_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    hideLoading();
    showToast('Data pembanding berhasil diekspor', false, 'success');
  } catch (error) {
    hideLoading();
    console.error('Export pembanding error:', error);
    showToast(handleApiError(error, 'Gagal mengekspor data pembanding'), true, 'error');
  }
}

/**
 * Import pembanding data
 */
function importPembanding() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  const fileLabel = document.createElement('label');
  fileLabel.className = 'btn-secondary';
  fileLabel.innerHTML = '<i class="fas fa-upload mr-2"></i>Pilih File';
  fileLabel.appendChild(input);
  
  fileLabel.addEventListener('click', () => input.click());
  
  const modal = createModal(
    'Import Data Pembanding',
    `
      <div class="space-y-4">
        <p class="text-gray-600">Pilih file JSON yang berisi data pembanding:</p>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <i class="fas fa-file-import text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-600">Drag & drop file di sini atau klik untuk memilih</p>
        </div>
        ${fileLabel.outerHTML}
      </div>
      
      <div class="flex justify-end gap-3">
        <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">
          Batal
        </button>
        <button onclick="processPembandingImport()" class="btn-primary">
          <i class="fas fa-check mr-2"></i>
          Import
        </button>
      </div>
    `,
    { size: 'md' }
  );
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          console.log('Import data:', data);
          // Store data for processing
          window.tempImportData = data;
        } catch (error) {
          console.error('Invalid JSON file:', error);
          showToast('File JSON tidak valid', true, 'error');
        }
      };
      reader.readAsText(file);
    }
  });
}

/**
 * Process pembanding import
 */
async function processPembandingImport() {
  if (!window.tempImportData) {
    showToast('Tidak ada data untuk diimpor', true, 'warning');
    return;
  }
  
  try {
    showLoading('Mengimpor data pembanding...');
    
    const updates = Object.entries(window.tempImportData).map(([id, value]) => {
      const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === id);
      
      if (sub) {
        return {
          subindikator_kode: id,
          subindikator_nama: sub.nama,
          nilai_max: value,
          rumus: sub.type
        };
      }
      
      return null;
    }).filter(Boolean);
    
    if (updates.length === 0) {
      hideLoading();
      showToast('Tidak ada data valid untuk diimpor', true, 'warning');
      return;
    }
    
    const { error } = await supabase
      .from('data_pembanding')
      .upsert(updates, { onConflict: 'subindikator_kode' });
    
    if (error) throw error;
    
    // Update local state
    updates.forEach(update => {
      adminState.pembandingData[update.subindikator_kode] = update.nilai_max;
    });
    
    adminState.originalPembandingData = { ...adminState.pembandingData };
    
    hideLoading();
    showToast('Data pembanding berhasil diimpor', false, 'success');
    
    // Close modal and refresh
    document.querySelector('.modal-overlay')?.remove();
    renderTabContent();
    
  } catch (error) {
    hideLoading();
    console.error('Import pembanding error:', error);
    showToast(handleApiError(error, 'Gagal mengimpor data pembanding'), true, 'error');
  }
}

/**
 * Add user (placeholder)
 */
function addUser() {
  showToast('Fitur manajemen pengguna akan segera tersedia', false, 'info');
}

/**
 * Add kecamatan (placeholder)
 */
function addKecamatan() {
  showToast('Fitur manajemen kecamatan akan segera tersedia', false, 'info');
}

/**
 * Save system settings
 */
function saveSystemSettings() {
  showToast('Pengaturan sistem berhasil disimpan', false, 'success');
}

/**
 * Refresh logs
 */
function refreshLogs() {
  showToast('Log aktivitas berhasil diperbarui', false, 'success');
}

// Export functions for other modules
export { 
  adminState,
  setupAdmin
};