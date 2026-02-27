import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect
// MicroConnect Product Bible V3.0 — 严格对齐
// 以人为单位的万能工作台 · 解锁身份 · 路由中枢
// ═══════════════════════════════════════════════════════

const app = new Hono()
app.use('/api/*', cors())

// ─── JWT (Demo) ───
const JWT_SECRET = 'micro-connect-demo-secret-2026'

function toB64(s: string): string {
  const b = new TextEncoder().encode(s)
  let r = ''; for (const c of b) r += String.fromCharCode(c)
  return btoa(r).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64(s: string): string {
  const p = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4)
  const b = atob(p); const u = new Uint8Array(b.length)
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i)
  return new TextDecoder().decode(u)
}
function createJWT(payload: Record<string, unknown>): string {
  const h = toB64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const b = toB64(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 }))
  return `${h}.${b}.${toB64(JWT_SECRET + h + b)}`
}
function parseJWT(token: string): Record<string, unknown> | null {
  try {
    const [, body] = token.split('.')
    if (!body) return null
    const p = JSON.parse(fromB64(body))
    return (p.exp && p.exp < Date.now()) ? null : p
  } catch { return null }
}

// ─── Data Models (Product Bible §6) ───
interface User {
  id: string; phone?: string; email?: string; name: string; password?: string
  avatar?: string; identities: Identity[]; entities: EntityAuth[]; createdAt: string
}
type IdentityRole = 'initiator' | 'participant' | 'organization'
interface Identity { role: IdentityRole; unlockedAt: string; status: 'active' | 'pending' | 'suspended' }
interface EntityAuth { entityId: string; entityName: string; role: string; verifiedAt: string }

// ─── Demo Users ───
const users: User[] = [
  { id: 'u-001', phone: '13800001234', name: '张三', identities: [{ role: 'initiator', unlockedAt: '2026-01-15', status: 'active' }, { role: 'participant', unlockedAt: '2026-02-01', status: 'active' }], entities: [{ entityId: 'e-001', entityName: 'ABC 餐饮连锁', role: '法人代表', verifiedAt: '2026-01-20' }], createdAt: '2026-01-10' },
  { id: 'u-002', email: 'investor@fund.com', name: '李四', password: 'demo123', identities: [{ role: 'participant', unlockedAt: '2026-01-08', status: 'active' }, { role: 'organization', unlockedAt: '2026-01-10', status: 'active' }], entities: [{ entityId: 'e-010', entityName: '新锐资本', role: '投资总监', verifiedAt: '2026-01-12' }], createdAt: '2026-01-05' },
  { id: 'u-003', phone: '13900005678', name: '王五', identities: [{ role: 'initiator', unlockedAt: '2026-02-20', status: 'active' }], entities: [], createdAt: '2026-02-18' }
]

function findUser(phone?: string, email?: string): User | undefined {
  if (phone) return users.find(u => u.phone === phone)
  if (email) return users.find(u => u.email === email)
}
function findUserById(id: string) { return users.find(u => u.id === id) }
function getUserFromToken(auth: string | undefined): User | null {
  if (!auth?.startsWith('Bearer ')) return null
  const p = parseJWT(auth.slice(7))
  return p?.userId ? (findUserById(p.userId as string) || null) : null
}


