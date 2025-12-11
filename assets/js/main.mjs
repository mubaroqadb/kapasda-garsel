// Modern main application module for KAPASDA

import { checkAuth, logout } from './auth.mjs';
import { loadDashboard } from './dashboard.mjs';
import { setupForm } from './form.mjs';
import { setupRekap } from './rekap.mjs';
import { setupAdmin } from './admin.mjs';
import { loadDataPembanding, loadAllKecamatanData } from './data.mjs';
import { showToast, showLoading, hideLoading, handleApiError, debounce } from './utils.mjs';

// Application state management
const appState = {
  initialized: false,
  currentTab: 'dashboard',
  loading: false,
  error: null,
  user: null
};

// Event listeners for tab changes
const tabListeners = new Set();

/**
 * Initialize the KAPASDA application with modern patterns
 */
export async function initApp() {
  console.log('Initializing KAPASDA application...');
  
  const loadingOverlay = document.getElementById('loading');
  if (!loadingOverlay) {
    console.error('Loading overlay element not found');
    return;
  }

  try {
    // 1. Check authentication first
    console.log('Checking authentication...');
    const authOK = await checkAuth();
    if (!authOK) {
      console.log('Authentication failed, redirecting to login');
      return;
    }
    console.log('Authentication successful');

    // 2. Load global data with error handling
    console.log('Loading global data...');
    showLoading('Memuat data aplikasi...');
    
    await Promise.all([
      loadDataPembanding().catch(err => {
        console.error('❌ Failed to load data pembanding:', err);
        showToast(handleApiError(err, 'Gagal memuat data pembanding'), true, 'warning');
        return { error: err };
      }),
      loadAllKecamatanData().catch(err => {
        console.error('❌ Failed to load kecamatan data:', err);
        showToast(handleApiError(err, 'Gagal memuat data kecamatan'), true, 'warning');
        return { error: err };
      })
    ]);
    
    console.log('Global data loaded');
    hideLoading();

    // 3. Setup all tabs with error boundaries
    console.log('Setting up application tabs...');
    await setupTabsWithErrorHandling();
    console.log('Application tabs setup complete');

    // 4. Initialize navigation and event listeners
    initializeNavigation();
    initializeEventListeners();

    // 5. Hide loading with smooth animation
    hideLoadingOverlay(loadingOverlay);
    
    // 6. Set application state
    appState.initialized = true;
    console.log('🎉 Application initialization complete');

    // Show welcome message for first-time users
    if (!localStorage.getItem('kapasda_visited')) {
      showToast('Selamat datang di KAPASDA! Sistem penilaian kapasitas daerah modern.', false, 'success');
      localStorage.setItem('kapasda_visited', 'true');
    }

  } catch (error) {
    console.error('💥 Critical error during application initialization:', error);
    handleCriticalError(error, loadingOverlay);
  }
}

/**
 * Setup tabs with individual error handling
 */
async function setupTabsWithErrorHandling() {
  const tabSetups = [
    { name: 'dashboard', setup: () => loadDashboard().catch(handleTabError) },
    { name: 'form', setup: () => setupForm().catch(handleTabError) },
    { name: 'rekap', setup: () => setupRekap().catch(handleTabError) },
    { name: 'admin', setup: () => setupAdmin().catch(handleTabError) }
  ];

  // Setup tabs in parallel with individual error handling
  await Promise.allSettled(
    tabSetups.map(async ({ name, setup }) => {
      try {
        await setup();
        console.log(`✅ ${name} tab loaded successfully`);
      } catch (error) {
        console.error(`Failed to load ${name} tab:`, error);
        return { name, error };
      }
    })
  );
}

/**
 * Handle tab-specific errors
 */
function handleTabError(error) {
  const errorMessage = handleApiError(error, 'Gagal memuat tab');
  showToast(errorMessage, true, 'error');
  
  // Show error state in tab content
  const activeTab = document.querySelector('.tab-content.active');
  if (activeTab) {
    activeTab.innerHTML = `
      <div class="text-center py-20">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat</p>
        <p class="text-gray-600 mb-4">${errorMessage}</p>
        <button onclick="location.reload()" class="btn-primary">
          <i class="fas fa-sync mr-2"></i>Coba Lagi
        </button>
      </div>
    `;
  }
}

