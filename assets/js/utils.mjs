export function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMessage');
  m.textContent = msg;
  t.className = `fixed bottom-6 right-6 px-8 py-4 rounded-xl shadow-2xl text-white text-lg font-medium transform transition-all duration-500 z-50 ${error ? 'bg-red-600' : 'bg-green-600'}`;
  t.classList.remove('translate-y-32','opacity-0');
  setTimeout(() => t.classList.add('translate-y-32','opacity-0'), 4000);
}