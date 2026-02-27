import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ═══════════════════════════════════════════════════════
// Identity Connect — Main Application
// Version: V3.0 | Micro Connect Platform
// ═══════════════════════════════════════════════════════

const app = new Hono()
app.use('/api/*', cors())

// ─── JWT Helpers (Demo — using Web APIs for Cloudflare Workers) ───
const JWT_SECRET = 'micro-connect-demo-secret-2026'

function toBase64Url(str: string): string {
  // Encode to UTF-8 bytes first, then base64 — works with non-ASCII
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - b64.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function createJWT(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = toBase64Url(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 }))
  const sig = toBase64Url(JWT_SECRET + header + body) // Demo: simplified signature
  return `${header}.${body}.${sig}`
}

function parseJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(fromBase64Url(parts[1]))
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch { return null }
}

// ─── Mock Data Store (In-Memory for Demo) ───
interface User {
  id: string; phone?: string; email?: string; name: string; password?: string;
  avatar?: string; identities: Identity[]; entities: EntityAuth[]; createdAt: string;
}
type IdentityRole = 'initiator' | 'participant' | 'organization'
interface Identity { role: IdentityRole; unlockedAt: string; status: 'active' | 'pending' | 'suspended' }
interface EntityAuth { entityId: string; entityName: string; role: string; verifiedAt: string }

const users: User[] = [
  {
    id: 'u-001', phone: '13800001234', name: '张三',
    identities: [
      { role: 'initiator', unlockedAt: '2026-01-15', status: 'active' },
      { role: 'participant', unlockedAt: '2026-02-01', status: 'active' }
    ],
    entities: [{ entityId: 'e-001', entityName: 'ABC 餐饮连锁', role: '法人代表', verifiedAt: '2026-01-20' }],
    createdAt: '2026-01-10'
  },
  {
    id: 'u-002', email: 'investor@fund.com', name: '李四', password: 'demo123',
    identities: [
      { role: 'participant', unlockedAt: '2026-01-08', status: 'active' },
      { role: 'organization', unlockedAt: '2026-01-10', status: 'active' }
    ],
    entities: [{ entityId: 'e-010', entityName: '新锐资本', role: '投资总监', verifiedAt: '2026-01-12' }],
    createdAt: '2026-01-05'
  },
  {
    id: 'u-003', phone: '13900005678', name: '王五',
    identities: [{ role: 'initiator', unlockedAt: '2026-02-20', status: 'active' }],
    entities: [], createdAt: '2026-02-18'
  }
]

function findUser(phone?: string, email?: string): User | undefined {
  if (phone) return users.find(u => u.phone === phone)
  if (email) return users.find(u => u.email === email)
  return undefined
}
function findUserById(id: string): User | undefined {
  return users.find(u => u.id === id)
}
function getUserFromToken(authHeader: string | undefined): User | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const payload = parseJWT(authHeader.slice(7))
  if (!payload?.userId) return null
  return findUserById(payload.userId as string) || null
}

// ═══════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════

// POST /api/auth/verify-code
app.post('/api/auth/verify-code', async (c) => {
  const { phone } = await c.req.json()
  if (!phone) return c.json({ success: false, message: '请提供手机号' }, 400)
  return c.json({ success: true, message: '验证码已发送' })
})

// POST /api/auth/register
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json()
  const { phone, email, verifyCode, password, name } = body
  if (!name) return c.json({ success: false, message: '请提供姓名' }, 400)
  if (phone && verifyCode !== '123456') return c.json({ success: false, message: '验证码错误' }, 400)
  if (findUser(phone, email)) return c.json({ success: false, message: '该账号已注册，请直接登录' }, 400)

  const newUser: User = {
    id: `u-${String(Date.now()).slice(-6)}`,
    ...(phone ? { phone } : {}),
    ...(email ? { email, password } : {}),
    name, identities: [], entities: [],
    createdAt: new Date().toISOString().split('T')[0]
  }
  users.push(newUser)
  const token = createJWT({ userId: newUser.id, name: newUser.name })
  return c.json({ success: true, token, user: { ...newUser, password: undefined } })
})

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  const { phone, email, verifyCode, password } = body
  if (phone && verifyCode !== '123456') return c.json({ success: false, message: '验证码错误' }, 400)
  const user = findUser(phone, email)
  if (!user) return c.json({ success: false, message: '用户不存在，请先注册' }, 404)
  if (email && password && user.password && user.password !== password)
    return c.json({ success: false, message: '密码错误' }, 401)
  const token = createJWT({ userId: user.id, name: user.name })
  return c.json({ success: true, token, user: { ...user, password: undefined } })
})

// GET /api/user/profile
app.get('/api/user/profile', (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, user: { ...user, password: undefined } })
})