// ═══════════════════════════════════════════
// i18n
// ═══════════════════════════════════════════
function T(lang: string) {
  const zh = lang !== 'en'
  return {
    nav: {
      title: zh ? '身份通' : 'Identity Connect',
      subtitle: zh ? '以人为单位的万能工作台' : 'Universal Personal Workstation',
      backToMain: zh ? '返回主站' : 'Back to Main',
      logout: zh ? '退出登录' : 'Logout',
      langLabel: zh ? 'EN' : '中',
      langToggle: zh ? 'en' : 'zh',
    },
    auth: {
      welcome: zh ? '欢迎来到滴灌通' : 'Welcome to Micro Connect',
      subtitle: zh ? '收入分成投资的基础设施级平台' : 'Infrastructure-Grade RBF Investment Platform',
      libraryHint: zh ? '办借书证 — 选择你的身份，开启投融资之旅' : 'Get your library card — Choose your identity, start your journey',
      phoneTab: zh ? '手机号登录' : 'Phone Login',
      emailTab: zh ? '邮箱登录' : 'Email Login',
      phonePlaceholder: zh ? '请输入手机号' : 'Enter phone number',
      codePlaceholder: zh ? '请输入验证码' : 'Enter verification code',
      getCode: zh ? '获取验证码' : 'Get Code',
      emailPlaceholder: zh ? '请输入邮箱' : 'Enter email',
      passwordPlaceholder: zh ? '请输入密码' : 'Enter password',
      namePlaceholder: zh ? '请输入姓名' : 'Enter your name',
      loginBtn: zh ? '登录 / 注册' : 'Login / Register',
      noAccount: zh ? '没有账号？自动注册' : 'No account? Auto-register',
    },
    dashboard: {
      greeting: zh ? '你好' : 'Hello',
      subtitle: zh ? '管理你的身份，开启不同的工作流' : 'Manage your identities, unlock different workflows',
      identitySection: zh ? '功能身份' : 'Functional Identities',
      entitySection: zh ? '已认证主体' : 'Verified Entities',
      quickNav: zh ? '快捷导航' : 'Quick Navigation',
      unlocked: zh ? '已解锁' : 'Unlocked',
      locked: zh ? '未解锁' : 'Not Unlocked',
      unlock: zh ? '解锁身份' : 'Unlock',
      enter: zh ? '进入' : 'Enter',
      addEntity: zh ? '+ 认证新主体' : '+ Verify New Entity',
      noEntities: zh ? '暂无已认证主体' : 'No verified entities yet',
      verifyHint: zh ? '认证主体后可进入协作空间' : 'Verify an entity to access workspace',
    },
    identities: {
      initiator: { name: zh ? '发起身份' : 'Initiator', desc: zh ? '上传经营数据，发起融资申请' : 'Upload data, initiate financing', icon: 'fa-rocket', target: zh ? '发起通' : 'Originate Connect', cta: zh ? '进入发起通' : 'Enter Originate' },
      participant: { name: zh ? '参与身份' : 'Participant', desc: zh ? '浏览投资项目，搭建评估筛子' : 'Browse deals, build assessment sieves', icon: 'fa-search', target: zh ? '参与通' : 'Deal Connect', cta: zh ? '进入参与通' : 'Enter Deal' },
      organization: { name: zh ? '机构身份' : 'Organization', desc: zh ? '机构级批量操作和自定义工作流' : 'Institutional batch operations & custom workflows', icon: 'fa-building', target: zh ? '全部通' : 'All Connects', cta: zh ? '进入机构工作台' : 'Enter Org Workspace' },
    },
    entity: {
      title: zh ? '主体认证' : 'Entity Verification',
      subtitle: zh ? '认证通过后即可进入该主体的协作空间' : 'Access the entity workspace after verification',
      companyName: zh ? '公司/项目名称' : 'Company/Project Name',
      creditCode: zh ? '统一社会信用代码' : 'Unified Credit Code',
      yourRole: zh ? '你在该主体的角色' : 'Your Role in Entity',
      uploadProof: zh ? '上传证明材料' : 'Upload Proof Documents',
      submit: zh ? '提交认证' : 'Submit Verification',
      backToDash: zh ? '返回工作台' : 'Back to Dashboard',
      roles: { legal: zh ? '法人代表' : 'Legal Representative', finance: zh ? '财务' : 'Finance', admin: zh ? '管理员' : 'Administrator', other: zh ? '其他' : 'Other' }
    },
    footer: {
      copyright: zh ? '© 2026 Micro Connect Group. 保留所有权利。' : '© 2026 Micro Connect Group. All rights reserved.',
      privacy: zh ? '隐私政策' : 'Privacy Policy',
      terms: zh ? '服务条款' : 'Terms of Service',
      backToMain: zh ? '返回主站' : 'Back to Main Site',
      desc: zh ? '以人为单位的万能工作台 · 解锁身份 · 路由中枢' : 'Universal workspace · Unlock identity · Routing hub',
    },
    connects: [
      { id: 'identity', name: zh ? '身份通' : 'Identity', color: '#3B82F6', icon: 'fa-id-card', requires: [] as string[], status: 'live' as const, desc: zh ? '统一入口 · 路由中枢' : 'Unified entry · Routing hub' },
      { id: 'application', name: zh ? '发起通' : 'Originate', color: '#F59E0B', icon: 'fa-upload', requires: ['initiator'], status: 'beta' as const, desc: zh ? '发起融资 · AI打包' : 'Initiate financing · AI packaging' },
      { id: 'assess', name: zh ? '评估通' : 'Assess', color: '#6366F1', icon: 'fa-filter', requires: ['participant'], status: 'beta' as const, desc: zh ? '自建AI筛子' : 'Build AI sieves' },
      { id: 'risk', name: zh ? '风控通' : 'Risk', color: '#6366F1', icon: 'fa-shield-alt', requires: ['participant'], status: 'live' as const, desc: zh ? '风控规则 · 验真' : 'Risk rules · Verification' },
      { id: 'opportunity', name: zh ? '参与通' : 'Deal', color: '#10B981', icon: 'fa-handshake', requires: ['participant'], status: 'live' as const, desc: zh ? '筛后看板 · 投资决策' : 'Filtered board · Decision' },
      { id: 'terms', name: zh ? '条款通' : 'Terms', color: '#8B5CF6', icon: 'fa-sliders-h', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '三联动滑块 · 磋商' : 'Triple sliders · Negotiate' },
      { id: 'contract', name: zh ? '合约通' : 'Contract', color: '#8B5CF6', icon: 'fa-file-contract', requires: ['initiator', 'participant'], status: 'beta' as const, desc: zh ? '电子签署 · 合规' : 'E-sign · Compliance' },
      { id: 'settlement', name: zh ? '结算通' : 'Settlement', color: '#EF4444', icon: 'fa-calculator', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '大账本 · 交易记录' : 'Ledger · Transactions' },
      { id: 'performance', name: zh ? '履约通' : 'Performance', color: '#EF4444', icon: 'fa-chart-line', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '每日监控 · 回款预警' : 'Monitor · Alerts' },
    ]
  }
}


