// assets/js/utils.mjs

/**
 * Menampilkan toast notification
 * @param {string} message - Pesan yang ditampilkan
 * @param {boolean} error - true = merah, false = hijau (default: false)
 * @param {number} duration - Durasi dalam ms (default: 4000)
 */
export function showToast(message, error = false, duration = 4000) {
  // Hapus toast lama jika ada
  const oldToast = document.getElementById('toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = `
    fixed bottom-6 right-6 max-w-sm px-8 py-4 rounded-xl shadow-2xl text-white text-lg font-medium
    transform transition-all duration-500 z-50
    ${error ? 'bg-red-600' : 'bg-green-600'}
  `;
  toast.innerHTML = `<span id="toastMessage">${message}</span>`;

  document.body.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-32', 'opacity-0');
  });

  // Otomatis hilang
  setTimeout(() => {
    toast.classList.add('translate-y-32', 'opacity-0');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

/**
 * Format angka dengan pemisah ribuan (Indonesia)
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '-';
  return Number(num).toLocaleString('id-ID');
}

/**
 * Format tanggal ISO ke format Indonesia
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Debounce function — mencegah fungsi dipanggil terlalu sering (misal saat input real-time)
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}