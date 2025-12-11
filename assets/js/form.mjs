// Modern form module for KAPASDA with enhanced validation and UX

import { supabase } from './auth.mjs';
import { allKecamatanData, loadAllKecamatanData } from './data.mjs';
import { showToast, showLoading, hideLoading, handleApiError, validateForm, showFormErrors, clearFormErrors, debounce, formatNumber, formatDate } from './utils.mjs';
import { INDIKATORS } from './indikator.mjs';

// Form state management
const formState = {
  currentKecamatan: null,
  formData: {},
  isDirty: false,
  isValid: false,
  isSubmitting: false,
  autoSaveTimer: null,
  calculations: {}
};

// Global state for kecamatan list
let selectedKecamatan = null;
let KECAMATAN_LIST = [];

/**
 * Modern kecamatan list fetching with error handling
 */
export async function fetchKecamatanList() {
  try {
    showLoading('Memuat daftar kecamatan...');
    
    // Check database connection first
    const connectionOk = await checkSupabaseConnection();
    if (!connectionOk) {
      throw new Error('Tidak dapat terhubung ke database. Periksa koneksi internet Anda.');
    }
    
    // Get kecamatan list from database
    const { data: kecamatanList, error: kecError } = await supabase
      .from('kecamatan')
      .select('id, nama')
      .order('nama');
    
    if (kecError) {
      console.error('Error loading kecamatan list:', kecError);
      throw new Error(`Gagal memuat data kecamatan: ${kecError.message}`);
    }
    
    if (!kecamatanList || kecamatanList.length === 0) {
      console.warn('No kecamatan data found in database');
      KECAMATAN_LIST = [];
      return [];
    }
    
    // Update global KECAMATAN_LIST with names from database
    KECAMATAN_LIST = kecamatanList.map(k => k.nama);
    
    hideLoading();
    return KECAMATAN_LIST;
  } catch (error) {
    hideLoading();
    console.error('Error fetching kecamatan list:', error);
    showToast(handleApiError(error, 'Gagal memuat daftar kecamatan'), true, 'error');
    KECAMATAN_LIST = [];
    throw error;
  }
}

/**
 * Enhanced kecamatan data loading with caching
 */
