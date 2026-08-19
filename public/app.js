let currentLang = localStorage.getItem('app_lang') || 'zh';
let translations = {};
let selectedProvider = 'all';

// 預設的三大模型備用資料
const defaultProducts = [
  {
    modelId: 'gpt-5.4',
    provider: 'openai',
    name: 'gpt-5.4',
    logo: '/images/openai.jpeg',
    inputPrice: '$2.2500 / 1M Tokens',
    outputPrice: '$13.5000 / 1M Tokens',
    tag: 'Pay as you go'
  },
  {
    modelId: 'deepseek-v3',
    provider: 'deepseek',
    name: 'deepseek-chat (V3)',
    logo: '/images/deepseek.jpeg',
    inputPrice: '$0.1400 / 1M Tokens',
    outputPrice: '$0.2800 / 1M Tokens',
    tag: 'Pay as you go'
  },
  {
    modelId: 'claude-opus-4-6',
    provider: 'claude',
    name: 'claude-opus-4-6',
    logo: '/images/claude.jpeg',
    inputPrice: '$4.5000 / 1M Tokens',
    outputPrice: '$22.5000 / 1M Tokens',
    tag: 'Pay as you go'
  }
];

let products = [...defaultProducts];

document.addEventListener('DOMContentLoaded', async () => {
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = currentLang;

  // 1. 載入字典檔並套用語言
  try {
    const res = await fetch('/lang.json');
    translations = await res.json();
    applyLanguage(currentLang);
  } catch (err) {
    console.error('無法載入 lang.json', err);
  }

  // 2. 載入商品（若存在 productGrid）
  if (document.getElementById('productGrid')) {
    await loadProductsFromAPI();
  }
});

// 切換語言
function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('app_lang', lang);
  applyLanguage(lang);
  if (document.getElementById('productGrid')) {
    renderProducts();
  }
}

function applyLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.innerText = translations[lang][key];
    }
  });
}

// 讀取後端 API 商品
async function loadProductsFromAPI() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && data.products && data.products.length > 0) {
      products = data.products;
    } else {
      products = [...defaultProducts];
    }
  } catch (err) {
    console.warn('後端 API 讀取失敗（可能使用 Live Server 中），改載入預設商品');
    products = [...defaultProducts];
  }
  renderProducts();
}

// 分類篩選
function filterProvider(provider) {
  selectedProvider = provider;
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }

  renderProducts();
}

// 渲染商品列表
function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const filtered = selectedProvider === 'all' 
    ? products 
    : products.filter(p => p.provider === selectedProvider);

  const countEl = document.getElementById('vendorCount');
  if (countEl) countEl.innerText = `${filtered.length} models`;

  const buyText = (translations[currentLang] && translations[currentLang]['buy_btn']) 
    ? translations[currentLang]['buy_btn'] 
    : (currentLang === 'zh' ? '購買' : 'Buy');

  grid.innerHTML = filtered.map(p => `
    <div class="model-card">
      <div class="card-header">
        <div class="model-title">
          <img src="${p.logo}" alt="${p.provider}" class="model-logo" onerror="this.src='https://via.placeholder.com/28'">
          <h3>${p.name}</h3>
        </div>
        <button class="buy-btn" onclick="simulateCheckout('${p.modelId || p.id}')">${buyText}</button>
      </div>
      <div class="card-body">
        <p><strong>Input Price:</strong> ${p.inputPrice}</p>
        <p><strong>Output Price:</strong> ${p.outputPrice}</p>
      </div>
      <div class="card-footer">
        <span class="badge">${p.tag || 'Pay as you go'}</span>
      </div>
    </div>
  `).join('');
}

// 結帳模擬
async function simulateCheckout(modelId) {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'alipay', totalAmount: 100 })
    });
    const data = await res.json();
    if (data.success) {
      alert(`已選擇模型 ${modelId}！`);
      const container = document.getElementById('qrCodeContainer');
      if (container) {
        container.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; border: 1px solid #e2e8f0;">
            <p style="margin-top:0;">請掃描下方 QR Code 充值 100 USD 額度：</p>
            <img src="${data.qrCodeUrl}" alt="QR Code" style="border: 1px solid #ccc; padding: 5px; border-radius: 8px;" />
          </div>
        `;
      }
    }
  } catch (err) {
    alert('請確認 Docker / 後端伺服器運行於 http://localhost:3000！');
  }
}

// 統一動態渲染導覽列與權限狀態
function renderNavbar() {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const token = localStorage.getItem('user_token');
  const role = localStorage.getItem('user_role');

  // 根據登入狀態決定是否顯示「個人紀錄」與「後台管理」
  const profileLink = token ? `<a href="profile.html">個人紀錄</a>` : '';
  const adminLink = (token && role === 'admin') ? `<a href="admin.html" style="color: #f59e0b; font-weight: bold;">後台管理</a>` : '';
  
  // 依據是否登入切換右側按鈕（登入按鈕 vs 登出按鈕）
  const authAction = token 
    ? `<button onclick="logout()" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">登出</button>`
    : `<a href="login.html" style="background: #2563eb; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none;">登入 / 註冊</a>`;

  placeholder.innerHTML = `
    <nav class="navbar">
      <div class="logo">AXG 購物網</div>
      <div class="nav-links">
        <a href="index.html">首頁</a>
        <a href="marketplace.html">商城</a>
        <a href="about.html">關於我們</a>
        ${profileLink}
        ${adminLink}
      </div>
      <div class="actions">
        <select id="langSelect" onchange="changeLanguage(this.value)">
          <option value="zh">繁體中文</option>
          <option value="en">English</option>
        </select>
        ${authAction}
      </div>
    </nav>
  `;

  // 保持原本語言下拉選單的選中狀態
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = currentLang;
}

// 簡易全域登出函數
function logout() {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_role');
  alert('已成功登出！');
  window.location.href = 'index.html';
}

// 在網頁載入時執行渲染
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('user_token');
  const role = localStorage.getItem('user_role');

  // 如果有登入 (有 token)，就顯示「個人紀錄」
  if (token) {
    const navProfile = document.getElementById('nav-profile');
    if (navProfile) navProfile.style.display = 'inline-block';
    
    // 如果角色是 admin，才顯示「後台管理」
    if (role === 'admin') {
      const navAdmin = document.getElementById('nav-admin');
      if (navAdmin) navAdmin.style.display = 'inline-block';
    }
  }
});