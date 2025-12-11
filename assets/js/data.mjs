// Modern data management module for KAPASDA with optimized caching and query strategies

import { supabase } from './auth.mjs';
import { showToast, handleApiError, debounce, throttle, formatNumber } from './utils.mjs';

// Cache management
const dataCache = {
  kecamatan: {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000, // 5 minutes
    loading: false
  },
  pembanding: {
    data: null,
    timestamp: 0,
    ttl: 10 * 60 * 1000, // 10 minutes
    loading: false
  },
  penilaian: {
    data: null,
    timestamp: 0,
    ttl: 2 * 60 * 1000, // 2 minutes
    loading: false
  },
  users: {
    data: null,
    timestamp: 0,
    ttl: 15 * 60 * 1000, // 15 minutes
    loading: false
  }
};

// Query optimization
const queryConfig = {
  batchSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  timeoutMs: 30000
};

// Global data variables (for backward compatibility)
export let allKecamatanData = [];
export let dataPembanding = {};
export let penilaianData = [];

/**
 * Check if cache is valid
 */
function isCacheValid(cacheKey) {
  const cache = dataCache[cacheKey];
  if (!cache) return false;
  
  const now = Date.now();
  return cache.data && (now - cache.timestamp) < cache.ttl;
}

/**
 * Update cache
 */
function updateCache(cacheKey, data) {
  const cache = dataCache[cacheKey];
  if (cache) {
    cache.data = data;
    cache.timestamp = Date.now();
    cache.loading = false;
  }
}

/**
 * Clear cache
 */
function clearCache(cacheKey = null) {
  if (cacheKey) {
    const cache = dataCache[cacheKey];
    if (cache) {
      cache.data = null;
      cache.timestamp = 0;
      cache.loading = false;
    }
  } else {
    // Clear all caches
    Object.keys(dataCache).forEach(key => {
      dataCache[key].data = null;
      dataCache[key].timestamp = 0;
      dataCache[key].loading = false;
    });
  }
}

/**
 * Execute query with retry logic
 */