/**
 * Handle critical initialization errors
 */
function handleCriticalError(error, loadingOverlay) {
  const errorMessage = handleApiError(error);
  const errorDetails = getErrorDetails(error);
  
  loadingOverlay.innerHTML = `
    <div class="text-center max-w-md mx-auto">
      <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
      <p class="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Aplikasi</p>
      <p class="text-lg text-gray-700 mb-2">${errorMessage}</p>
      <p class="text-sm text-gray-600 mb-6">${errorDetails}</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button onclick="location.reload()" class="btn-primary">
          <i class="fas fa-sync mr-2"></i>Muat Ulang
        </button>
        <button onclick="window.location.href='login.html'" class="btn-secondary">
          <i class="fas fa-sign-in-alt mr-2"></i>Login Ulang
        </button>
        <button onclick="showErrorDetails()" class="btn-secondary">
          <i class="fas fa-info-circle mr-2"></i>Detail
        </button>
      </div>
      <details class="mt-6 text-left">
        <summary class="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          <i class="fas fa-code mr-1"></i>Detail Teknis
        </summary>
        <pre class="text-xs text-gray-600 mt-2 p-4 bg-gray-100 rounded-lg overflow-auto max-h-40">${error.stack || error.message}</pre>
      </details>
    </div>
  `;
}

/**
 * Get user-friendly error details
 */
function getErrorDetails(error) {
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Periksa koneksi internet Anda dan pastikan server dapat diakses.';
  }
  
  if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.';
  }
  
  if (error.message?.includes('database') || error.message?.includes('supabase')) {
    return 'Terjadi masalah dengan database. Silakan coba lagi nanti.';
  }
  
  return 'Coba muat ulang halaman atau hubungi administrator jika masalah berlanjut.';
}

/**
 * Show error details modal
 */
function showErrorDetails() {
  const errorDetails = document.querySelector('details');
  if (errorDetails) {
    errorDetails.open = !errorDetails.open;
  }
}

/**
 * Hide loading overlay with animation
 */
function hideLoadingOverlay(loadingOverlay) {
  loadingOverlay.style.transition = 'opacity 0.6s ease';
  loadingOverlay.style.opacity = '0';
  
  setTimeout(() => {
    loadingOverlay.remove();
  }, 600);
}

/**
 * Initialize navigation with modern patterns
 */
function initializeNavigation() {
  // Set initial active tab
  document.querySelectorAll('[data-tab="dashboard"]').forEach(tab => tab.classList.add('active'));
  document.getElementById('dashboard').classList.add('active');
  
  // Add tab change listeners
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', handleTabChange);
  });
  
  // Add keyboard navigation
  document.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * Handle tab changes with state management
 */
function handleTabChange(event) {
  const button = event.currentTarget;
  const targetTab = button.getAttribute('data-tab');
  
  // Update state
  appState.currentTab = targetTab;
  
  // Update UI with animation
  updateTabUI(targetTab);
  
  // Notify listeners
  tabListeners.forEach(listener => {
    if (typeof listener === 'function') {
      listener(targetTab);
    }
  });
}

/**
 * Update tab UI with animations
 */
