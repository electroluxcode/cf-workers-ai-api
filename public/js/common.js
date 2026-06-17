const TOKEN_KEY = 'cf-workers-ai-api-token';

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'alert');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function tokenInputs() {
  return document.querySelectorAll('[data-token-input]');
}

export function getApiKey() {
  for (const input of tokenInputs()) {
    const v = input.value.trim();
    if (v) return v;
  }
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function initTokenField() {
  const inputs = tokenInputs();
  if (!inputs.length) return;

  const saved = localStorage.getItem(TOKEN_KEY) || '';

  const syncAll = (source) => {
    const v = source.value;
    inputs.forEach((input) => {
      if (input !== source) input.value = v;
    });
    const trimmed = v.trim();
    if (trimmed) localStorage.setItem(TOKEN_KEY, trimmed);
    else localStorage.removeItem(TOKEN_KEY);
  };

  inputs.forEach((input) => {
    input.value = saved;
    input.addEventListener('input', () => syncAll(input));
    input.addEventListener('change', () => syncAll(input));
  });
}

/** 部署在子路径（如 example.com/api/）时也能正确解析 API 根地址 */
function deployRoot() {
  const p = window.location.pathname;
  if (p === '/' || p.endsWith('/index.html')) {
    return p.replace(/index\.html$/, '').replace(/\/$/, '') || '';
  }
  if (p.endsWith('/')) return p.slice(0, -1);
  const slash = p.lastIndexOf('/');
  return slash > 0 ? p.slice(0, slash) : '';
}

export function apiBase() {
  const node = document.getElementById('workerUrl');
  if (node) {
    const v = node.value.replace(/\/$/, '');
    if (v && v !== 'YOUR_WORKER_URL') return v;
  }
  const root = deployRoot();
  return window.location.origin + root;
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return apiBase() + p;
}

export function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobileMenu');
  const close = document.querySelector('.menu-close');
  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  };
  const shut = () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  toggle.addEventListener('click', open);
  close?.addEventListener('click', shut);
  menu.querySelectorAll('.mobile-nav a').forEach((a) => a.addEventListener('click', shut));
}

export function initShell() {
  initTokenField();
  initMobileMenu();
}