async function executeQuery(queryFn, cacheKey = null) {
  let retries = 0;
  let lastError = null;
  
  while (retries < queryConfig.maxRetries) {
    try {
      const startTime = Date.now();
      const { data, error } = await Promise.race([
        queryFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), queryConfig.timeoutMs)
        )
      ]);
      
      if (error) throw error;
      
      const duration = Date.now() - startTime;
      console.log(`✅ Query completed in ${duration}ms`);
      
      // Update cache if provided
      if (cacheKey) {
        updateCache(cacheKey, data);
      }
      
      return data;
      
    } catch (error) {
      lastError = error;
      retries++;
      
      if (retries < queryConfig.maxRetries) {
        console.warn(`⚠️ Query attempt ${retries} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, queryConfig.retryDelay * retries));
      }
    }
  }
  
  throw lastError;
}

/**
 * Load kecamatan data with caching
 */
export async function loadKecamatanData() {
  const cacheKey = 'kecamatan';
  
  // Return cached data if valid
  if (isCacheValid(cacheKey)) {
    allKecamatanData = dataCache[cacheKey].data;
    return allKecamatanData;
  }
  
  // Prevent multiple simultaneous loads
  if (dataCache[cacheKey].loading) {
    return new Promise((resolve) => {
      const checkLoading = setInterval(() => {
        if (!dataCache[cacheKey].loading) {
          clearInterval(checkLoading);
          resolve(allKecamatanData);
        }
      }, 100);
    });
  }
  
  dataCache[cacheKey].loading = true;
  
  try {
    console.log('📊 Loading kecamatan data...');
    
    const data = await executeQuery(async () => {
      const { data, error } = await supabase
        .from('kecamatan')
        .select(`
          id_kecamatan,
          nama_kecamatan,
          created_at,
          updated_at,
          penilaian (
            id_penilaian,
            id_kecamatan,
            tahun,
            created_at,
            updated_at
          )
        `)
        .order('nama_kecamatan');
      
      if (error) throw error;
      return data;
    }, cacheKey);
    
    allKecamatanData = data;
    console.log(`✅ Loaded ${data.length} kecamatan records`);
    
    return allKecamatanData;
    
  } catch (error) {
    dataCache[cacheKey].loading = false;
    console.error('❌ Failed to load kecamatan data:', error);
    showToast(handleApiError(error, 'Gagal memuat data kecamatan'), true, 'error');
    throw error;
  }
}

/**
 * Load data pembanding with caching
 */
export async function loadDataPembanding() {
  const cacheKey = 'pembanding';
  
  // Return cached data if valid
  if (isCacheValid(cacheKey)) {
    dataPembanding = dataCache[cacheKey].data;
    return dataPembanding;
  }
  
  // Prevent multiple simultaneous loads
  if (dataCache[cacheKey].loading) {
    return new Promise((resolve) => {
      const checkLoading = setInterval(() => {
        if (!dataCache[cacheKey].loading) {
          clearInterval(checkLoading);
          resolve(dataPembanding);
        }
      }, 100);
    });
  }
  
  dataCache[cacheKey].loading = true;
  
  try {
    console.log('📊 Loading pembanding data...');
    
    const data = await executeQuery(async () => {
      const { data, error } = await supabase
        .from('data_pembanding')
        .select('*');
      
      if (error) throw error;
      return data;
    }, cacheKey);
    
    // Transform to object format
    const pembandingObj = {};
    data.forEach(item => {
      pembandingObj[item.subindikator_kode] = item.nilai_max;
    });
    
    dataPembanding = pembandingObj;
    console.log(`✅ Loaded ${data.length} pembanding records`);
    
    return dataPembanding;
    
  } catch (error) {
    dataCache[cacheKey].loading = false;
    console.error('❌ Failed to load pembanding data:', error);
    showToast(handleApiError(error, 'Gagal memuat data pembanding'), true, 'error');
    throw error;
  }
}

/**
 * Load penilaian data with caching
 */
export async function loadPenilaianData(tahun = null) {
  const cacheKey = 'penilaian';
  
  // Return cached data if valid and no specific year requested
  if (isCacheValid(cacheKey) && !tahun) {
    penilaianData = dataCache[cacheKey].data;
    return penilaianData;
  }
  
  // Prevent multiple simultaneous loads
  if (dataCache[cacheKey].loading) {
    return new Promise((resolve) => {
      const checkLoading = setInterval(() => {
        if (!dataCache[cacheKey].loading) {
          clearInterval(checkLoading);
          resolve(penilaianData);
        }
      }, 100);
    });
  }
  
  dataCache[cacheKey].loading = true;
  
  try {
    console.log('📊 Loading penilaian data...');
    
    let query = supabase
      .from('penilaian')
      .select(`
        id_penilaian,
        id_kecamatan,
        tahun,
        created_at,
        updated_at,
        kecamatan (
          id_kecamatan,
          nama_kecamatan
        ),
        detail_penilaian (
          id_detail,
          id_penilaian,
          subindikator_kode,
          nilai,
          created_at,
          updated_at
        )
      `)
      .order('tahun', { ascending: false });
    
    if (tahun) {
      query = query.eq('tahun', tahun);
    }
    
    const data = await executeQuery(async () => {
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }, tahun ? null : cacheKey);
    
    // Only update cache if not filtering by year
    if (!tahun) {
      updateCache(cacheKey, data);
    }
    
    penilaianData = data;
    console.log(`✅ Loaded ${data.length} penilaian records`);
    
    return penilaianData;
    
  } catch (error) {
    dataCache[cacheKey].loading = false;
    console.error('❌ Failed to load penilaian data:', error);
    showToast(handleApiError(error, 'Gagal memuat data penilaian'), true, 'error');
    throw error;
  }
}

/**
 * Load users data with caching (admin only)
 */
export async function loadUsersData() {
  const cacheKey = 'users';
  
  // Return cached data if valid
  if (isCacheValid(cacheKey)) {
    return dataCache[cacheKey].data;
  }
  
  // Prevent multiple simultaneous loads
  if (dataCache[cacheKey].loading) {
    return new Promise((resolve) => {
      const checkLoading = setInterval(() => {
        if (!dataCache[cacheKey].loading) {
          clearInterval(checkLoading);
          resolve(dataCache[cacheKey].data);
        }
      }, 100);
    });
  }
  
  dataCache[cacheKey].loading = true;
  
  try {
    console.log('📊 Loading users data...');
    
    const data = await executeQuery(async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          nama,
          role,
          id_kecamatan,
          created_at,
          last_login,
          kecamatan (
            id_kecamatan,
            nama_kecamatan
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }, cacheKey);
    
    console.log(`✅ Loaded ${data.length} user records`);
    return data;
    
  } catch (error) {
    dataCache[cacheKey].loading = false;
    console.error('❌ Failed to load users data:', error);
    showToast(handleApiError(error, 'Gagal memuat data pengguna'), true, 'error');
    throw error;
  }
}

/**
 * Save penilaian data with optimistic updates
 */
export async function savePenilaianData(kecamatanId, tahun, detailPenilaian) {
  try {
    console.log('💾 Saving penilaian data...');
    
    // Start optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticData = {
      id_penilaian: tempId,
      id_kecamatan: kecamatanId,
      tahun: tahun,
      detail_penilaian: detailPenilaian.map((detail, index) => ({
        id_detail: `${tempId}_${index}`,
        subindikator_kode: detail.subindikator_kode,
        nilai: detail.nilai
      }))
    };
    
    // Add to cache optimistically
    if (dataCache.penilaian.data) {
      dataCache.penilaian.data.unshift(optimisticData);
    }
    
    // Save to database
    const { data, error } = await supabase.rpc('save_penilaian', {
      p_id_kecamatan: kecamatanId,
      p_tahun: tahun,
      p_detail_penilaian: detailPenilaian
    });
    
    if (error) throw error;
    
    // Update cache with real data
    if (dataCache.penilaian.data) {
      const index = dataCache.penilaian.data.findIndex(item => item.id_penilaian === tempId);
      if (index !== -1) {
        dataCache.penilaian.data[index] = data;
      }
    }
    
    console.log('✅ Penilaian data saved successfully');
    showToast('Data penilaian berhasil disimpan', false, 'success');
    
    return data;
    
  } catch (error) {
    // Rollback optimistic update
    if (dataCache.penilaian.data) {
      const index = dataCache.penilaian.data.findIndex(item => item.id_penilaian.startsWith('temp_'));
      if (index !== -1) {
        dataCache.penilaian.data.splice(index, 1);
      }
    }
    
    console.error('❌ Failed to save penilaian data:', error);
    showToast(handleApiError(error, 'Gagal menyimpan data penilaian'), true, 'error');
    throw error;
  }
}

/**
 * Batch save operations
 */
export async function batchSavePenilaian(penilaianList) {
  try {
    console.log(`💾 Batch saving ${penilaianList.length} penilaian records...`);
    
    const results = [];
    const batchSize = queryConfig.batchSize;
    
    for (let i = 0; i < penilaianList.length; i += batchSize) {
      const batch = penilaianList.slice(i, i + batchSize);
      
      const batchPromises = batch.map(penilaian => 
        savePenilaianData(
          penilaian.id_kecamatan,
          penilaian.tahun,
          penilaian.detail_penilaian
        ).catch(error => ({ error, penilaian }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to prevent overwhelming the database
      if (i + batchSize < penilaianList.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const errors = results.filter(result => result.error);
    const successes = results.filter(result => !result.error);
    
    console.log(`✅ Batch save completed: ${successes.length} success, ${errors.length} errors`);
    
    if (errors.length > 0) {
      showToast(`${successes.length} berhasil, ${errors.length} gagal`, errors.length > 0, 'warning');
    } else {
      showToast('Semua data berhasil disimpan', false, 'success');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Batch save failed:', error);
    showToast(handleApiError(error, 'Gagal menyimpan data batch'), true, 'error');
    throw error;
  }
}

/**
 * Delete penilaian data
 */
export async function deletePenilaianData(penilaianId) {
  try {
    console.log('🗑️ Deleting penilaian data...');
    
    // Optimistic deletion
    const originalData = dataCache.penilaian.data?.find(item => item.id_penilaian === penilaianId);
    
    if (dataCache.penilaian.data) {
      dataCache.penilaian.data = dataCache.penilaian.data.filter(
        item => item.id_penilaian !== penilaianId
      );
    }
    
    const { error } = await supabase
      .from('penilaian')
      .delete()
      .eq('id_penilaian', penilaianId);
    
    if (error) {
      // Rollback optimistic deletion
      if (originalData && dataCache.penilaian.data) {
        dataCache.penilaian.data.push(originalData);
      }
      throw error;
    }
    
    console.log('✅ Penilaian data deleted successfully');
    showToast('Data penilaian berhasil dihapus', false, 'success');
    
  } catch (error) {
    console.error('❌ Failed to delete penilaian data:', error);
    showToast(handleApiError(error, 'Gagal menghapus data penilaian'), true, 'error');
    throw error;
  }
}

/**
 * Get data statistics
 */
export async function getDataStatistics() {
  try {
    console.log('📊 Loading data statistics...');
    
    const stats = await executeQuery(async () => {
      const { data, error } = await supabase.rpc('get_data_statistics');
      if (error) throw error;
      return data;
    });
    
    console.log('✅ Data statistics loaded:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Failed to load data statistics:', error);
    showToast(handleApiError(error, 'Gagal memuat statistik data'), true, 'error');
    throw error;
  }
}

/**
 * Search kecamatan with debouncing
 */
export const searchKecamatan = debounce(async (searchTerm) => {
  try {
    console.log(`🔍 Searching kecamatan: "${searchTerm}"`);
    
    const { data, error } = await supabase
      .from('kecamatan')
      .select('id_kecamatan, nama_kecamatan')
      .ilike('nama_kecamatan', `%${searchTerm}%`)
      .order('nama_kecamatan')
      .limit(20);
    
    if (error) throw error;
    
    console.log(`✅ Found ${data.length} kecamatan matching "${searchTerm}"`);
    return data;
    
  } catch (error) {
    console.error('❌ Failed to search kecamatan:', error);
    showToast(handleApiError(error, 'Gagal mencari kecamatan'), true, 'error');
    return [];
  }
}, 300);

/**
 * Export data with progress tracking
 */
export async function exportData(format = 'json', filters = {}) {
  try {
    console.log(`📤 Exporting data in ${format} format...`);
    
    showLoading('Mempersiapkan data untuk export...');
    
    let data;
    let filename;
    let mimeType;
    
    switch (format) {
      case 'json':
        data = await prepareJsonExport(filters);
        filename = `kapasda_export_${new Date().toISOString().slice(0,10)}.json`;
        mimeType = 'application/json';
        break;
        
      case 'csv':
        data = await prepareCsvExport(filters);
        filename = `kapasda_export_${new Date().toISOString().slice(0,10)}.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'excel':
        data = await prepareExcelExport(filters);
        filename = `kapasda_export_${new Date().toISOString().slice(0,10)}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    // Create download link
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    hideLoading();
    showToast(`Data berhasil diekspor sebagai ${format.toUpperCase()}`, false, 'success');
    
  } catch (error) {
    hideLoading();
    console.error('❌ Export failed:', error);
    showToast(handleApiError(error, 'Gagal mengekspor data'), true, 'error');
    throw error;
  }
}

/**
 * Prepare JSON export data
 */
async function prepareJsonExport(filters) {
  const penilaian = await loadPenilaianData(filters.tahun);
  
  return JSON.stringify({
    export_date: new Date().toISOString(),
    filters: filters,
    data: penilaian,
    kecamatan: await loadKecamatanData(),
    pembanding: await loadDataPembanding()
  }, null, 2);
}

/**
 * Prepare CSV export data
 */
async function prepareCsvExport(filters) {
  const penilaian = await loadPenilaianData(filters.tahun);
  
  // Create CSV headers
  const headers = [
    'ID Penilaian',
    'Kecamatan',
    'Tahun',
    'Total Nilai',
    'Status',
    'Created At'
  ];
  
  // Create CSV rows
  const rows = penilaian.map(item => [
    item.id_penilaian,
    item.kecamatan?.nama_kecamatan || '',
    item.tahun,
    calculateTotalNilai(item),
    getStatusFromNilai(calculateTotalNilai(item)),
    item.created_at
  ]);
  
  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Prepare Excel export data (placeholder)
 */
async function prepareExcelExport(filters) {
  // This would require a library like SheetJS
  // For now, return CSV as fallback
  return await prepareCsvExport(filters);
}

/**
 * Calculate total nilai from penilaian
 */
function calculateTotalNilai(penilaian) {
  if (!penilaian.detail_penilaian || penilaian.detail_penilaian.length === 0) {
    return 0;
  }
  
  return penilaian.detail_penilaian.reduce((total, detail) => {
    return total + (parseFloat(detail.nilai) || 0);
  }, 0);
}

/**
 * Get status from nilai
 */
function getStatusFromNilai(nilai) {
  if (nilai >= 80) return 'Sangat Baik';
  if (nilai >= 60) return 'Baik';
  if (nilai >= 40) return 'Cukup';
  if (nilai >= 20) return 'Kurang';
  return 'Sangat Kurang';
}

/**
 * Initialize data module
 */
export function initializeDataModule() {
  console.log('🔧 Initializing data module...');
  
  // Preload critical data
  loadKecamatanData().catch(console.error);
  loadDataPembanding().catch(console.error);
  
  // Set up cache cleanup interval
  setInterval(() => {
    const now = Date.now();
    Object.keys(dataCache).forEach(key => {
      const cache = dataCache[key];
      if (cache.data && (now - cache.timestamp) > cache.ttl) {
        cache.data = null;
        cache.timestamp = 0;
        console.log(`🧹 Cache ${key} expired and cleared`);
      }
    });
  }, 60000); // Check every minute
  
  console.log('✅ Data module initialized');
}

/**
 * Get cache status (for debugging)
 */
export function getCacheStatus() {
  const status = {};
  Object.keys(dataCache).forEach(key => {
    const cache = dataCache[key];
    status[key] = {
      hasData: !!cache.data,
      timestamp: cache.timestamp,
      age: cache.timestamp ? Date.now() - cache.timestamp : 0,
      ttl: cache.ttl,
      loading: cache.loading,
      isValid: isCacheValid(key)
    };
  });
  return status;
}

/**
 * Force refresh all data
 */
export async function refreshAllData() {
  try {
    console.log('🔄 Refreshing all data...');
    
    clearCache();
    
    await Promise.all([
      loadKecamatanData(),
      loadDataPembanding(),
      loadPenilaianData()
    ]);
    
    console.log('✅ All data refreshed successfully');
    showToast('Data berhasil diperbarui', false, 'success');
    
  } catch (error) {
    console.error('❌ Failed to refresh data:', error);
    showToast(handleApiError(error, 'Gagal memperbarui data'), true, 'error');
    throw error;
  }
}

// Initialize module when imported
initializeDataModule();