function updateTabUI(targetTab) {
  // Remove active from all tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Add active to selected tab
  const selectedButton = document.querySelector(`[data-tab="${targetTab}"]`);
  const selectedContent = document.getElementById(targetTab);
  
  if (selectedButton && selectedContent) {
    selectedButton.classList.add('active');
    selectedContent.classList.add('active');
    
    // Smooth scroll to top of content
    selectedContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Handle keyboard navigation
 */
function handleKeyboardNavigation(event) {
  // Alt + number keys for tab navigation
  if (event.altKey && event.key >= '1' && event.key <= '4') {
    event.preventDefault();
    const tabIndex = parseInt(event.key) - 1;
    const tabs = ['dashboard', 'form', 'rekap', 'admin'];
    
    if (tabIndex < tabs.length) {
      const tabName = tabs[tabIndex];
      const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
      
      if (tabButton && !tabButton.classList.contains('hidden')) {
        tabButton.click();
      }
    }
  }
}

/**
 * Initialize event listeners with modern patterns
 */
function initializeEventListeners() {
  // Logout button with confirmation
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Online/offline detection
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
  
  // Window resize with debouncing
  window.addEventListener('resize', debounce(handleResize, 250));
  
  // Before unload to save state
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Visibility change for pause/resume
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Handle logout with confirmation
 */
function handleLogout() {
  showToast('Apakah Anda yakin ingin keluar?', false, 'info');
  
  // Create confirmation dialog
  const modal = createModal(
    'Konfirmasi Keluar',
    `
      <p class="text-gray-600 mb-4">Apakah Anda yakin ingin keluar dari aplikasi KAPASDA?</p>
      <div class="flex gap-3 justify-end">
        <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">
          Batal
        </button>
        <button onclick="confirmLogout()" class="btn-danger">
          <i class="fas fa-sign-out-alt mr-2"></i>Keluar
        </button>
      </div>
    `,
    { size: 'md' }
  );
}

/**
 * Confirm logout
 */
async function confirmLogout() {
  try {
    await logout();
  } catch (error) {
    showToast(handleApiError(error, 'Gagal logout'), true, 'error');
  }
}

/**
 * Handle online/offline status
 */
function handleOnlineStatus() {
  const isOnline = navigator.onLine;
  const statusElement = document.querySelector('.flex.items-center.gap-3');
  
  if (statusElement) {
    const statusDot = statusElement.querySelector('.w-3');
    const statusText = statusElement.querySelector('span');
    
    if (isOnline) {
      statusDot.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
      statusText.textContent = 'Sistem Online';
      showToast('Koneksi internet tersambung', false, 'success');
    } else {
      statusDot.className = 'w-3 h-3 bg-red-500 rounded-full';
      statusText.textContent = 'Sistem Offline';
      showToast('Koneksi internet terputus', true, 'warning');
    }
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  // Update responsive layouts
  const breakpoint = getBreakpoint();
  console.log(`📱 Screen resized: ${breakpoint}`);
  
  // Trigger custom event for other modules
  window.dispatchEvent(new CustomEvent('app:resize', { 
    detail: { breakpoint, width: window.innerWidth, height: window.innerHeight } 
  }));
}

/**
 * Handle before unload
 */
function handleBeforeUnload() {
  // Save current state to localStorage
  localStorage.setItem('kapasda_last_tab', appState.currentTab);
  localStorage.setItem('kapasda_last_visit', new Date().toISOString());
}

/**
 * Handle visibility change
 */
function handleVisibilityChange() {
  if (document.hidden) {
    console.log('📱 App hidden');
    // Pause animations, timers, etc.
  } else {
    console.log('📱 App visible');
    // Resume animations, timers, etc.
  }
}

/**
 * Add tab change listener
 */
export function addTabListener(callback) {
  tabListeners.add(callback);
}

/**
 * Remove tab change listener
 */
export function removeTabListener(callback) {
  tabListeners.delete(callback);
}

/**
 * Get current application state
 */
export function getAppState() {
  return { ...appState };
}

/**
 * Update application state
 */
export function updateAppState(updates) {
  Object.assign(appState, updates);
  
  // Trigger state change event
  window.dispatchEvent(new CustomEvent('app:statechange', { 
    detail: { state: { ...appState } } 
  }));
}

/**
 * Create modal dialog (imported from utils)
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

/**
 * Get responsive breakpoint
 */
function getBreakpoint() {
  const width = window.innerWidth;
  if (width <= 640) return 'sm';
  if (width <= 768) return 'md';
  if (width <= 1024) return 'lg';
  if (width <= 1280) return 'xl';
  return '2xl';
}

/**
 * Performance monitoring
 */
export function logPerformance(metric, value) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ Performance: ${metric} = ${value}ms`);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', 'performance_metric', {
      metric_name: metric,
      metric_value: value
    });
  }
}

/**
 * Error boundary for async operations
 */
export async function withErrorBoundary(operation, fallback = null) {
  try {
    return await operation();
  } catch (error) {
    console.error('❌ Operation failed:', error);
    showToast(handleApiError(error), true, 'error');
    
    if (fallback && typeof fallback === 'function') {
      return await fallback(error);
    }
    
    throw error;
  }
}