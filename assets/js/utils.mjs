export function showToast(message, error = false) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMessage');
  msg.textContent = message;
  toast.className = `fixed bottom-6 right-6 max-w-sm px-8 py-4 rounded-xl shadow-2xl text-lg font-medium text-white transform transition-all duration-500 z-50 ${
    error ? 'bg-red-600' : 'bg-green-600'
  }`;
  toast.classList.remove('translate-y-32', 'opacity-0');
  setTimeout(() => toast.classList.add('translate-y-32', 'opacity-0'), 4000);
}

export function formatNumber(num) {
  if (!num) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}