export async function loadAllKecamatanData(userRole, userKecamatanId) {
  try {
    showLoading('Memuat data penilaian...');
    
    // First, ensure we have latest kecamatan list
    await fetchKecamatanList();
    
    // Get kecamatan mapping
    const { data: kecamatanList, error: kecError } = await supabase
      .from('kecamatan')
      .select('id, nama');
    
    if (kecError) {
      throw new Error(`Gagal memuat data kecamatan: ${kecError.message}`);
    }
    
    if (!kecamatanList || kecamatanList.length === 0) {
      console.warn('No kecamatan data found in database');
      allKecamatanData = {};
      return {};
    }
    
    const kecamatanMap = {};
    kecamatanList.forEach(k => {
      kecamatanMap[k.id] = k.nama;
    });
    
    // Build query based on role with optimization
    let query = supabase
      .from('penilaian')
      .select('*')
      .eq('status', 'final');
    
    if (userRole === 'kecamatan' && userKecamatanId) {
      query = query.eq('kecamatan_id', userKecamatanId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error loading penilaian data:', error);
      throw new Error(`Gagal memuat data penilaian: ${error.message}`);
    }
    
    // Convert to allKecamatanData format with validation
    allKecamatanData = {};
    if (data) {
      data.forEach(item => {
        const kecamatanName = kecamatanMap[item.kecamatan_id];
        if (kecamatanName && item.data) {
          try {
            const jsonData = item.data;
            allKecamatanData[kecamatanName] = {
              inputs: jsonData.inputs || {},
              calculations: jsonData.calculations || {},
              totalNilai: item.total_nilai || 0,
              status: item.total_nilai >= 400 ? 'LAYAK' : 'TIDAK LAYAK',
              lastUpdate: item.updated_at,
              userId: item.user_id
            };
          } catch (parseError) {
            console.error(`Error parsing data for ${kecamatanName}:`, parseError);
          }
        }
      });
    }
    
    hideLoading();
    return allKecamatanData;
  } catch (error) {
    hideLoading();
    console.error('Error loading kecamatan data:', error);
    showToast(handleApiError(error, 'Gagal memuat data kecamatan'), true, 'error');
    allKecamatanData = {};
    return {};
  }
}

/**
 * Modern form setup with enhanced features
 */
export async function setupForm() {
  const container = document.getElementById('form');
  
  // Show loading skeleton
  container.innerHTML = createFormSkeleton();
  
  try {
    // Get user data from auth module
    const { userRole, userKecamatanId, userKecamatanName } = await import('./auth.mjs').then(m => m);
    
    // Initialize form state
    await initializeFormState(userRole, userKecamatanId, userKecamatanName);
    
    // Render modern form
    renderModernForm();
    
    // Initialize event listeners
    initializeFormEventListeners();
    
    // Setup auto-save
    setupAutoSave();
    
    console.log('✅ Form setup complete');
  } catch (error) {
    console.error('❌ Form setup failed:', error);
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Form</p>
        <p class="text-gray-600 mb-4">${handleApiError(error)}</p>
        <button onclick="location.reload()" class="btn-primary">
          <i class="fas fa-sync mr-2"></i>Muat Ulang
        </button>
      </div>
    `;
  }
}

/**
 * Initialize form state
 */
async function initializeFormState(userRole, userKecamatanId, userKecamatanName) {
  // Load kecamatan data
  await loadAllKecamatanData(userRole, userKecamatanId);
  
  // Set current kecamatan
  if (userRole === 'kecamatan' && userKecamatanName) {
    formState.currentKecamatan = userKecamatanName;
  } else {
    formState.currentKecamatan = KECAMATAN_LIST.length > 0 ? KECAMATAN_LIST[0] : null;
  }
  
  // Load existing form data
  if (formState.currentKecamatan) {
    const existingData = allKecamatanData[formState.currentKecamatan];
    if (existingData) {
      formState.formData = { ...existingData.inputs };
      formState.calculations = { ...existingData.calculations };
    }
  }
}

/**
 * Create form skeleton loading
 */
function createFormSkeleton() {
  return `
    <div class="space-y-6">
      <!-- Header Skeleton -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
      
      <!-- Form Sections Skeleton -->
      ${Array(5).fill().map(() => `
        <div class="form-section">
          <div class="skeleton skeleton-title mb-4"></div>
          <div class="space-y-4">
            ${Array(3).fill().map(() => `
              <div class="skeleton skeleton-text"></div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      
      <!-- Actions Skeleton -->
      <div class="flex justify-end gap-3">
        <div class="skeleton skeleton-button"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    </div>
  `;
}

/**
 * Render modern form with enhanced UI
 */
function renderModernForm() {
  const container = document.getElementById('form');
  if (!container) return;
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Form Header -->
      ${createFormHeader()}
      
      <!-- Form Content -->
      ${createFormContent()}
      
      <!-- Form Actions -->
      ${createFormActions()}
      
      <!-- Form Status -->
      ${createFormStatus()}
    </div>
  `;
  
  // Initialize form after rendering
  initializeFormValues();
  updateFormStatus();
}

/**
 * Create form header with kecamatan selection
 */
function createFormHeader() {
  const { userRole } = getCurrentUserData();
  
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-edit mr-2"></i>
            Input Data Penilaian
          </h2>
          <p class="text-gray-600 mt-1">Lengkapi data penilaian kapasitas kecamatan</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="form-group">
            <label for="selectKecamatan" class="form-label">Pilih Kecamatan</label>
            <select id="selectKecamatan" class="input-field">
              ${KECAMATAN_LIST.map(kec => 
                `<option value="${kec}">${kec}</option>`
              ).join('')}
            </select>
          </div>
          
          ${userRole !== 'admin' ? `
            <div class="bg-blue-50 px-4 py-2 rounded-lg">
              <i class="fas fa-info-circle text-blue-600 mr-2"></i>
              <span class="text-sm text-blue-700">
                Anda hanya dapat mengedit data kecamatan Anda
              </span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create form content with indicators
 */
function createFormContent() {
  const formSections = INDIKATORS.map(group => `
    <div class="form-section">
      <h3 class="form-section-title">
        <span class="flex items-center gap-2">
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            ${group.no}
          </span>
          ${group.nama}
        </span>
        <div class="ml-auto text-sm text-gray-500">
          Total Bobot: ${group.subs.reduce((sum, sub) => sum + sub.bobot, 0)}
        </div>
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${group.subs.map(sub => createFormField(sub)).join('')}
      </div>
    </div>
  `).join('');
  
  return `
    <div class="space-y-6">
      ${formSections}
    </div>
  `;
}

/**
 * Create individual form field with validation
 */
function createFormField(sub) {
  const value = formState.formData[sub.id] || '';
  const calculation = formState.calculations[sub.id] || {};
  
  return `
    <div class="form-group" data-indicator="${sub.id}">
      <label for="${sub.id}" class="form-label">
        ${sub.nama}
        <span class="text-red-500 ml-1">*</span>
      </label>
      
      <div class="space-y-2">
        <input 
          type="number" 
          id="${sub.id}" 
          name="${sub.id}"
          value="${value}"
          step="any"
          class="input-field w-full"
          placeholder="Masukkan nilai ${sub.nama.toLowerCase()}"
          data-validate="${sub.type === 'ratio' ? 'required' : 'required'}"
          data-indicator="${sub.id}"
        >
        
        <div class="form-help">
          <i class="fas fa-info-circle mr-1"></i>
          Tipe: ${sub.type === 'ratio' ? 'Rasio' : 'Langsung'} | 
          Bobot: ${sub.bobot} | 
          Pembanding: ${formatNumber(getPembandingValue(sub.id))}
        </div>
        
        ${calculation.rasio !== undefined ? `
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-sm text-gray-600 space-y-1">
              <div>
                <span class="font-medium">Input:</span> ${formatNumber(calculation.input)}
              </div>
              <div>
                <span class="font-medium">Pembanding:</span> ${formatNumber(calculation.pembanding)}
              </div>
              <div>
                <span class="font-medium">Rasio:</span> ${calculation.rasio.toFixed(4)}
              </div>
              <div>
                <span class="font-medium">Skor:</span> ${calculation.skor}
              </div>
              <div>
                <span class="font-medium">Nilai:</span> ${formatNumber(calculation.nilai)}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Create form actions with modern buttons
 */
function createFormActions() {
  const { userRole } = getCurrentUserData();
  const canSave = userRole === 'admin' || (userRole === 'kecamatan' && formState.currentKecamatan);
  
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-sm text-gray-600">
          ${formState.isDirty ? 
            '<i class="fas fa-exclamation-triangle text-yellow-500 mr-1"></i>Ada perubahan belum disimpan' : 
            '<i class="fas fa-check-circle text-green-500 mr-1"></i>Semua perubahan tersimpan'
          }
        </div>
        
        <div class="flex gap-3">
          <button 
            type="button" 
            onclick="resetForm()" 
            class="btn-secondary"
            ${formState.isSubmitting ? 'disabled' : ''}
          >
            <i class="fas fa-undo mr-2"></i>
            Reset
          </button>
          
          <button 
            type="button" 
            onclick="saveForm()" 
            class="btn-primary"
            ${!canSave || formState.isSubmitting ? 'disabled' : ''}
          >
            <i class="fas fa-save mr-2"></i>
            ${formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
          
          <button 
            type="button" 
            onclick="calculatePreview()" 
            class="btn-secondary"
            ${formState.isSubmitting ? 'disabled' : ''}
          >
            <i class="fas fa-calculator mr-2"></i>
            Preview
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create form status display
 */
function createFormStatus() {
  const calculation = calculateTotal();
  
  return `
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">
        <i class="fas fa-chart-line mr-2"></i>
        Hasil Perhitungan
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <div class="text-2xl font-bold ${calculation.total >= 400 ? 'text-green-600' : 'text-red-600'}">
            ${formatNumber(calculation.total)}
          </div>
          <div class="text-sm text-gray-600 mt-1">Total Nilai</div>
        </div>
        
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <div class="text-2xl font-bold">
            ${calculation.persentase.toFixed(1)}%
          </div>
          <div class="text-sm text-gray-600 mt-1">Persentase</div>
        </div>
        
        <div class="text-center p-4 rounded-lg ${
          calculation.total >= 400 ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
        }">
          <div class="text-lg font-bold ${
            calculation.total >= 400 ? 'text-green-700' : 'text-red-700'
          }">
            ${calculation.status}
          </div>
          <div class="text-sm text-gray-600 mt-1">Status Kelayakan</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize form values and event listeners
 */
function initializeFormValues() {
  // Set kecamatan selector
  const select = document.getElementById('selectKecamatan');
  if (select && formState.currentKecamatan) {
    select.value = formState.currentKecamatan;
    
    // Disable for non-admin users
    const { userRole } = getCurrentUserData();
    if (userRole !== 'admin') {
      select.disabled = true;
      select.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
  }
  
  // Add input event listeners
  document.querySelectorAll('input[data-indicator]').forEach(input => {
    input.addEventListener('input', handleInputChange);
    input.addEventListener('blur', handleInputBlur);
  });
}

/**
 * Initialize form event listeners
 */
function initializeFormEventListeners() {
  // Kecamatan change
  const kecamatanSelect = document.getElementById('selectKecamatan');
  if (kecamatanSelect) {
    kecamatanSelect.addEventListener('change', handleKecamatanChange);
  }
  
  // Form submission on Enter
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      saveForm();
    }
  });
  
  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (formState.isDirty) {
      e.preventDefault();
      e.returnValue = 'Ada perubahan belum disimpan. Apakah Anda yakin ingin keluar?';
    }
  });
}

/**
 * Handle input changes with validation
 */
function handleInputChange(event) {
  const input = event.target;
  const indicatorId = input.dataset.indicator;
  const value = parseFloat(input.value) || 0;
  
  // Update form state
  formState.formData[indicatorId] = value;
  formState.isDirty = true;
  
  // Calculate and update
  calculateIndicator(indicatorId);
  updateFormStatus();
}

/**
 * Handle input blur with validation
 */
function handleInputBlur(event) {
  const input = event.target;
  const indicatorId = input.dataset.indicator;
  const value = parseFloat(input.value) || 0;
  
  // Validate input
  validateIndicatorInput(input, indicatorId, value);
}

/**
 * Validate indicator input
 */
function validateIndicatorInput(input, indicatorId, value) {
  let isValid = true;
  let errorMessage = '';
  
  // Remove existing error
  clearFormErrors(input.form);
  
  // Check if value is required and not empty
  if (input.dataset.validate === 'required' && (value === '' || isNaN(value))) {
    isValid = false;
    errorMessage = 'Field ini wajib diisi dengan angka yang valid';
  }
  
  // Check if value is negative
  if (value < 0) {
    isValid = false;
    errorMessage = 'Nilai tidak boleh negatif';
  }
  
  // Show error if invalid
  if (!isValid) {
    input.classList.add('border-red-300');
    showFormErrors(input.form, { [input.name]: errorMessage });
  } else {
    input.classList.remove('border-red-300');
  }
  
  return isValid;
}

/**
 * Calculate indicator score
 */
function calculateIndicator(indicatorId) {
  const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === indicatorId);
  if (!sub) return;
  
  const value = formState.formData[indicatorId] || 0;
  const pembanding = getPembandingValue(indicatorId);
  
  let rasio = 0;
  if (sub.type === 'ratio') {
    rasio = pembanding > 0 ? (value / pembanding) : 0;
  } else {
    rasio = value;
  }
  
  const skor = sub.skor(rasio);
  const nilai = skor * sub.bobot;
  
  // Update calculations
  formState.calculations[indicatorId] = {
    input: value,
    pembanding: pembanding,
    rasio: rasio,
    skor: skor,
    nilai: nilai
  };
}