// POST /api/user/unlock
app.post('/api/user/unlock', async (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  const { role } = await c.req.json()
  if (!['initiator', 'participant', 'organization'].includes(role))
    return c.json({ success: false, message: '无效的身份类型' }, 400)
  if (user.identities.find(i => i.role === role))
    return c.json({ success: false, message: '该身份已解锁' }, 400)
  const identity: Identity = { role, unlockedAt: new Date().toISOString().split('T')[0], status: 'active' }
  user.identities.push(identity)
  return c.json({ success: true, identity })
})

// POST /api/entity/verify
app.post('/api/entity/verify', async (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  const { entityName, creditCode, role } = await c.req.json()
  if (!entityName || !role) return c.json({ success: false, message: '请填写完整信息' }, 400)
  const entity: EntityAuth = {
    entityId: `e-${String(Date.now()).slice(-6)}`,
    entityName, role,
    verifiedAt: new Date().toISOString().split('T')[0]
  }
  user.entities.push(entity)
  return c.json({ success: true, entity })
})

// GET /api/entity/list
app.get('/api/entity/list', (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, entities: user.entities })
})


// ═══════════════════════════════════════════
// Shared HTML Components
// ═══════════════════════════════════════════

const SVG_LOGO = `<svg width="32" height="32" viewBox="0 0 80 80"><defs><linearGradient id="gt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gt)"/><circle cx="36" cy="44" r="22" fill="url(#gb)" opacity="0.85"/></svg>`

function getNavbar(lang: string, loggedIn: boolean): string {
  const t = (zh: string, en: string) => lang === 'en' ? en : zh
  const langToggle = lang === 'en' ? 'zh' : 'en'
  const langLabel = lang === 'en' ? '中' : 'EN'
  return `
  <nav class="navbar" id="navbar">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;">
        <a href="/" style="display:flex;align-items:center;gap:8px;text-decoration:none;">
          ${SVG_LOGO}
          <span class="font-brand" style="font-weight:700;font-size:14px;color:var(--text-primary);letter-spacing:0.5px;">MICRO CONNECT</span>
          <span style="font-size:12px;color:var(--text-tertiary);">滴灌通</span>
        </a>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;font-weight:600;color:var(--identity);">
          <i class="fas fa-id-card" style="margin-right:4px;"></i>
          ${t('身份通', 'Identity Connect')}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <a href="?lang=${langToggle}" class="btn-ghost" style="font-size:12px;padding:6px 12px;">${langLabel}</a>
        ${loggedIn ? `
          <span id="nav-username" style="font-size:13px;color:var(--text-secondary);"></span>
          <button onclick="doLogout()" class="btn-ghost" style="font-size:12px;padding:6px 12px;color:var(--semantic-error);border-color:rgba(255,55,95,0.2);">
            <i class="fas fa-sign-out-alt" style="margin-right:4px;"></i>${t('退出登录', 'Logout')}
          </button>
        ` : `
          <a href="https://microconnect.com" class="btn-ghost" style="font-size:12px;padding:6px 12px;">
            ${t('返回主站', 'Back to Main')}
          </a>
        `}
      </div>
    </div>
  </nav>`
}

function getFooter(lang: string): string {
  const t = (zh: string, en: string) => lang === 'en' ? en : zh
  return `
  <footer class="footer-aurora" style="padding:48px 24px 32px;margin-top:64px;">
    <div style="max-width:1200px;margin:0 auto;text-align:center;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;">
        ${SVG_LOGO}
        <span class="font-brand" style="color:white;font-weight:700;font-size:15px;letter-spacing:0.5px;">MICRO CONNECT</span>
        <span style="color:rgba(255,255,255,0.5);font-size:13px;">|</span>
        <span style="color:rgba(255,255,255,0.7);font-size:13px;">
          <i class="fas fa-id-card" style="margin-right:4px;color:var(--identity);"></i>
          ${t('身份通 Identity Connect', 'Identity Connect')}
        </span>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:20px;">
        <a href="https://microconnect.com" style="color:rgba(255,255,255,0.5);font-size:12px;text-decoration:none;transition:color 0.2s;">
          ${t('返回主站', 'Back to Main Site')}
        </a>
        <a href="#" style="color:rgba(255,255,255,0.5);font-size:12px;text-decoration:none;">
          ${t('隐私政策', 'Privacy Policy')}
        </a>
        <a href="#" style="color:rgba(255,255,255,0.5);font-size:12px;text-decoration:none;">
          ${t('服务条款', 'Terms of Service')}
        </a>
      </div>
      <p style="color:rgba(255,255,255,0.35);font-size:11px;">
        ${t('© 2026 Micro Connect Group. 保留所有权利。', '© 2026 Micro Connect Group. All rights reserved.')}
      </p>
    </div>
  </footer>`
}

