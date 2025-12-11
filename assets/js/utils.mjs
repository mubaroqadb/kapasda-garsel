// Modern utility functions for KAPASDA application

/**
 * Enhanced toast notification system
 * @param {string} message - Message to display
 * @param {boolean} error - true = red, false = green (default: false)
 * @param {number} duration - Duration in ms (default: 4000)
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info'
 */
export function showToast(message, error = false, duration = 4000, type = null) {
  // Remove existing toast
  const existingToast = document.getElementById('toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  
  // Determine toast type and styling
  let toastClass = 'fixed bottom-6 right-6 max-w-sm px-8 py-4 rounded-xl shadow-2xl text-white text-lg font-medium transform transition-all duration-500 z-50 flex items-center gap-3';
  let iconClass = '';
  
  if (type || error) {
    switch (type || (error ? 'error' : 'success')) {
      case 'error':
        toastClass += ' bg-gradient-to-r from-red-600 to-red-700';
        iconClass = 'fas fa-exclamation-circle';
        break;
      case 'warning':
        toastClass += ' bg-gradient-to-r from-yellow-600 to-yellow-700';
        iconClass = 'fas fa-exclamation-triangle';
        break;
      case 'info':
        toastClass += ' bg-gradient-to-r from-blue-600 to-blue-700';
        iconClass = 'fas fa-info-circle';
        break;
      case 'success':
      default:
        toastClass += ' bg-gradient-to-r from-green-600 to-green-700';
        iconClass = 'fas fa-check-circle';
        break;
    }
  } else {
    toastClass += ' bg-gradient-to-r from-green-600 to-green-700';
    iconClass = 'fas fa-check-circle';
  }

  toast.className = toastClass;
  toast.innerHTML = `
    <i id="toastIcon" class="${iconClass}"></i>
    <span id="toastMessage">${message}</span>
    <button class="ml-4 text-white/70 hover:text-white" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-32', 'opacity-0');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.add('translate-y-32', 'opacity-0');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

/**
 * Format number with Indonesian thousand separators
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '-';
  return Number(num).toLocaleString('id-ID');
}

/**
 * Format date from ISO to Indonesian format
 * @param {string} isoString
 * @param {Object} options - Formatting options
 * @returns {string}
 */
export function formatDate(isoString, options = {}) {
  if (!isoString) return '-';
  
  const date = new Date(isoString);
  const defaultOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleString('id-ID', { ...defaultOptions, ...options });
}

/**
 * Enhanced debounce function with immediate option
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 * @returns {Function}
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate Indonesian phone number
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const re = /^(\+62|62)?[\s-]?0?8[1-9][0-9]{6,9}$/;
  return re.test(phone);
}

/**
 * Generate random ID
 * @param {number} length
 * @returns {string}
 */
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Deep clone object
 * @param {Object} obj
 * @returns {Object}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
}

/**
 * Check if object is empty
 * @param {Object} obj
 * @returns {boolean}
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * Capitalize first letter of string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string with ellipsis
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export function truncate(str, length = 50) {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Create loading skeleton
 * @param {number} count
 * @param {string} type - 'text', 'title', 'button', 'card'
 * @returns {string}
 */
export function createSkeleton(count = 1, type = 'text') {
  const skeletons = [];
  
  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'title':
        skeletons.push('<div class="skeleton skeleton-title"></div>');
        break;
      case 'button':
        skeletons.push('<div class="skeleton skeleton-button"></div>');
        break;
      case 'card':
        skeletons.push(`
          <div class="bg-white rounded-lg shadow-md p-4">
            <div class="skeleton skeleton-title mb-4"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text w-3/4"></div>
          </div>
        `);
        break;
      default:
        skeletons.push('<div class="skeleton skeleton-text"></div>');
    }
  }
  
  return skeletons.join('');
}

/**
 * Show loading overlay
 * @param {string} message
 */
export function showLoading(message = 'Memuat data...') {
  const existing = document.getElementById('loading');
  if (existing) return;
  
  const loading = document.createElement('div');
  loading.id = 'loading';
  loading.className = 'loading-overlay';
  loading.innerHTML = `
    <div class="text-center">
      <div class="relative inline-block">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
        <div class="absolute inset-0 rounded-full border-4 border-blue-200 opacity-30 animate-ping"></div>
      </div>
      <p class="text-xl font-bold text-gray-800 mt-4">${message}</p>
      <p class="text-sm text-gray-600 mt-2">Mohon tunggu sebentar</p>
    </div>
  `;
  
  document.body.appendChild(loading);
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    loading.addEventListener('transitionend', () => loading.remove());
  }
}

/**
 * Handle API errors with user-friendly messages
 * @param {Error} error
 * @param {string} customMessage
 * @returns {string}
 */
export function handleApiError(error, customMessage = null) {
  console.error('API Error:', error);
  
  if (customMessage) return customMessage;
  
  // Common error patterns
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
  }
  
  if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.';
  }
  
  if (error.message?.includes('permission') || error.message?.includes('forbidden')) {
    return 'Anda tidak memiliki izin untuk melakukan aksi ini.';
  }
  
  if (error.message?.includes('not found')) {
    return 'Data tidak ditemukan.';
  }
  
  return error.message || 'Terjadi kesalahan yang tidak diketahui.';
}

/**
 * Create pagination controls
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {Function} onPageChange
 * @returns {string}
 */
export function createPagination(currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) return '';
  
  let pagination = '<div class="pagination">';
  
  // Previous button
  pagination += `
    <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
            onclick="${currentPage > 1 ? `onPageChange(${currentPage - 1})` : ''}">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pagination += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
              onclick="onPageChange(${i})">
        ${i}
      </button>
    `;
  }
  
  // Next button
  pagination += `
    <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
            onclick="${currentPage < totalPages ? `onPageChange(${currentPage + 1})` : ''}">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  pagination += '</div>';
  
  return pagination;
}

/**
 * Export data to CSV
 * @param {Array} data
 * @param {string} filename
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    showToast('Tidak ada data untuk diekspor', true, 'warning');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  showToast('Data berhasil diekspor ke CSV', false, 'success');
}

/**
 * Check if device is mobile
 * @returns {boolean}
 */
export function isMobile() {
  return window.innerWidth <= 768;
}

/**
 * Check if device is tablet
 * @returns {boolean}
 */
export function isTablet() {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
}

/**
 * Check if device is desktop
 * @returns {boolean}
 */
export function isDesktop() {
  return window.innerWidth > 1024;
}

/**
 * Get responsive breakpoint
 * @returns {string}
 */
export function getBreakpoint() {
  const width = window.innerWidth;
  if (width <= 640) return 'sm';
  if (width <= 768) return 'md';
  if (width <= 1024) return 'lg';
  if (width <= 1280) return 'xl';
  return '2xl';
}

/**
 * Add accessibility attributes to element
 * @param {HTMLElement} element
 * @param {Object} attrs
 */
export function addAccessibility(element, attrs) {
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

/**
 * Create modal dialog
 * @param {string} title
 * @param {string} content
 * @param {Object} options
 * @returns {HTMLElement}
 */
export function createModal(title, content, options = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
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
 * Validate form with modern HTML5 validation
 * @param {HTMLFormElement} form
 * @returns {Object}
 */
export function validateForm(form) {
  const errors = {};
  const formData = new FormData(form);
  
  // Check HTML5 validation
  if (!form.checkValidity()) {
    form.querySelectorAll(':invalid').forEach(field => {
      errors[field.name] = field.validationMessage || 'Field ini wajib diisi';
    });
  }
  
  // Custom validation rules
  const customRules = {
    email: (value) => !value || isValidEmail(value) ? null : 'Format email tidak valid',
    phone: (value) => !value || isValidPhone(value) ? null : 'Format nomor telepon tidak valid',
    required: (value) => value ? null : 'Field ini wajib diisi'
  };
  
  // Apply custom rules based on data attributes
  form.querySelectorAll('[data-validate]').forEach(field => {
    const rule = field.dataset.validate;
    const value = field.value.trim();
    
    if (customRules[rule]) {
      const error = customRules[rule](value);
      if (error) errors[field.name] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Show form validation errors
 * @param {HTMLFormElement} form
 * @param {Object} errors
 */
export function showFormErrors(form, errors) {
  // Clear existing errors
  form.querySelectorAll('.form-error').forEach(el => el.remove());
  
  // Show new errors
  Object.entries(errors).forEach(([fieldName, message]) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      const errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
      field.parentNode.appendChild(errorEl);
      field.classList.add('border-red-300');
    }
  });
}

/**
 * Clear form validation errors
 * @param {HTMLFormElement} form
 */
export function clearFormErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => el.remove());
  form.querySelectorAll('.border-red-300').forEach(el => {
    el.classList.remove('border-red-300');
  });
}