/**
 * Calculate total score
 */
function calculateTotal() {
  let total = 0;
  
  Object.values(formState.calculations).forEach(calc => {
    if (calc && calc.nilai) {
      total += calc.nilai;
    }
  });
  
  const status = total >= 400 ? 'LAYAK' : 'TIDAK LAYAK';
  const persentase = (total / 500) * 100; // Assuming 500 is max possible score
  
  return {
    total,
    status,
    persentase
  };
}

/**
 * Update form status display
 */
function updateFormStatus() {
  const calculation = calculateTotal();
  
  // Update status displays
  const totalElement = document.querySelector('.text-2xl');
  const statusElement = document.querySelector('.text-lg.font-bold');
  const percentElement = document.querySelector('.text-2xl.font-bold + .text-sm');
  
  if (totalElement) {
    totalElement.textContent = formatNumber(calculation.total);
    totalElement.className = `text-2xl font-bold ${calculation.total >= 400 ? 'text-green-600' : 'text-red-600'}`;
  }
  
  if (statusElement) {
    statusElement.textContent = calculation.status;
    statusElement.className = `text-lg font-bold ${calculation.total >= 400 ? 'text-green-700' : 'text-red-700'}`;
  }
  
  if (percentElement) {
    percentElement.textContent = `${calculation.persentase.toFixed(1)}%`;
  }
}