function htmlShell(title: string, body: string, lang: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@600;700;800&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['-apple-system','BlinkMacSystemFont','Inter','SF Pro Display','Segoe UI','Roboto','Noto Sans SC','sans-serif'],
          display: ['-apple-system','BlinkMacSystemFont','Inter','SF Pro Display','Segoe UI','sans-serif'],
          mono: ['Montserrat','Inter','Futura','Helvetica Neue','sans-serif']
        },
        colors: {
          brand: { DEFAULT:'#5DC4B3', light:'#7DD4C7', dark:'#3D8F83', accent:'#49A89A' },
          logo: { bright:'#2EC4B6', bright2:'#3DD8CA', deep:'#28A696' },
          identity: { light:'#DBEAFE', DEFAULT:'#3B82F6', dark:'#2563EB' },
          semantic: { info:'#32ade6', success:'#34c759', warning:'#ff9f0a', error:'#ff375f' },
          text: { primary:'#1d1d1f', title:'#1a1a1a', secondary:'#6e6e73', tertiary:'#86868b', placeholder:'#aeaeb2' },
          surface: { page:'#f5f5f7', card:'rgba(255,255,255,0.88)', divider:'#f1f5f9' }
        },
        borderRadius: { xs:'4px', sm:'8px', md:'12px', lg:'16px', xl:'20px', '2xl':'24px', '3xl':'32px' }
      }
    }
  }
  </script>
  <link href="/static/style.css" rel="stylesheet">
</head>
<body style="background:var(--bg-page);min-height:100vh;">
  <div id="toast" class="toast"></div>
  ${body}
  <script>
  // ─── Shared Utilities ───
  function showToast(msg, type='info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
    setTimeout(() => { t.classList.remove('show'); }, 3000);
  }
  function getToken() { return localStorage.getItem('ic_token'); }
  function getUser() { try { return JSON.parse(localStorage.getItem('ic_user') || 'null'); } catch { return null; } }
  function setAuth(token, user) { localStorage.setItem('ic_token', token); localStorage.setItem('ic_user', JSON.stringify(user)); }
  function clearAuth() { localStorage.removeItem('ic_token'); localStorage.removeItem('ic_user'); }
  function doLogout() { clearAuth(); window.location.href = '/'; }
  function getLang() { return new URLSearchParams(window.location.search).get('lang') || 'zh'; }
  async function api(path, opts={}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) };
    const res = await fetch(path, { ...opts, headers: { ...headers, ...opts.headers } });
    return res.json();
  }
  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
  });
  // Scroll reveal
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); }
      }, { threshold: 0.15 }).observe(el);
    });
    // Set nav username
    const u = getUser();
    const el = document.getElementById('nav-username');
    if (el && u) el.textContent = u.name;
  });
  </script>