// ═══════════════════════════════════════════
// API Routes (Product Bible §6.3)
// ═══════════════════════════════════════════
app.post('/api/auth/verify-code', async (c) => {
  const { phone } = await c.req.json()
  if (!phone) return c.json({ success: false, message: '请提供手机号' }, 400)
  return c.json({ success: true, message: '验证码已发送' })
})

app.post('/api/auth/register', async (c) => {
  const { phone, email, verifyCode, password, name } = await c.req.json()
  if (!name) return c.json({ success: false, message: '请提供姓名' }, 400)
  if (phone && verifyCode !== '123456') return c.json({ success: false, message: '验证码错误' }, 400)
  if (findUser(phone, email)) return c.json({ success: false, message: '该账号已注册，请直接登录' }, 400)
  const u: User = { id: `u-${String(Date.now()).slice(-6)}`, ...(phone ? { phone } : {}), ...(email ? { email, password } : {}), name, identities: [], entities: [], createdAt: new Date().toISOString().split('T')[0] }
  users.push(u)
  return c.json({ success: true, token: createJWT({ userId: u.id, name: u.name }), user: { ...u, password: undefined } })
})

app.post('/api/auth/login', async (c) => {
  const { phone, email, verifyCode, password } = await c.req.json()
  if (phone && verifyCode !== '123456') return c.json({ success: false, message: '验证码错误' }, 400)
  const u = findUser(phone, email)
  if (!u) return c.json({ success: false, message: '用户不存在，请先注册' }, 404)
  if (email && password && u.password && u.password !== password) return c.json({ success: false, message: '密码错误' }, 401)
  return c.json({ success: true, token: createJWT({ userId: u.id, name: u.name }), user: { ...u, password: undefined } })
})

app.get('/api/user/profile', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, user: { ...u, password: undefined } })
})

app.post('/api/user/unlock', async (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  const { role } = await c.req.json()
  if (!['initiator', 'participant', 'organization'].includes(role)) return c.json({ success: false, message: '无效的身份类型' }, 400)
  if (u.identities.find(i => i.role === role)) return c.json({ success: false, message: '该身份已解锁' }, 400)
  const identity: Identity = { role, unlockedAt: new Date().toISOString().split('T')[0], status: 'active' }
  u.identities.push(identity)
  return c.json({ success: true, identity })
})

app.post('/api/entity/verify', async (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  const { entityName, creditCode, role } = await c.req.json()
  if (!entityName || !role) return c.json({ success: false, message: '请填写完整信息' }, 400)
  const entity: EntityAuth = { entityId: `e-${String(Date.now()).slice(-6)}`, entityName, role, verifiedAt: new Date().toISOString().split('T')[0] }
  u.entities.push(entity)
  return c.json({ success: true, entity })
})

app.get('/api/entity/list', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, entities: u.entities })
})


// ═══════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════
const LOGO = `<svg width="32" height="32" viewBox="0 0 80 80"><defs><linearGradient id="gt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gt)"/><circle cx="36" cy="44" r="22" fill="url(#gb)" opacity="0.85"/></svg>`

function shell(title: string, body: string, lang: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
  <title>${title}</title>
  <meta name="theme-color" content="#0a0f1e">
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <script>
  function showToast(m,t){t=t||'info';var e=document.getElementById('toast');if(!e)return;e.textContent=m;e.className='toast '+t+' show';setTimeout(function(){e.classList.remove('show')},3500)}
  function getToken(){return localStorage.getItem('ic_token')}
  function getUser(){try{return JSON.parse(localStorage.getItem('ic_user')||'null')}catch(e){return null}}
  function setAuth(t,u){localStorage.setItem('ic_token',t);localStorage.setItem('ic_user',JSON.stringify(u))}
  function clearAuth(){localStorage.removeItem('ic_token');localStorage.removeItem('ic_user')}
  function doLogout(){clearAuth();window.location.href='/'}
  function getLang(){return new URLSearchParams(window.location.search).get('lang')||'zh'}
  function api(p,o){o=o||{};var t=getToken();var h=Object.assign({'Content-Type':'application/json'},t?{Authorization:'Bearer '+t}:{},o.headers||{});return fetch(p,Object.assign({},o,{headers:h})).then(function(r){return r.json()})}
  </script>
</head>
<body>
  <div id="toast" class="toast"></div>
  ${body}
  <script>
  window.addEventListener('scroll',function(){var n=document.getElementById('navbar');if(n)n.classList.toggle('scrolled',window.scrollY>10)});
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.reveal').forEach(function(el){
      new IntersectionObserver(function(e){if(e[0].isIntersecting){e[0].target.classList.add('visible')}},{threshold:0.15}).observe(el)
    });
  });
  </script>