/**
 * Handle kecamatan change
 */
function handleKecamatanChange(event) {
  const newKecamatan = event.target.value;
  
  if (formState.isDirty) {
    if (!confirm('Ada perubahan belum disimpan. Apakah Anda yakin ingin pindah kecamatan?')) {
      event.target.value = formState.currentKecamatan;
      return;
    }
  }
  
  formState.currentKecamatan = newKecamatan;
  loadKecamatanData(newKecamatan);
}

/**
 * Save form with modern validation
 */
async function saveForm() {
  if (formState.isSubmitting) return;
  
  const form = document.querySelector('form');
  if (!form) return;
  
  // Validate all fields
  const validation = validateForm(form);
  if (!validation.isValid) {
    showFormErrors(form, validation.errors);
    showToast('Perbaiki kesalahan pada form sebelum menyimpan', true, 'error');
    return;
  }
  
  formState.isSubmitting = true;
  updateFormActions();
  
  try {
    showLoading('Menyimpan data...');
    
    const { userRole } = getCurrentUserData();
    const currentUser = await getCurrentUser();
    
    if (!formState.currentKecamatan) {
      throw new Error('Pilih kecamatan terlebih dahulu');
    }
    
    // Get kecamatan ID
    const { data: kecData, error: kecError } = await supabase
      .from('kecamatan')
      .select('id')
      .eq('nama', formState.currentKecamatan)
      .single();
    
    if (kecError) throw kecError;
    if (!kecData) throw new Error(`Kecamatan ${formState.currentKecamatan} tidak ditemukan`);
    
    // Save to database
    const result = await saveKecamatanData(
      formState.currentKecamatan,
      formState.formData,
      INDIKATORS,
      {},
      400,
      currentUser
    );
    
    hideLoading();
    formState.isDirty = false;
    formState.isSubmitting = false;
    
    showToast(`Data ${formState.currentKecamatan} berhasil disimpan!`, false, 'success');
    updateFormActions();
    
  } catch (error) {
    hideLoading();
    formState.isSubmitting = false;
    updateFormActions();
    console.error('Save error:', error);
    showToast(handleApiError(error, 'Gagal menyimpan data'), true, 'error');
  }
}