</body>
</html>`
}


// ═══════════════════════════════════════════
// Page 1: Login/Register (/)
// ═══════════════════════════════════════════
app.get('/', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = (zh: string, en: string) => lang === 'en' ? en : zh

  const body = `
  ${getNavbar(lang, false)}

  <main style="max-width:480px;margin:0 auto;padding:40px 20px 0;">
    <!-- Hero -->
    <div class="reveal" style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg, #DBEAFE 0%, rgba(59,130,246,0.15) 100%);margin-bottom:20px;">
        ${SVG_LOGO.replace('width="32" height="32"', 'width="40" height="40"')}
      </div>
      <h1 style="font-size:28px;font-weight:700;color:var(--text-title);margin-bottom:8px;letter-spacing:-0.3px;">
        ${t('欢迎来到滴灌通', 'Welcome to Micro Connect')}
      </h1>
      <p style="font-size:15px;color:var(--text-secondary);margin-bottom:12px;">
        ${t('收入分成投资的基础设施级平台', 'Infrastructure-Grade RBF Investment Platform')}
      </p>
      <p style="font-size:13px;color:var(--text-tertiary);background:rgba(219,234,254,0.4);display:inline-block;padding:6px 16px;border-radius:20px;">
        ${t('📚 办借书证 — 选择你的身份，开启投融资之旅', '📚 Get your library card — Choose your identity, start your journey')}
      </p>
    </div>

    <!-- Login/Register Card -->
    <div class="card-hover reveal stagger-1" style="padding:32px 28px;">
      <!-- Tabs -->
      <div style="display:flex;border-bottom:1px solid var(--bg-divider);margin-bottom:24px;">
        <button class="tab-btn active" onclick="switchTab('phone')" id="tab-phone">
          <i class="fas fa-mobile-alt" style="margin-right:6px;"></i>${t('手机号登录', 'Phone Login')}
        </button>
        <button class="tab-btn" onclick="switchTab('email')" id="tab-email">
          <i class="fas fa-envelope" style="margin-right:6px;"></i>${t('邮箱登录', 'Email Login')}
        </button>
      </div>

      <!-- Phone Form -->
      <div id="form-phone">
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input type="tel" id="inp-phone" class="input-field" placeholder="${t('请输入手机号', 'Enter phone number')}" style="flex:1;">
          <button class="verify-code-btn" onclick="sendCode()" id="btn-code">
            ${t('获取验证码', 'Get Code')}
          </button>
        </div>
        <input type="text" id="inp-code" class="input-field" placeholder="${t('请输入验证码 (Demo: 123456)', 'Enter code (Demo: 123456)')}" style="margin-bottom:14px;" maxlength="6">
      </div>

      <!-- Email Form (hidden) -->
      <div id="form-email" style="display:none;">
        <input type="email" id="inp-email" class="input-field" placeholder="${t('请输入邮箱', 'Enter email')}" style="margin-bottom:14px;">
        <input type="password" id="inp-password" class="input-field" placeholder="${t('请输入密码', 'Enter password')}" style="margin-bottom:14px;">
      </div>

      <!-- Name (for register mode) -->
      <div id="name-field" style="display:none;">
        <input type="text" id="inp-name" class="input-field" placeholder="${t('请输入姓名', 'Enter your name')}" style="margin-bottom:14px;">
      </div>

      <!-- Submit -->
      <button class="btn-primary" style="width:100%;margin-bottom:16px;" onclick="doSubmit()" id="btn-submit">
        ${t('登录', 'Login')}
      </button>

      <!-- Toggle -->
      <p style="text-align:center;font-size:13px;color:var(--text-tertiary);">
        <span id="toggle-text">${t('没有账号？', "Don't have an account? ")}</span>
        <a href="#" onclick="toggleMode(event)" style="color:var(--identity);text-decoration:none;font-weight:500;" id="toggle-link">
          ${t('点此注册', 'Register')}
        </a>
      </p>
    </div>

    <!-- Demo Hint -->
    <div class="reveal stagger-2" style="margin-top:20px;padding:16px 20px;background:rgba(219,234,254,0.3);border-radius:12px;border:1px solid rgba(59,130,246,0.1);">
      <p style="font-size:12px;color:var(--text-tertiary);line-height:1.6;">
        <i class="fas fa-info-circle" style="color:var(--identity);margin-right:4px;"></i>
        <strong>Demo ${t('提示', 'Hint')}</strong><br>
        ${t(
          '验证码固定为 123456。已有测试账号：手机号 13800001234（张三）、邮箱 investor@fund.com / 密码 demo123（李四）',
          'Verification code is always 123456. Test accounts: Phone 13800001234 (Zhang San), Email investor@fund.com / password demo123 (Li Si)'
        )}
      </p>
    </div>
  </main>

  ${getFooter(lang)}

  <script>
  // ─── Auth Page Logic ───
  let currentTab = 'phone';
  let isRegister = false;
  let countdown = 0;

  (function() {
    if (getToken() && getUser()) { window.location.href = '/dashboard' + window.location.search; return; }
  })();

  function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-phone').classList.toggle('active', tab === 'phone');
    document.getElementById('tab-email').classList.toggle('active', tab === 'email');
    document.getElementById('form-phone').style.display = tab === 'phone' ? 'block' : 'none';
    document.getElementById('form-email').style.display = tab === 'email' ? 'block' : 'none';
  }

  function toggleMode(e) {
    e.preventDefault();
    isRegister = !isRegister;
    const lang = getLang();
    document.getElementById('name-field').style.display = isRegister ? 'block' : 'none';
    document.getElementById('btn-submit').textContent = isRegister
      ? (lang==='en' ? 'Register' : '注册')
      : (lang==='en' ? 'Login' : '登录');
    document.getElementById('toggle-text').textContent = isRegister
      ? (lang==='en' ? 'Already have an account? ' : '已有账号？')
      : (lang==='en' ? "Don't have an account? " : '没有账号？');
    document.getElementById('toggle-link').textContent = isRegister
      ? (lang==='en' ? 'Login' : '点此登录')
      : (lang==='en' ? 'Register' : '点此注册');
  }

  function sendCode() {
    const phone = document.getElementById('inp-phone').value.trim();
    if (!phone) { showToast('${t('请输入手机号', 'Please enter phone number')}', 'error'); return; }
    api('/api/auth/verify-code', { method:'POST', body: JSON.stringify({ phone }) })
      .then(r => {
        if (r.success) {
          showToast('${t('验证码已发送 (Demo: 123456)', 'Code sent (Demo: 123456)')}', 'success');
          startCountdown();
        }
      });
  }

  function startCountdown() {
    countdown = 60;
    const btn = document.getElementById('btn-code');
    btn.disabled = true;
    const timer = setInterval(() => {
      countdown--;
      btn.textContent = countdown + 's';
      if (countdown <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '${t('获取验证码', 'Get Code')}';
      }
    }, 1000);
  }

  async function doSubmit() {
    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      let body = {};
      if (currentTab === 'phone') {
        body.phone = document.getElementById('inp-phone').value.trim();
        body.verifyCode = document.getElementById('inp-code').value.trim();
      } else {
        body.email = document.getElementById('inp-email').value.trim();
        body.password = document.getElementById('inp-password').value.trim();
      }
      if (isRegister) {
        body.name = document.getElementById('inp-name').value.trim();
        if (!body.name) { showToast('${t('请输入姓名', 'Please enter name')}', 'error'); return; }
      }

      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });

      if (res.success) {
        setAuth(res.token, res.user);
        showToast(isRegister ? '${t('注册成功！', 'Registered!')}' : '${t('登录成功！', 'Login success!')}', 'success');
        setTimeout(() => { window.location.href = '/dashboard' + window.location.search; }, 600);
      } else {
        showToast(res.message || '${t('操作失败', 'Operation failed')}', 'error');
      }
    } catch(e) {
      showToast('${t('网络错误', 'Network error')}', 'error');
    } finally {
      const lang = getLang();
      btn.disabled = false;
      btn.textContent = isRegister ? (lang==='en'?'Register':'注册') : (lang==='en'?'Login':'登录');
    }
  }
  </script>`

  return c.html(htmlShell(t('身份通 | 滴灌通', 'Identity Connect | Micro Connect'), body, lang))
})


// ═══════════════════════════════════════════
// Page 2: Dashboard (/dashboard)
// ═══════════════════════════════════════════
app.get('/dashboard', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = (zh: string, en: string) => lang === 'en' ? en : zh

  // 9 Connects data
  const connects = [
    { id:'identity', zh:'身份通', en:'Identity', color:'#3B82F6', icon:'fa-id-card', requires: '[]' },
    { id:'application', zh:'发起通', en:'Originate', color:'#F59E0B', icon:'fa-upload', requires: '["initiator"]' },
    { id:'assess', zh:'评估通', en:'Assess', color:'#6366F1', icon:'fa-filter', requires: '["participant"]' },
    { id:'risk', zh:'风控通', en:'Risk', color:'#6366F1', icon:'fa-shield-alt', requires: '["participant"]' },
    { id:'opportunity', zh:'参与通', en:'Deal', color:'#10B981', icon:'fa-handshake', requires: '["participant"]' },
    { id:'terms', zh:'条款通', en:'Terms', color:'#8B5CF6', icon:'fa-sliders-h', requires: '["initiator","participant"]' },
    { id:'contract', zh:'合约通', en:'Contract', color:'#8B5CF6', icon:'fa-file-contract', requires: '["initiator","participant"]' },
    { id:'settlement', zh:'结算通', en:'Settlement', color:'#EF4444', icon:'fa-calculator', requires: '["initiator","participant"]' },
    { id:'performance', zh:'履约通', en:'Performance', color:'#EF4444', icon:'fa-chart-line', requires: '["initiator","participant"]' },
  ]

  const connectsHTML = connects.map(cn => `
    <div class="connect-item" data-requires='${cn.requires}' data-id="${cn.id}" onclick="clickConnect('${cn.id}', '${t(cn.zh, cn.en)}')">
      <div class="connect-icon" style="background:${cn.color};">
        <i class="fas ${cn.icon}"></i>
      </div>
      <span style="font-size:12px;font-weight:500;color:var(--text-primary);">${t(cn.zh, cn.en)}</span>
    </div>
  `).join('')

  const body = `
  ${getNavbar(lang, true)}

  <main style="max-width:960px;margin:0 auto;padding:32px 20px 0;">

    <!-- Welcome -->
    <div class="reveal" style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
      <div id="avatar-area" style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg, #DBEAFE, #3B82F6);display:flex;align-items:center;justify-content:center;">
        <i class="fas fa-user" style="font-size:22px;color:white;"></i>
      </div>
      <div>
        <h1 style="font-size:22px;font-weight:700;color:var(--text-title);" id="greeting">
          ${t('你好', 'Hello')}
        </h1>
        <p style="font-size:14px;color:var(--text-secondary);" id="sub-greeting">
          ${t('管理你的身份，开启不同的工作流', 'Manage your identities, unlock different workflows')}
        </p>
      </div>
    </div>

    <!-- Identity Cards Section -->
    <div class="reveal stagger-1">
      <h2 style="font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:16px;">
        <i class="fas fa-fingerprint" style="color:var(--identity);margin-right:8px;"></i>
        ${t('功能身份', 'Functional Identities')}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:32px;" id="identity-cards">
        <!-- Rendered by JS -->
      </div>
    </div>

    <!-- Entity Section -->
    <div class="reveal stagger-2">
      <h2 style="font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:16px;">
        <i class="fas fa-building" style="color:var(--identity);margin-right:8px;"></i>
        ${t('已认证主体', 'Verified Entities')}
      </h2>
      <div id="entity-list" style="margin-bottom:16px;"></div>
      <a href="/entity-verify${lang === 'en' ? '?lang=en' : ''}" class="btn-ghost" style="font-size:13px;">
        <i class="fas fa-plus" style="margin-right:6px;"></i>${t('认证新主体', 'Verify New Entity')}
      </a>
    </div>

    <!-- Quick Navigation (9 Connects) -->
    <div class="reveal stagger-3" style="margin-top:40px;">
      <h2 style="font-size:16px;font-weight:600;color:var(--text-title);margin-bottom:16px;">
        <i class="fas fa-th" style="color:var(--identity);margin-right:8px;"></i>
        ${t('快捷导航', 'Quick Navigation')}
      </h2>
      <div class="card-hover" style="padding:24px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:12px;" id="connects-grid">
          ${connectsHTML}
        </div>
      </div>
    </div>

  </main>

  ${getFooter(lang)}

  <script>
  // ─── Dashboard Logic ───
  const LANG = getLang();
  const IDENTITIES_META = {
    initiator: { zh:'发起身份', en:'Initiator', icon:'fa-rocket', desc_zh:'上传经营数据，发起融资申请', desc_en:'Upload data, initiate financing', target_zh:'发起通', target_en:'Originate Connect', color:'#F59E0B' },
    participant: { zh:'参与身份', en:'Participant', icon:'fa-search', desc_zh:'浏览投资项目，搭建评估筛子', desc_en:'Browse deals, build assessment sieves', target_zh:'参与通', target_en:'Deal Connect', color:'#10B981' },
    organization: { zh:'机构身份', en:'Organization', icon:'fa-building', desc_zh:'机构级批量操作和自定义工作流', desc_en:'Institutional batch operations & custom workflows', target_zh:'全部通', target_en:'All Connects', color:'#6366F1' }
  };
  const tt = (zh, en) => LANG === 'en' ? en : zh;

  (function init() {
    if (!getToken() || !getUser()) { window.location.href = '/' + window.location.search; return; }
    const user = getUser();
    document.getElementById('greeting').textContent = tt('你好，', 'Hello, ') + user.name;
    document.getElementById('sub-greeting').textContent = tt(
      '注册于 ' + user.createdAt + ' · 管理你的身份，开启不同的工作流',
      'Registered ' + user.createdAt + ' · Manage your identities, unlock different workflows'
    );
    renderIdentityCards(user);
    renderEntities(user);
    updateConnects(user);
  })();

  function renderIdentityCards(user) {
    const container = document.getElementById('identity-cards');
    const roles = ['initiator','participant','organization'];
    container.innerHTML = roles.map(role => {
      const meta = IDENTITIES_META[role];
      const identity = user.identities.find(i => i.role === role);
      const unlocked = !!identity;
      return '<div class="identity-card card-hover ' + (unlocked?'unlocked':'locked') + '">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
          '<div style="width:44px;height:44px;border-radius:12px;background:' + (unlocked ? meta.color : '#e5e7eb') + ';display:flex;align-items:center;justify-content:center;">' +
            '<i class="fas ' + meta.icon + '" style="font-size:18px;color:white;"></i>' +
          '</div>' +
          '<div>' +
            '<h3 style="font-size:15px;font-weight:600;color:var(--text-title);">' + tt(meta.zh, meta.en) + '</h3>' +
            '<p style="font-size:12px;color:var(--text-tertiary);">' + tt(meta.desc_zh, meta.desc_en) + '</p>' +
          '</div>' +
        '</div>' +
        (unlocked ?
          '<div style="display:flex;align-items:center;justify-content:space-between;">' +
            '<span style="font-size:12px;color:var(--semantic-success);font-weight:500;"><i class="fas fa-check-circle" style="margin-right:4px;"></i>' + tt('已解锁','Unlocked') + ' · ' + identity.unlockedAt + '</span>' +
            '<button class="btn-primary" style="padding:8px 16px;font-size:12px;border-radius:10px;" onclick="enterConnect(\\'' + role + '\\')">' +
              tt('进入' + meta.target_zh, 'Enter ' + meta.target_en) +
            '</button>' +
          '</div>'
          :
          '<div style="display:flex;align-items:center;justify-content:space-between;">' +
            '<span style="font-size:12px;color:var(--text-placeholder);">' + tt('未解锁','Not Unlocked') + '</span>' +
            '<button class="btn-primary" style="padding:8px 16px;font-size:12px;border-radius:10px;background:var(--text-tertiary);" onclick="unlockIdentity(\\'' + role + '\\')">' +
              '<i class="fas fa-lock" style="margin-right:4px;"></i>' + tt('解锁身份','Unlock') +
            '</button>' +
          '</div>'
        ) +
      '</div>';
    }).join('');
  }

  function renderEntities(user) {
    const container = document.getElementById('entity-list');
    if (!user.entities || user.entities.length === 0) {
      container.innerHTML = '<div class="card-hover" style="padding:20px;text-align:center;"><p style="font-size:13px;color:var(--text-tertiary);"><i class="fas fa-info-circle" style="margin-right:6px;"></i>' + tt('暂无已认证主体','No verified entities yet') + '</p></div>';
      return;
    }
    container.innerHTML = user.entities.map(e =>
      '<div class="card-hover" style="padding:16px 20px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#DBEAFE,#93C5FD);display:flex;align-items:center;justify-content:center;"><i class="fas fa-store" style="font-size:14px;color:var(--identity);"></i></div>' +
          '<div>' +
            '<span style="font-size:14px;font-weight:600;color:var(--text-title);">' + e.entityName + '</span>' +
            '<span style="font-size:12px;color:var(--text-tertiary);margin-left:8px;">' + e.role + ' · ' + e.verifiedAt + '</span>' +
          '</div>' +
        '</div>' +
        '<button class="btn-ghost" style="font-size:12px;padding:6px 12px;" onclick="showToast(\\'' + tt('协作空间开发中','Workspace coming soon') + '\\', \\'info\\')">' +
          '<i class="fas fa-arrow-right" style="margin-right:4px;"></i>' + tt('进入协作空间','Enter Workspace') +
        '</button>' +
      '</div>'
    ).join('');
  }

  function updateConnects(user) {
    const roles = user.identities.map(i => i.role);
    const hasOrg = roles.includes('organization');
    document.querySelectorAll('.connect-item').forEach(el => {
      const requires = JSON.parse(el.getAttribute('data-requires'));
      const id = el.getAttribute('data-id');
      let accessible = false;
      if (id === 'identity') { accessible = true; }
      else if (hasOrg) { accessible = true; }
      else if (requires.length === 0) { accessible = true; }
      else { accessible = requires.some(r => roles.includes(r)); }
      if (!accessible) {
        el.classList.add('disabled');
        el.title = tt('需先解锁对应身份','Unlock required identity first');
      } else {
        el.classList.remove('disabled');
      }
    });
  }

  async function unlockIdentity(role) {
    const res = await api('/api/user/unlock', { method:'POST', body: JSON.stringify({ role }) });
    if (res.success) {
      const user = getUser();
      user.identities.push(res.identity);
      localStorage.setItem('ic_user', JSON.stringify(user));
      showToast(tt('身份解锁成功！','Identity unlocked!'), 'success');
      renderIdentityCards(user);
      updateConnects(user);
    } else {
      showToast(res.message, 'error');
    }
  }

  function enterConnect(role) {
    const meta = IDENTITIES_META[role];
    showToast(tt('即将跳转到' + meta.target_zh + '（独立应用开发中）', 'Redirecting to ' + meta.target_en + ' (coming soon)'), 'info');
  }

  function clickConnect(id, name) {
    if (id === 'identity') {
      showToast(tt('你已在身份通','You are already in Identity Connect'), 'info');
      return;
    }
    const el = document.querySelector('[data-id="'+id+'"]');
    if (el && el.classList.contains('disabled')) {
      showToast(tt('需先解锁对应身份才能访问 ' + name, 'Unlock required identity to access ' + name), 'error');
      return;
    }
    showToast(tt('即将跳转到' + name + '（独立应用开发中）', 'Redirecting to ' + name + ' (coming soon)'), 'info');
  }
  </script>`

  return c.html(htmlShell(t('工作台 | 身份通', 'Dashboard | Identity Connect'), body, lang))
})


// ═══════════════════════════════════════════
// Page 3: Entity Verification (/entity-verify)
// ═══════════════════════════════════════════
app.get('/entity-verify', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = (zh: string, en: string) => lang === 'en' ? en : zh

  const roleOptions = [
    { value: '法人代表', zh: '法人代表', en: 'Legal Representative' },
    { value: '财务', zh: '财务', en: 'Finance' },
    { value: '管理员', zh: '管理员', en: 'Administrator' },
    { value: '其他', zh: '其他', en: 'Other' },
  ]

  const body = `
  ${getNavbar(lang, true)}

  <main style="max-width:600px;margin:0 auto;padding:32px 20px 0;">
    <!-- Breadcrumb -->
    <div class="reveal" style="margin-bottom:24px;">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="font-size:13px;color:var(--brand);text-decoration:none;">
        <i class="fas fa-arrow-left" style="margin-right:6px;"></i>${t('身份通', 'Identity Connect')}
      </a>
      <span style="color:var(--text-placeholder);margin:0 8px;">›</span>
      <span style="font-size:13px;color:var(--text-secondary);">${t('主体认证', 'Entity Verification')}</span>
    </div>

    <!-- Form Card -->
    <div class="card-hover reveal stagger-1" style="padding:32px 28px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#DBEAFE,#3B82F6);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
          <i class="fas fa-building" style="font-size:22px;color:white;"></i>
        </div>
        <h1 style="font-size:20px;font-weight:700;color:var(--text-title);">
          ${t('认证你的公司/项目主体', 'Verify Your Company/Project Entity')}
        </h1>
        <p style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">
          ${t('认证通过后可进入该主体的协作空间', 'Access the entity workspace after verification')}
        </p>
      </div>

      <!-- Form -->
      <div style="margin-bottom:18px;">
        <label style="font-size:13px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:6px;">
          ${t('公司/项目名称', 'Company/Project Name')} *
        </label>
        <input id="ent-name" class="input-field" placeholder="${t('例如: ABC 餐饮连锁', 'e.g. ABC Restaurant Chain')}">
      </div>

      <div style="margin-bottom:18px;">
        <label style="font-size:13px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:6px;">
          ${t('统一社会信用代码', 'Unified Credit Code')}
        </label>
        <input id="ent-code" class="input-field" placeholder="${t('选填', 'Optional')}">
      </div>

      <div style="margin-bottom:18px;">
        <label style="font-size:13px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:6px;">
          ${t('你在该主体的角色', 'Your Role in Entity')} *
        </label>
        <select id="ent-role" class="input-field" style="appearance:auto;">
          ${roleOptions.map(r => `<option value="${r.value}">${t(r.zh, r.en)}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:24px;">
        <label style="font-size:13px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:6px;">
          ${t('上传证明材料', 'Upload Proof Documents')}
        </label>
        <div style="border:2px dashed var(--border-input);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--border-hover)'" onmouseout="this.style.borderColor='var(--border-input)'">
          <i class="fas fa-cloud-upload-alt" style="font-size:24px;color:var(--text-placeholder);margin-bottom:8px;display:block;"></i>
          <p style="font-size:13px;color:var(--text-tertiary);">
            ${t('营业执照/授权书等（Demo 阶段可跳过）', 'Business license / authorization (optional for Demo)')}
          </p>
        </div>
      </div>

      <button class="btn-primary" style="width:100%;" onclick="submitEntity()">
        <i class="fas fa-check" style="margin-right:8px;"></i>${t('提交认证', 'Submit Verification')}
      </button>
    </div>

    <!-- Demo Hint -->
    <div class="reveal stagger-2" style="margin-top:20px;padding:14px 18px;background:rgba(219,234,254,0.3);border-radius:12px;border:1px solid rgba(59,130,246,0.1);">
      <p style="font-size:12px;color:var(--text-tertiary);">
        <i class="fas fa-info-circle" style="color:var(--identity);margin-right:4px;"></i>
        ${t('Demo 阶段提交即通过，无需真实材料。', 'Demo mode: submit to auto-approve, no real documents needed.')}
      </p>
    </div>
  </main>

  ${getFooter(lang)}

  <script>
  (function() {
    if (!getToken() || !getUser()) { window.location.href = '/' + window.location.search; return; }
  })();

  async function submitEntity() {
    const name = document.getElementById('ent-name').value.trim();
    const code = document.getElementById('ent-code').value.trim();
    const role = document.getElementById('ent-role').value;
    if (!name) { showToast('${t('请填写公司/项目名称', 'Please enter entity name')}', 'error'); return; }

    const res = await api('/api/entity/verify', {
      method: 'POST',
      body: JSON.stringify({ entityName: name, creditCode: code, role })
    });

    if (res.success) {
      const user = getUser();
      user.entities.push(res.entity);
      localStorage.setItem('ic_user', JSON.stringify(user));
      showToast('${t('认证成功！', 'Verification successful!')}', 'success');
      setTimeout(() => { window.location.href = '/dashboard' + window.location.search; }, 1000);
    } else {
      showToast(res.message || '${t('提交失败', 'Submit failed')}', 'error');
    }
  }
  </script>`

  return c.html(htmlShell(t('主体认证 | 身份通', 'Entity Verification | Identity Connect'), body, lang))
})


export default app