</body>
</html>`
}

function navDark(t: ReturnType<typeof T>): string {
  return `
  <nav class="navbar-dark" id="navbar">
    <div class="nav-inner">
      <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${LOGO}
        <span class="font-brand" style="font-weight:700;font-size:14px;color:rgba(255,255,255,0.9);letter-spacing:.5px;">MICRO CONNECT</span>
      </a>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5);"><i class="fas fa-id-card" style="margin-right:4px;color:#93C5FD;"></i>${t.nav.title}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost-dark">${t.nav.langLabel}</a>
        <a href="https://microconnect.com" class="btn-ghost-dark">${t.nav.backToMain}</a>
      </div>
    </div>
  </nav>`
}

function navLight(t: ReturnType<typeof T>, lang: string): string {
  return `
  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${LOGO}
        <span class="font-brand" style="font-weight:700;font-size:14px;color:#1d1d1f;letter-spacing:.5px;">MICRO CONNECT</span>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;background:rgba(59,130,246,0.08);font-size:11px;font-weight:600;color:#3B82F6;">
          <i class="fas fa-id-card" style="font-size:10px;"></i>${t.nav.title}
        </span>
      </a>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost" style="padding:6px 12px;font-size:12px;">${t.nav.langLabel}</a>
        <span id="nav-user" style="font-size:13px;color:#6e6e73;font-weight:500;"></span>
        <button onclick="doLogout()" class="btn-ghost" style="padding:6px 12px;font-size:12px;color:#ff375f;border-color:rgba(255,55,95,0.15);">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </nav>`
}

function footerHtml(t: ReturnType<typeof T>): string {
  return `
  <footer class="footer-aurora" style="padding:56px 24px 36px;margin-top:80px;position:relative;">
    <div style="max-width:1200px;margin:0 auto;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:20px;">
        ${LOGO}
        <span class="font-brand" style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;letter-spacing:1px;">MICRO CONNECT</span>
      </div>
      <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.35);margin-bottom:8px;">${t.nav.title} &middot; Identity Connect</p>
      <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.25);margin-bottom:24px;">${t.footer.desc}</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:24px;">
        <a href="https://microconnect.com" class="footer-link">${t.footer.backToMain}</a>
        <a href="#" class="footer-link">${t.footer.privacy}</a>
        <a href="#" class="footer-link">${t.footer.terms}</a>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:20px;"></div>
      <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:11px;">${t.footer.copyright}</p>
    </div>
  </footer>`
}


// ═══════════════════════════════════════════
// PAGE 1 — 登录/注册 (/)
// 📚 图书馆比喻: 办借书证
// ═══════════════════════════════════════════
app.get('/', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = T(lang)
  const zh = lang !== 'en'

  const body = `
  <div class="hero-dark">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    ${navDark(t)}

    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;z-index:2;">
      <div style="width:100%;max-width:420px;">

        <!-- Hero Text -->
        <div style="text-align:center;margin-bottom:40px;animation:slide-up .8s var(--ease-out-expo) forwards;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.15);margin-bottom:24px;">
            <div style="width:6px;height:6px;border-radius:50%;background:#34c759;animation:pulse-dot 2s infinite;"></div>
            <span style="font-size:12px;color:rgba(255,255,255,0.55);font-weight:500;">${zh ? '滴灌通平台 · 统一入口' : 'Micro Connect · Unified Entry'}</span>
          </div>
          <h1 style="font-size:34px;font-weight:800;color:#fff;letter-spacing:-.5px;line-height:1.2;margin-bottom:12px;">${t.auth.welcome}</h1>
          <p style="font-size:15px;color:rgba(255,255,255,0.4);font-weight:400;line-height:1.6;max-width:340px;margin:0 auto 16px;">${t.auth.subtitle}</p>
          <p style="font-size:13px;color:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;gap:6px;">
            <span style="font-size:16px;">&#128218;</span> ${t.auth.libraryHint}
          </p>
        </div>

        <!-- Login Card -->
        <div class="card-glass" style="padding:36px 32px;animation:scale-in .6s var(--ease-out-expo) .2s both;">
          <!-- Tabs -->
          <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:28px;">
            <button class="tab-btn active" onclick="switchTab('phone')" id="tab-phone"><i class="fas fa-mobile-alt" style="margin-right:6px;font-size:13px;"></i>${t.auth.phoneTab}</button>
            <button class="tab-btn" onclick="switchTab('email')" id="tab-email"><i class="fas fa-envelope" style="margin-right:6px;font-size:13px;"></i>${t.auth.emailTab}</button>
          </div>

          <!-- Phone -->
          <div id="form-phone">
            <div style="display:flex;gap:8px;margin-bottom:16px;">
              <input type="tel" id="inp-phone" class="input-glass" placeholder="${t.auth.phonePlaceholder}" style="flex:1;">
              <button class="btn-code" onclick="sendCode()" id="btn-code">${t.auth.getCode}</button>
            </div>
            <input type="text" id="inp-code" class="input-glass" placeholder="${t.auth.codePlaceholder}" style="margin-bottom:16px;" maxlength="6">
          </div>

          <!-- Email -->
          <div id="form-email" style="display:none;">
            <input type="email" id="inp-email" class="input-glass" placeholder="${t.auth.emailPlaceholder}" style="margin-bottom:16px;">
            <input type="password" id="inp-password" class="input-glass" placeholder="${t.auth.passwordPlaceholder}" style="margin-bottom:16px;">
          </div>

          <!-- Name (new user) -->
          <div id="name-row" style="display:none;">
            <input type="text" id="inp-name" class="input-glass" placeholder="${t.auth.namePlaceholder}" style="margin-bottom:16px;">
          </div>

          <!-- Submit -->
          <button class="btn-primary" style="width:100%;padding:16px;box-shadow:0 0 24px rgba(59,130,246,0.3),0 4px 16px rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.3);" onclick="doSubmit()" id="btn-submit">
            ${t.auth.loginBtn}
          </button>

          <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.25);margin-top:16px;">
            ${t.auth.noAccount}
          </p>
        </div>

        <!-- Demo Hint -->
        <div style="margin-top:24px;padding:16px 20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;animation:fade-in 1s .5s both;">
          <p style="font-size:12px;color:rgba(255,255,255,0.28);line-height:1.7;">
            <i class="fas fa-flask" style="color:rgba(59,130,246,0.5);margin-right:6px;"></i>
            <strong style="color:rgba(255,255,255,0.45);">Demo</strong>&nbsp;
            ${zh ? '验证码: 123456 &nbsp;|&nbsp; 手机: 13800001234 &nbsp;|&nbsp; 邮箱: investor@fund.com / demo123' : 'Code: 123456 &nbsp;|&nbsp; Phone: 13800001234 &nbsp;|&nbsp; Email: investor@fund.com / demo123'}
          </p>
        </div>

        <!-- Identity hints -->
        <div style="display:flex;justify-content:center;gap:10px;margin-top:24px;animation:fade-in 1s .7s both;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.35);">
            <i class="fas fa-rocket" style="color:#F59E0B;font-size:10px;"></i>${t.identities.initiator.name}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.35);">
            <i class="fas fa-search" style="color:#10B981;font-size:10px;"></i>${t.identities.participant.name}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.35);">
            <i class="fas fa-building" style="color:#6366F1;font-size:10px;"></i>${t.identities.organization.name}
          </span>
        </div>
      </div>
    </div>
  </div>

  <script>
  (function(){if(getToken()&&getUser()){window.location.href='/dashboard'+window.location.search}})();
  var currentTab='phone',showName=false;

  function switchTab(tab){
    currentTab=tab;
    document.getElementById('tab-phone').classList.toggle('active',tab==='phone');
    document.getElementById('tab-email').classList.toggle('active',tab==='email');
    document.getElementById('form-phone').style.display=tab==='phone'?'block':'none';
    document.getElementById('form-email').style.display=tab==='email'?'block':'none';
  }

  function sendCode(){
    var p=document.getElementById('inp-phone').value.trim();
    if(!p){showToast('${t.auth.phonePlaceholder}','error');return}
    api('/api/auth/verify-code',{method:'POST',body:JSON.stringify({phone:p})}).then(function(r){
      if(r.success){showToast('${zh ? '验证码已发送 (123456)' : 'Code sent (123456)'}','success');startCD()}
    });
  }
  function startCD(){
    var s=60,b=document.getElementById('btn-code');b.disabled=true;
    var iv=setInterval(function(){s--;b.textContent=s+'s';if(s<=0){clearInterval(iv);b.disabled=false;b.textContent='${t.auth.getCode}'}},1000);
  }

  async function doSubmit(){
    var btn=document.getElementById('btn-submit');btn.disabled=true;btn.innerHTML='<span class="spinner"></span>';
    try{
      var body={};
      if(currentTab==='phone'){
        body.phone=document.getElementById('inp-phone').value.trim();
        body.verifyCode=document.getElementById('inp-code').value.trim();
      } else {
        body.email=document.getElementById('inp-email').value.trim();
        body.password=document.getElementById('inp-password').value.trim();
      }

      // Try login first
      var r=await api('/api/auth/login',{method:'POST',body:JSON.stringify(body)});
      if(r.success){
        setAuth(r.token,r.user);
        showToast('${zh ? '登录成功！' : 'Welcome back!'}','success');
        setTimeout(function(){window.location.href='/dashboard'+window.location.search},600);
        return;
      }

      // If not found, show name field for register
      if(r.message&&r.message.indexOf('${zh ? '不存在' : 'not exist'}')!==-1){
        if(!showName){
          showName=true;
          document.getElementById('name-row').style.display='block';
          showToast('${zh ? '新用户，请输入姓名完成注册' : 'New user, enter your name to register'}','info');
          return;
        }
        body.name=document.getElementById('inp-name').value.trim();
        if(!body.name){showToast('${t.auth.namePlaceholder}','error');return}
        var r2=await api('/api/auth/register',{method:'POST',body:JSON.stringify(body)});
        if(r2.success){
          setAuth(r2.token,r2.user);
          showToast('${zh ? '注册成功！' : 'Registered!'}','success');
          setTimeout(function(){window.location.href='/dashboard'+window.location.search},600);
          return;
        }
        showToast(r2.message,'error');
      } else {
        showToast(r.message||'${zh ? '操作失败' : 'Failed'}','error');
      }
    }catch(e){showToast('${zh ? '网络错误' : 'Network error'}','error')}
    finally{btn.disabled=false;btn.textContent='${t.auth.loginBtn}'}
  }
  </script>`

  return c.html(shell(t.nav.title + ' | ' + (zh ? '滴灌通' : 'Micro Connect'), body, lang))
})


// ═══════════════════════════════════════════
// PAGE 2 — 个人工作台 (/dashboard)
// 欢迎区 → 身份卡片 → 已认证主体 → 9通导航
// ═══════════════════════════════════════════
app.get('/dashboard', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = T(lang)
  const zh = lang !== 'en'

  // Light color map for connect icons
  const lightMap: Record<string, string> = {
    '#3B82F6': '#DBEAFE', '#F59E0B': '#FEF3C7', '#6366F1': '#E0E7FF',
    '#10B981': '#D1FAE5', '#8B5CF6': '#EDE9FE', '#EF4444': '#FEE2E2'
  }

  const connectsHTML = t.connects.map(cn => {
    const light = lightMap[cn.color] || '#f5f5f7'
    const sl = cn.status === 'live' ? (zh ? '已上线' : 'Live') : cn.status === 'beta' ? 'Beta' : (zh ? '即将' : 'Coming')
    return `
    <div class="connect-item" data-req='${JSON.stringify(cn.requires)}' data-id="${cn.id}" onclick="clickConnect('${cn.id}','${cn.name}')" title="${cn.desc}">
      <div class="connect-icon" style="background:linear-gradient(135deg,${light},${cn.color});">
        <i class="fas ${cn.icon}"></i>
      </div>
      <span style="font-size:12px;font-weight:600;color:#1d1d1f;">${cn.name}</span>
      <span class="connect-status status-${cn.status}">${sl}</span>
    </div>`
  }).join('')

  const body = `
  ${navLight(t, lang)}

  <main style="max-width:1080px;margin:0 auto;padding:24px 20px 0;">

    <!-- Welcome -->
    <div class="reveal" style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:36px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="avatar-ring"><i class="fas fa-user" style="font-size:22px;color:#fff;"></i></div>
        <div>
          <h1 style="font-size:24px;font-weight:800;color:#1d1d1f;letter-spacing:-.3px;" id="greeting">${t.dashboard.greeting}</h1>
          <p style="font-size:14px;color:#86868b;margin-top:2px;" id="sub-greeting">${t.dashboard.subtitle}</p>
        </div>
      </div>
      <a href="/entity-verify${lang === 'en' ? '?lang=en' : ''}" class="btn-ghost" style="font-size:13px;">
        <i class="fas fa-plus-circle"></i>${t.dashboard.addEntity}
      </a>
    </div>

    <!-- Identity Cards -->
    <div class="reveal stagger-1">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#DBEAFE,#3B82F6);"><i class="fas fa-fingerprint" style="font-size:14px;color:#fff;"></i></div>
        <h2 style="font-size:18px;font-weight:700;color:#1d1d1f;">${t.dashboard.identitySection}</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:40px;" id="identity-cards"></div>
    </div>

    <!-- Entities -->
    <div class="reveal stagger-2">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#E0E7FF,#6366F1);"><i class="fas fa-building" style="font-size:14px;color:#fff;"></i></div>
        <h2 style="font-size:18px;font-weight:700;color:#1d1d1f;">${t.dashboard.entitySection}</h2>
      </div>
      <div id="entity-list" style="margin-bottom:40px;"></div>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06),transparent);margin:8px 0 36px;"></div>

    <!-- 9 Connects Grid -->
    <div class="reveal stagger-3">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#5DC4B3,#3D8F83);"><i class="fas fa-th" style="font-size:14px;color:#fff;"></i></div>
        <h2 style="font-size:18px;font-weight:700;color:#1d1d1f;">${t.dashboard.quickNav}</h2>
        <span style="font-size:12px;color:#86868b;margin-left:auto;">${zh ? '9 个通 · 产品矩阵' : '9 Connects · Product Matrix'}</span>
      </div>
      <div class="card" style="padding:28px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;" id="connects-grid">
          ${connectsHTML}
        </div>
      </div>
    </div>

  </main>

  ${footerHtml(t)}

  <script>
  var LANG=getLang();
  var tt=function(z,e){return LANG==='en'?e:z};

  var ROLES={
    initiator:{name:tt('发起身份','Initiator'),icon:'fa-rocket',desc:tt('上传经营数据，发起融资申请','Upload data, initiate financing'),target:tt('发起通','Originate Connect'),cta:tt('进入发起通','Enter Originate'),gradient:'ic-initiator'},
    participant:{name:tt('参与身份','Participant'),icon:'fa-search',desc:tt('浏览投资项目，搭建评估筛子','Browse deals, build assessment sieves'),target:tt('参与通','Deal Connect'),cta:tt('进入参与通','Enter Deal'),gradient:'ic-participant'},
    organization:{name:tt('机构身份','Organization'),icon:'fa-building',desc:tt('机构级批量操作和自定义工作流','Institutional batch operations & custom workflows'),target:tt('全部通','All Connects'),cta:tt('进入机构工作台','Enter Org Workspace'),gradient:'ic-organization'}
  };

  (function init(){
    if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return}
    var u=getUser();
    document.getElementById('greeting').textContent=tt('你好，','Hello, ')+u.name;
    document.getElementById('sub-greeting').textContent=tt('注册于 ','Since ')+u.createdAt+' · '+tt('管理你的身份，开启工作流','Manage identities, unlock workflows');
    var nu=document.getElementById('nav-user');if(nu)nu.textContent=u.name;
    renderCards(u);
    renderEntities(u);
    updateConnects(u);
  })();

  function renderCards(user){
    var c=document.getElementById('identity-cards');
    var roles=['initiator','participant','organization'];
    c.innerHTML=roles.map(function(role){
      var m=ROLES[role];
      var id=user.identities.find(function(i){return i.role===role});
      var ok=!!id;
      return '<div class="identity-card '+(ok?m.gradient:'ic-locked')+'">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'+
          '<div style="width:48px;height:48px;border-radius:14px;background:'+(ok?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.04)')+';display:flex;align-items:center;justify-content:center;">'+
            '<i class="fas '+m.icon+'" style="font-size:20px;color:'+(ok?'rgba(0,0,0,0.55)':'#86868b')+';"></i>'+
          '</div>'+
          (ok
            ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.3);font-size:11px;font-weight:600;color:rgba(0,0,0,0.55);"><i class="fas fa-check-circle" style="font-size:10px;color:#16a34a;"></i>'+tt('已解锁','Unlocked')+'</span>'
            : '<span style="font-size:11px;color:#aeaeb2;font-weight:500;">'+tt('未解锁','Locked')+'</span>'
          )+
        '</div>'+
        '<h3 style="font-size:17px;font-weight:700;color:'+(ok?'rgba(0,0,0,0.75)':'#6e6e73')+';margin-bottom:4px;">'+m.name+'</h3>'+
        '<p style="font-size:12px;color:'+(ok?'rgba(0,0,0,0.45)':'#86868b')+';margin-bottom:20px;line-height:1.5;">'+m.desc+'</p>'+
        (ok
          ? '<div style="display:flex;align-items:center;justify-content:space-between;">'+
              '<span style="font-size:11px;color:rgba(0,0,0,0.35);">'+id.unlockedAt+'</span>'+
              '<button class="btn-card-action" onclick="enterConnect(&quot;'+role+'&quot;)">'+m.cta+' <i class="fas fa-arrow-right" style="margin-left:4px;font-size:10px;"></i></button>'+
            '</div>'
          : '<button class="btn-unlock" onclick="unlockRole(&quot;'+role+'&quot;)"><i class="fas fa-lock-open" style="margin-right:6px;"></i>'+tt('解锁此身份','Unlock This Role')+'</button>'
        )+
      '</div>';
    }).join('');
  }

  function renderEntities(user){
    var c=document.getElementById('entity-list');
    if(!user.entities||!user.entities.length){
      c.innerHTML='<div class="card" style="padding:32px;text-align:center;">'+
        '<i class="fas fa-building" style="font-size:28px;color:#aeaeb2;margin-bottom:12px;display:block;"></i>'+
        '<p style="font-size:14px;color:#86868b;margin-bottom:4px;">'+tt('暂无已认证主体','No verified entities yet')+'</p>'+
        '<p style="font-size:12px;color:#aeaeb2;">'+tt('认证主体后可进入协作空间','Verify an entity to access workspace')+'</p></div>';
      return;
    }
    c.innerHTML=user.entities.map(function(e){
      return '<div class="card" style="padding:20px 24px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">'+
        '<div style="display:flex;align-items:center;gap:14px;">'+
          '<div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#e0e7ff,#a5b4fc);display:flex;align-items:center;justify-content:center;"><i class="fas fa-store" style="font-size:16px;color:#4f46e5;"></i></div>'+
          '<div>'+
            '<div style="font-size:15px;font-weight:600;color:#1d1d1f;">'+e.entityName+'</div>'+
            '<div style="font-size:12px;color:#86868b;margin-top:2px;"><i class="fas fa-user-tag" style="margin-right:4px;"></i>'+e.role+' · '+e.verifiedAt+'</div>'+
          '</div>'+
        '</div>'+
        '<button class="btn-ghost" style="font-size:12px;padding:8px 16px;" onclick="showToast(&quot;'+tt('协作空间开发中','Workspace coming soon')+'&quot;,&quot;info&quot;)"><i class="fas fa-arrow-right" style="margin-right:4px;"></i>'+tt('进入空间','Workspace')+'</button>'+
      '</div>';
    }).join('');
  }

  function updateConnects(user){
    var roles=user.identities.map(function(i){return i.role});
    var isOrg=roles.includes('organization');
    document.querySelectorAll('.connect-item').forEach(function(el){
      var req=JSON.parse(el.getAttribute('data-req'));
      var id=el.getAttribute('data-id');
      var ok=id==='identity'||isOrg||req.length===0||req.some(function(r){return roles.includes(r)});
      el.classList.toggle('disabled',!ok);
      if(!ok)el.title=tt('需先解锁对应身份','Unlock required identity first');
    });
  }

  async function unlockRole(role){
    var r=await api('/api/user/unlock',{method:'POST',body:JSON.stringify({role:role})});
    if(r.success){
      var u=getUser();u.identities.push(r.identity);localStorage.setItem('ic_user',JSON.stringify(u));
      showToast(tt('身份解锁成功！','Role unlocked!'),'success');
      renderCards(u);updateConnects(u);
    } else showToast(r.message,'error');
  }

  function enterConnect(role){
    var m=ROLES[role];
    showToast(tt('即将跳转到'+m.target+'（开发中）','Redirecting to '+m.target+' (coming soon)'),'info');
  }
  function clickConnect(id,name){
    if(id==='identity'){showToast(tt('你已在身份通','You are in Identity Connect'),'info');return}
    var el=document.querySelector('[data-id="'+id+'"]');
    if(el&&el.classList.contains('disabled')){showToast(tt('需先解锁对应身份','Unlock required role first'),'error');return}
    showToast(tt('即将跳转到'+name+'（开发中）','Redirecting to '+name+' (coming soon)'),'info');
  }
  </script>`

  return c.html(shell((zh ? '工作台 | 身份通' : 'Dashboard | Identity Connect'), body, lang))
})


// ═══════════════════════════════════════════
// PAGE 3 — 主体认证 (/entity-verify)
// ═══════════════════════════════════════════
app.get('/entity-verify', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = T(lang)
  const zh = lang !== 'en'

  const roleOpts = [
    { value: '法人代表', label: t.entity.roles.legal },
    { value: '财务', label: t.entity.roles.finance },
    { value: '管理员', label: t.entity.roles.admin },
    { value: '其他', label: t.entity.roles.other },
  ]

  const body = `
  ${navLight(t, lang)}

  <main style="max-width:560px;margin:0 auto;padding:32px 20px 0;">
    <!-- Breadcrumb -->
    <div class="reveal" style="margin-bottom:28px;">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#3B82F6;text-decoration:none;font-weight:500;transition:opacity .2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
        <i class="fas fa-arrow-left"></i>${t.entity.backToDash}
      </a>
    </div>

    <!-- Form Card -->
    <div class="card reveal stagger-1" style="padding:36px 32px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#e0e7ff,#6366F1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 16px rgba(99,102,241,0.2);">
          <i class="fas fa-building" style="font-size:24px;color:#fff;"></i>
        </div>
        <h1 style="font-size:22px;font-weight:800;color:#1d1d1f;letter-spacing:-.3px;">${t.entity.title}</h1>
        <p style="font-size:13px;color:#86868b;margin-top:6px;">${t.entity.subtitle}</p>
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">${t.entity.companyName} <span style="color:#ff375f;">*</span></label>
        <input id="ent-name" class="input-field" placeholder="${zh ? '例如: ABC 餐饮连锁' : 'e.g. ABC Restaurant Chain'}">
      </div>
      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">${t.entity.creditCode}</label>
        <input id="ent-code" class="input-field" placeholder="${zh ? '选填' : 'Optional'}">
      </div>
      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">${t.entity.yourRole} <span style="color:#ff375f;">*</span></label>
        <select id="ent-role" class="input-field" style="appearance:auto;cursor:pointer;">
          ${roleOpts.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:28px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">${t.entity.uploadProof}</label>
        <div class="upload-zone">
          <i class="fas fa-cloud-upload-alt" style="font-size:28px;color:#aeaeb2;margin-bottom:10px;display:block;"></i>
          <p style="font-size:13px;color:#86868b;line-height:1.6;">${zh ? '营业执照 / 授权书等' : 'Business license / authorization'}<br>
            <span style="font-size:11px;color:#aeaeb2;">${zh ? 'Demo 阶段可跳过' : 'Skip for Demo'}</span>
          </p>
        </div>
      </div>
      <button class="btn-primary" style="width:100%;" onclick="submitEntity()">
        <i class="fas fa-paper-plane"></i>${t.entity.submit}
      </button>
    </div>

    <!-- Hint -->
    <div class="reveal stagger-2" style="margin-top:20px;padding:14px 18px;background:rgba(59,130,246,0.03);border:1px solid rgba(59,130,246,0.08);border-radius:14px;">
      <p style="font-size:12px;color:#86868b;display:flex;align-items:center;gap:6px;">
        <i class="fas fa-flask" style="color:#3B82F6;"></i>
        ${zh ? 'Demo 阶段提交即通过，无需真实材料。' : 'Demo: auto-approve on submit, no real documents needed.'}
      </p>
    </div>
  </main>

  ${footerHtml(t)}

  <script>
  (function(){if(!getToken()||!getUser()){window.location.href='/'+window.location.search}})();
  async function submitEntity(){
    var n=document.getElementById('ent-name').value.trim();
    var c=document.getElementById('ent-code').value.trim();
    var r=document.getElementById('ent-role').value;
    if(!n){showToast('${zh ? '请填写公司/项目名称' : 'Please enter entity name'}','error');return}
    var res=await api('/api/entity/verify',{method:'POST',body:JSON.stringify({entityName:n,creditCode:c,role:r})});
    if(res.success){
      var u=getUser();u.entities.push(res.entity);localStorage.setItem('ic_user',JSON.stringify(u));
      showToast('${zh ? '认证成功！' : 'Verified!'}','success');
      setTimeout(function(){window.location.href='/dashboard'+window.location.search},1000);
    } else showToast(res.message||'${zh ? '提交失败' : 'Failed'}','error');
  }
  </script>`

  return c.html(shell((zh ? '主体认证 | 身份通' : 'Entity Verification | Identity Connect'), body, lang))
})


export default app