/**
 * Reset form
 */
function resetForm() {
  if (!formState.isDirty || confirm('Apakah Anda yakin ingin mereset form?')) {
    formState.formData = {};
    formState.calculations = {};
    formState.isDirty = false;
    
    // Reset form inputs
    document.querySelectorAll('input[data-indicator]').forEach(input => {
      input.value = '';
      input.classList.remove('border-red-300');
    });
    
    updateFormStatus();
    updateFormActions();
    showToast('Form telah direset', false, 'info');
  }
}

/**
 * Calculate preview
 */
function calculatePreview() {
  const calculation = calculateTotal();
  
  const modal = createModal(
    'Preview Perhitungan',
    `
      <div class="space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-800 mb-2">Ringkasan Perhitungan</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-gray-600">Total Nilai:</span>
              <div class="text-xl font-bold ${calculation.total >= 400 ? 'text-green-600' : 'text-red-600'}">
                ${formatNumber(calculation.total)}
              </div>
            </div>
            <div>
              <span class="text-sm text-gray-600">Status:</span>
              <div class="text-xl font-bold ${calculation.total >= 400 ? 'text-green-600' : 'text-red-600'}">
                ${calculation.status}
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-800 mb-2">Detail Perhitungan</h4>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            ${Object.entries(formState.calculations).map(([id, calc]) => {
              const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === id);
              if (!sub || !calc) return '';
              
              return `
                <div class="flex justify-between items-center p-2 bg-white rounded">
                  <span class="text-sm">${sub.nama}</span>
                  <span class="font-medium">${formatNumber(calc.nilai)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `,
    { size: 'lg' }
  );
}

/**
 * Update form actions state
 */
function updateFormActions() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
  buttons.forEach(btn => {
    if (btn.textContent.includes('Simpan')) {
      btn.disabled = formState.isSubmitting;
      btn.innerHTML = formState.isSubmitting ? 
        '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...' : 
        '<i class="fas fa-save mr-2"></i>Simpan';
    }
  });
}

/**
 * Setup auto-save functionality
 */
function setupAutoSave() {
  // Clear existing timer
  if (formState.autoSaveTimer) {
    clearInterval(formState.autoSaveTimer);
  }
  
  // Setup auto-save every 30 seconds
  formState.autoSaveTimer = setInterval(() => {
    if (formState.isDirty && !formState.isSubmitting) {
      autoSave();
    }
  }, 30000);
}

/**
 * Auto-save functionality
 */
async function autoSave() {
  try {
    const currentUser = await getCurrentUser();
    
    // Save as draft
    await saveKecamatanData(
      formState.currentKecamatan,
      formState.formData,
      INDIKATORS,
      {},
      400,
      currentUser
    );
    
    console.log('Auto-saved form data');
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
}

/**
 * Get current user data
 */
async function getCurrentUser() {
  const { currentUser } = await import('./auth.mjs').then(m => m);
  return currentUser;
}

/**
 * Get current user data
 */
function getCurrentUserData() {
  // This should be imported from auth module
  // For now, return default values
  return {
    userRole: 'kecamatan', // This should come from auth module
    userKecamatanId: null,
    userKecamatanName: null
  };
}

/**
 * Get pembanding value
 */
function getPembandingValue(indicatorId) {
  // This should come from data module
  // For now, return default from indicators
  const sub = INDIKATORS.flatMap(g => g.subs).find(s => s.id === indicatorId);
  return sub ? sub.pembanding : 0;
}

/**
 * Save kecamatan data to Supabase
 */
async function saveKecamatanData(kecamatan, inputs, indicators, dataPembanding, batasLayak = 400, currentUser) {
  console.log('Starting saveKecamatanData for', kecamatan);
  
  // Validate inputs
  if (!kecamatan) {
    throw new Error('Nama kecamatan tidak boleh kosong');
  }
  
  if (!inputs || Object.keys(inputs).length === 0) {
    throw new Error('Data input tidak valid');
  }
  
  let totalNilai = 0;
  const calculations = {};
  
  // Calculate values for each indicator
  indicators.forEach(ind => {
    ind.subs.forEach(sub => {
      const inputValue = inputs[sub.id];
      const pembanding = dataPembanding[sub.id] || sub.pembanding;
      
      let rasio = 0;
      if (sub.type === 'ratio') {
        rasio = pembanding > 0 ? (inputValue / pembanding) : 0;
      } else {
        rasio = inputValue;
      }
      
      const skor = sub.skorFunc(rasio);
      const nilai = skor * sub.bobot;
      totalNilai += nilai;
      
      calculations[sub.id] = {
        input: inputValue,
        pembanding: pembanding,
        rasio: rasio,
        skor: skor,
        nilai: nilai
      };
    });
  });
  
  const status = totalNilai >= batasLayak ? 'LAYAK' : 'TIDAK LAYAK';
  
  allKecamatanData[kecamatan] = {
    inputs: inputs,
    calculations: calculations,
    totalNilai: totalNilai,
    status: status,
    lastUpdate: new Date().toISOString()
  };
  
  // Save to Supabase
  try {
    console.log('Getting kecamatan ID for', kecamatan);
    const { data: kecData, error: kecError } = await supabase
      .from('kecamatan')
      .select('id')
      .eq('nama', kecamatan)
      .single();
    
    if (kecError) {
      console.error('Error getting kecamatan ID:', kecError);
      throw new Error(`Gagal mendapatkan ID kecamatan: ${kecError.message}`);
    }
    
    if (!kecData) {
      throw new Error(`Kecamatan ${kecamatan} tidak ditemukan dalam database`);
    }
    
    console.log('Kecamatan ID:', kecData.id);
    
    // Validate user authentication
    if (!currentUser || !currentUser.id) {
      throw new Error('User tidak terautentikasi');
    }
    
    const penilaianData = {
      kecamatan_id: kecData.id,
      user_id: currentUser.id,
      data: {
        inputs: inputs,
        calculations: calculations
      },
      total_nilai: totalNilai,
      status: 'final'
    };
    
    console.log('Saving data to Supabase:', penilaianData);
    
    // Upsert to database
    const { data, error } = await supabase
      .from('penilaian')
      .upsert(penilaianData, {
        onConflict: 'kecamatan_id,status'
      })
      .select();
    
    if (error) {
      console.error('Error saving to Supabase:', error);
      throw new Error(`Gagal menyimpan ke database: ${error.message}`);
    }
    
    console.log('Data saved successfully:', data);
    return { totalNilai, status };
  } catch (error) {
    console.error('Error in saveKecamatanData:', error);
    throw error;
  }
}

/**
 * Check Supabase connection
 */
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('kecamatan')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
}

/**
 * Create modal dialog
 */
function createModal(title, content, options = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content ${options.size || ''}">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-800">${title}</h3>
        <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;
  
  // Add event listeners
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Add to body
  document.body.appendChild(modal);
  
  // Show with animation
  requestAnimationFrame(() => {
    modal.classList.add('show');
  });
  
  return modal;
}

// Export functions for other modules
export { 
  formState,
  fetchKecamatanList,
  loadAllKecamatanData,
  saveKecamatanData,
  createModal
};