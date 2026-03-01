import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect — V3 Business Logic Fix
// 身份是门票，发起机会/参与机会才是核心动作
// MicroConnect Product Bible V3.0
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

// ─── Data Models ───
interface User {
  id: string; phone?: string; email?: string; name: string; password?: string
  identities: Identity[]; entities: EntityAuth[]; createdAt: string
}
type IdentityRole = 'initiator' | 'participant' | 'organization'
interface Identity { role: IdentityRole; unlockedAt: string; status: 'active' | 'pending' | 'suspended' }
interface EntityAuth { entityId: string; entityName: string; role: string; verifiedAt: string }

// 机会 = Deal / Opportunity
interface Deal {
  id: string
  title: string
  entityName: string
  industry: string
  amount: string         // 融资金额
  period: string         // 回款周期
  status: 'draft' | 'pending' | 'live' | 'closed' | 'matched'
  createdAt: string
  initiatorId: string    // 发起人
  participantIds: string[] // 参与人列表
}

// ─── Demo Deals ───
const deals: Deal[] = [
  { id: 'd-001', title: 'ABC 餐饮连锁 · 华南区30店扩张', entityName: 'ABC 餐饮连锁', industry: '餐饮', amount: '¥2,000万', period: '18个月', status: 'live', createdAt: '2026-02-10', initiatorId: 'u-001', participantIds: ['u-002'] },
  { id: 'd-002', title: 'ABC 餐饮连锁 · 供应链升级', entityName: 'ABC 餐饮连锁', industry: '餐饮', amount: '¥500万', period: '12个月', status: 'pending', createdAt: '2026-02-20', initiatorId: 'u-001', participantIds: [] },
  { id: 'd-003', title: '鲜果时光 · 华东区50店', entityName: '鲜果时光', industry: '零售', amount: '¥3,500万', period: '24个月', status: 'live', createdAt: '2026-01-28', initiatorId: 'u-003', participantIds: ['u-002'] },
  { id: 'd-004', title: '快捷健身 · 全国200店', entityName: '快捷健身', industry: '健身', amount: '¥8,000万', period: '36个月', status: 'matched', createdAt: '2026-01-15', initiatorId: 'u-003', participantIds: ['u-002'] },
  { id: 'd-005', title: '茶百道加盟 · 西南区域', entityName: '茶百道', industry: '茶饮', amount: '¥1,200万', period: '12个月', status: 'live', createdAt: '2026-02-25', initiatorId: 'u-001', participantIds: [] },
]

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

// 获取用户发起的机会
function getInitiatedDeals(userId: string) { return deals.filter(d => d.initiatorId === userId) }
// 获取用户参与的机会
function getParticipatedDeals(userId: string) { return deals.filter(d => d.participantIds.includes(userId)) }


// ═══════════════════════════════════════════
// i18n — 修正业务概念
// 身份 = 门票/角色，机会 = 核心业务对象
// ═══════════════════════════════════════════
function T(lang: string) {
  const zh = lang !== 'en'
  return {
    nav: {
      title: zh ? '身份通' : 'Identity Connect',
      backToMain: zh ? '主站' : 'Main Site',
      langLabel: zh ? 'EN' : '中',
      langToggle: zh ? 'en' : 'zh',
    },
    auth: {
      welcome: zh ? '欢迎来到滴灌通' : 'Welcome to Micro Connect',
      subtitle: zh ? '收入分成投资的基础设施级平台' : 'Infrastructure-Grade Revenue-Based Investment Platform',
      libraryHint: zh ? '注册账号，选择你的角色，发起或参与投资机会' : 'Register, choose your role, originate or participate in deals',
      phoneTab: zh ? '手机号' : 'Phone',
      emailTab: zh ? '邮箱' : 'Email',
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
      subtitle: zh ? '管理你的角色与机会' : 'Manage your roles and deals',
      roleSection: zh ? '我的角色' : 'My Roles',
      entitySection: zh ? '已认证主体' : 'Verified Entities',
      dealSection: zh ? '我的机会' : 'My Deals',
      quickNav: zh ? '产品导航' : 'Product Navigation',
      addEntity: zh ? '+ 认证新主体' : '+ Verify New Entity',
      addOrgRole: zh ? '+ 添加机构身份' : '+ Add Org Role',
      noEntities: zh ? '暂无已认证主体' : 'No verified entities yet',
      verifyHint: zh ? '认证主体后可发起融资机会' : 'Verify an entity to originate deals',
      initiated: zh ? '我发起的机会' : 'Deals I Originated',
      participated: zh ? '我参与的机会' : 'Deals I Participated',
      noDealInit: zh ? '你还没有发起过机会' : 'No originated deals yet',
      noDealPart: zh ? '你还没有参与过机会' : 'No participated deals yet',
      noDealInitHint: zh ? '解锁发起机会 → 认证主体 → 去发起通上传数据' : 'Unlock originator role → verify entity → upload data in Originate Connect',
      noDealPartHint: zh ? '解锁参与机会后，可在参与通浏览和筛选机会' : 'Unlock participant role to browse and filter deals',
    },
    // 角色 = 你是谁（门票）
    roles: {
      initiator: {
        name: zh ? '发起角色' : 'Originator',
        desc: zh ? '以融资者身份发起投资机会，上传经营数据' : 'Originate deals as a fundraiser, upload business data',
        action: zh ? '去发起机会' : 'Originate a Deal',
        target: zh ? '发起通' : 'Originate Connect',
        icon: 'fa-rocket',
      },
      participant: {
        name: zh ? '参与角色' : 'Participant',
        desc: zh ? '以投资者身份浏览、筛选和参与投资机会' : 'Browse, filter, and participate in investment deals',
        action: zh ? '去看机会' : 'Browse Deals',
        target: zh ? '参与通' : 'Deal Connect',
        icon: 'fa-search-dollar',
      },
      organization: {
        name: zh ? '机构身份' : 'Institution',
        desc: zh ? '以机构身份管理机会，一个人可以在多个机构担任角色' : 'Manage deals as an institution, one person can hold multiple org roles',
        action: zh ? '添加机构身份' : 'Add Org Role',
        target: zh ? '全部通' : 'All Connects',
        icon: 'fa-building',
      },
    },
    entity: {
      title: zh ? '添加机构身份' : 'Add Org Role',
      subtitle: zh ? '认证你在该机构的身份，通过后即可以该机构名义管理机会' : 'Verify your role in an institution to manage deals under it',
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
      desc: zh ? '统一入口 · 角色解锁 · 路由中枢' : 'Unified entry · Role unlock · Routing hub',
    },
    dealStatus: {
      draft: zh ? '草稿' : 'Draft',
      pending: zh ? '审核中' : 'Pending',
      live: zh ? '招募中' : 'Live',
      closed: zh ? '已关闭' : 'Closed',
      matched: zh ? '已匹配' : 'Matched',
    },
    connects: [
      { id: 'identity', name: zh ? '身份通' : 'Identity', char: '身', color: '#5DC4B3', icon: 'fa-id-card', requires: [] as string[], status: 'live' as const, desc: zh ? '统一入口 · 角色管理' : 'Unified entry · Role management' },
      { id: 'application', name: zh ? '发起通' : 'Originate', char: '发', color: '#F59E0B', icon: 'fa-upload', requires: ['initiator'], status: 'beta' as const, desc: zh ? '发起机会 · AI打包' : 'Originate deals · AI packaging' },
      { id: 'assess', name: zh ? '评估通' : 'Assess', char: '评', color: '#6366F1', icon: 'fa-filter', requires: ['participant'], status: 'beta' as const, desc: zh ? '自建AI筛子' : 'Build AI sieves' },
      { id: 'risk', name: zh ? '风控通' : 'Risk', char: '风', color: '#6366F1', icon: 'fa-shield-alt', requires: ['participant'], status: 'live' as const, desc: zh ? '风控规则 · 验真' : 'Risk rules · Verification' },
      { id: 'opportunity', name: zh ? '参与通' : 'Deal', char: '参', color: '#10B981', icon: 'fa-handshake', requires: ['participant'], status: 'live' as const, desc: zh ? '筛后看板 · 参与决策' : 'Deal board · Participate' },
      { id: 'terms', name: zh ? '条款通' : 'Terms', char: '条', color: '#8B5CF6', icon: 'fa-sliders-h', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '三联动滑块 · 磋商' : 'Triple sliders · Negotiate' },
      { id: 'contract', name: zh ? '合约通' : 'Contract', char: '合', color: '#8B5CF6', icon: 'fa-file-contract', requires: ['initiator', 'participant'], status: 'beta' as const, desc: zh ? '电子签署 · 合规' : 'E-sign · Compliance' },
      { id: 'settlement', name: zh ? '结算通' : 'Settle', char: '结', color: '#10B981', icon: 'fa-calculator', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '大账本 · 交易记录' : 'Ledger · Transactions' },
      { id: 'performance', name: zh ? '履约通' : 'Perform', char: '履', color: '#10B981', icon: 'fa-chart-line', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '每日监控 · 回款预警' : 'Monitor · Alerts' },
    ]
  }
}


// ═══════════════════════════════════════════
// API Routes
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
  if (!['initiator', 'participant', 'organization'].includes(role)) return c.json({ success: false, message: '无效的角色类型' }, 400)
  if (u.identities.find(i => i.role === role)) return c.json({ success: false, message: '该角色已解锁' }, 400)
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
  // Auto-unlock organization identity when first entity is verified
  if (!u.identities.find(i => i.role === 'organization')) {
    const orgIdentity: Identity = { role: 'organization', unlockedAt: new Date().toISOString().split('T')[0], status: 'active' }
    u.identities.push(orgIdentity)
  }
  return c.json({ success: true, entity, user: { ...u, password: undefined } })
})

app.get('/api/entity/list', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, entities: u.entities })
})

// 发起的机会
app.get('/api/deals/initiated', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, deals: getInitiatedDeals(u.id) })
})

// 参与的机会
app.get('/api/deals/participated', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, deals: getParticipatedDeals(u.id) })
})


// ═══════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════
const LOGO = `<svg width="28" height="28" viewBox="0 0 80 80"><defs><linearGradient id="gt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gt)"/><circle cx="36" cy="44" r="22" fill="url(#gb)" opacity="0.85"/></svg>`

const LOGO_LG = `<svg width="44" height="44" viewBox="0 0 80 80"><defs><linearGradient id="gtl" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gbl" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gtl)"/><circle cx="36" cy="44" r="22" fill="url(#gbl)" opacity="0.85"/></svg>`

function shell(title: string, body: string, lang: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
  <title>${title}</title>
  <meta name="theme-color" content="#0a1a17">
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <script>
  function showToast(m,t){t=t||'info';var e=document.getElementById('toast');if(!e)return;e.textContent=m;e.className='toast '+t+' show';setTimeout(function(){e.classList.remove('show')},3000)}
  function getToken(){return localStorage.getItem('ic_token')}
  function getUser(){try{return JSON.parse(localStorage.getItem('ic_user')||'null')}catch(e){return null}}
  function setAuth(t,u){localStorage.setItem('ic_token',t);localStorage.setItem('ic_user',JSON.stringify(u))}
  function clearAuth(){localStorage.removeItem('ic_token');localStorage.removeItem('ic_user')}
  function doLogout(){clearAuth();window.location.href='/?logout=1'}
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
      new IntersectionObserver(function(e){if(e[0].isIntersecting){e[0].target.classList.add('visible')}},{threshold:0.1}).observe(el)
    });
  });
  </script>
</body>
</html>`
}


// ═══════════════════════════════════════════
// PAGE 1 — 登录/注册 (/)
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

    <nav class="navbar-dark" id="navbar">
      <div class="nav-inner">
        <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
          ${LOGO}
          <span class="font-brand" style="font-weight:700;font-size:13px;color:rgba(255,255,255,0.80);letter-spacing:1px;">MICRO CONNECT</span>
        </a>
        <div style="display:flex;align-items:center;gap:6px;">
          <a href="?lang=${t.nav.langToggle}" class="btn-ghost-dark">${t.nav.langLabel}</a>
          <a href="https://microconnect.com" class="btn-ghost-dark"><i class="fas fa-external-link-alt" style="font-size:10px;margin-right:4px;"></i>${t.nav.backToMain}</a>
        </div>
      </div>
    </nav>

    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px 20px;position:relative;z-index:2;">
      <div style="width:100%;max-width:400px;">

        <div style="text-align:center;margin-bottom:40px;">
          <div style="animation:slide-up .7s var(--ease-out-expo) forwards;">
            <div style="display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);margin-bottom:28px;">
              <div style="width:6px;height:6px;border-radius:50%;background:#34c759;animation:pulse-dot 2s infinite;"></div>
              <span style="font-size:11px;color:rgba(255,255,255,0.40);font-weight:500;letter-spacing:0.3px;">${zh ? '滴灌通平台 · 统一入口' : 'Micro Connect · Unified Entry'}</span>
            </div>

            <div style="display:flex;justify-content:center;margin-bottom:24px;">${LOGO_LG}</div>

            <h1 style="font-size:30px;font-weight:800;color:rgba(255,255,255,0.95);letter-spacing:-0.5px;line-height:1.25;margin-bottom:12px;">
              ${t.auth.welcome}
            </h1>
            <p style="font-size:14px;color:rgba(255,255,255,0.35);font-weight:400;line-height:1.7;max-width:320px;margin:0 auto;">
              ${t.auth.subtitle}
            </p>
          </div>
        </div>

        <div class="card-glass" style="padding:32px 28px;animation:scale-in .6s var(--ease-out-expo) .15s both;">
          <div style="display:flex;gap:0;margin-bottom:28px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <button class="tab-btn active" onclick="switchTab('phone')" id="tab-phone">
              <i class="fas fa-mobile-alt" style="margin-right:6px;font-size:12px;opacity:0.6;"></i>${t.auth.phoneTab}
            </button>
            <button class="tab-btn" onclick="switchTab('email')" id="tab-email">
              <i class="fas fa-envelope" style="margin-right:6px;font-size:12px;opacity:0.6;"></i>${t.auth.emailTab}
            </button>
          </div>

          <div id="form-phone">
            <div style="display:flex;gap:8px;margin-bottom:14px;">
              <input type="tel" id="inp-phone" class="input-glass" placeholder="${t.auth.phonePlaceholder}" style="flex:1;">
              <button class="btn-code" onclick="sendCode()" id="btn-code">${t.auth.getCode}</button>
            </div>
            <input type="text" id="inp-code" class="input-glass" placeholder="${t.auth.codePlaceholder}" style="margin-bottom:14px;" maxlength="6">
          </div>

          <div id="form-email" style="display:none;">
            <input type="email" id="inp-email" class="input-glass" placeholder="${t.auth.emailPlaceholder}" style="margin-bottom:14px;">
            <input type="password" id="inp-password" class="input-glass" placeholder="${t.auth.passwordPlaceholder}" style="margin-bottom:14px;">
          </div>

          <div id="name-row" style="display:none;">
            <input type="text" id="inp-name" class="input-glass" placeholder="${t.auth.namePlaceholder}" style="margin-bottom:14px;">
          </div>

          <button class="btn-primary" style="width:100%;padding:15px;margin-top:4px;" onclick="doSubmit()" id="btn-submit">
            ${t.auth.loginBtn}
          </button>

          <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.20);margin-top:16px;">${t.auth.noAccount}</p>
        </div>

        <!-- Demo -->
        <div style="margin-top:20px;padding:14px 18px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:14px;animation:fade-in 1s .4s both;">
          <p style="font-size:11px;color:rgba(255,255,255,0.22);line-height:1.8;">
            <i class="fas fa-flask" style="color:rgba(93,196,179,0.5);margin-right:5px;"></i>
            <strong style="color:rgba(255,255,255,0.35);">Demo</strong>&nbsp;
            ${zh ? '手机 13800001234 / 验证码 123456' : 'Phone 13800001234 / Code 123456'}
            <br><span style="margin-left:22px;">${zh ? '邮箱 investor@fund.com / 密码 demo123' : 'Email investor@fund.com / Pass demo123'}</span>
          </p>
        </div>

        <!-- Role hints — 正确的业务逻辑 -->
        <div style="display:flex;justify-content:center;gap:8px;margin-top:20px;animation:fade-in 1s .6s both;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);font-size:11px;color:rgba(255,255,255,0.28);">
            <i class="fas fa-rocket" style="color:#5DC4B3;font-size:9px;"></i>${zh ? '发起机会' : 'Originate'}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);font-size:11px;color:rgba(255,255,255,0.28);">
            <i class="fas fa-search-dollar" style="color:#5DC4B3;font-size:9px;"></i>${zh ? '参与机会' : 'Participate'}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);font-size:11px;color:rgba(255,255,255,0.28);">
            <i class="fas fa-building" style="color:#6366F1;font-size:9px;"></i>${zh ? '机构管理' : 'Institution'}
          </span>
        </div>
      </div>
    </div>
  </div>

  <script>
  (function(){
    var params=new URLSearchParams(window.location.search);
    if(params.get('logout')==='1'){clearAuth();params.delete('logout');var newUrl=window.location.pathname;if(params.toString())newUrl+='?'+params.toString();window.history.replaceState(null,'',newUrl);return;}
    if(getToken()&&getUser()){
      api('/api/user/profile').then(function(r){
        if(r.success){window.location.href='/dashboard'+window.location.search}
        else{clearAuth()}
      }).catch(function(){clearAuth()});
    }
  })();
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
      if(currentTab==='phone'){body.phone=document.getElementById('inp-phone').value.trim();body.verifyCode=document.getElementById('inp-code').value.trim();}
      else{body.email=document.getElementById('inp-email').value.trim();body.password=document.getElementById('inp-password').value.trim();}
      var r=await api('/api/auth/login',{method:'POST',body:JSON.stringify(body)});
      if(r.success){setAuth(r.token,r.user);showToast('${zh ? '登录成功' : 'Welcome back'}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},500);return;}
      if(r.message&&r.message.indexOf('${zh ? '不存在' : 'not exist'}')!==-1){
        if(!showName){showName=true;document.getElementById('name-row').style.display='block';showToast('${zh ? '新用户，请输入姓名完成注册' : 'New user, enter name to register'}','info');return;}
        body.name=document.getElementById('inp-name').value.trim();
        if(!body.name){showToast('${t.auth.namePlaceholder}','error');return}
        var r2=await api('/api/auth/register',{method:'POST',body:JSON.stringify(body)});
        if(r2.success){setAuth(r2.token,r2.user);showToast('${zh ? '注册成功' : 'Registered'}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},500);return;}
        showToast(r2.message,'error');
      } else {showToast(r.message||'${zh ? '操作失败' : 'Failed'}','error');}
    }catch(e){showToast('${zh ? '网络错误' : 'Network error'}','error')}
    finally{btn.disabled=false;btn.textContent='${t.auth.loginBtn}'}
  }
  </script>`

  return c.html(shell(t.nav.title + ' | ' + (zh ? '滴灌通' : 'Micro Connect'), body, lang))
})


// ═══════════════════════════════════════════
// PAGE 2 — 工作台 (/dashboard) — V4 Premium Upgrade
// 沉浸式 Profile Hero + 进度/标签项目卡片 + 增强主体卡片
// ═══════════════════════════════════════════
app.get('/dashboard', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = T(lang)
  const zh = lang !== 'en'

  const lightMap: Record<string, string> = {
    '#3B82F6': '#DBEAFE', '#3D8F83': '#e0f2ee', '#6366F1': '#E0E7FF',
    '#2d7a6e': '#d5ede8', '#8B5CF6': '#EDE9FE', '#EF4444': '#FEE2E2',
    '#5B6ECF': '#e8eeff'
  }

  const connectsHTML = t.connects.map(cn => {
    const sl = cn.status === 'live' ? (zh ? '上线' : 'Live') : cn.status === 'beta' ? 'Beta' : (zh ? '即将' : 'Soon')
    // L1-style SVG logo: white rounded rect + teal brand circles + Chinese character
    const svgIcon = `<svg viewBox="0 0 100 100" width="52" height="52" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="gt-${cn.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient>
      <linearGradient id="gb-${cn.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs>
      <rect width="100" height="100" rx="18" fill="#FFF" stroke="#E5E7EB" stroke-width="1.5"/>
      <circle cx="72" cy="26" r="11" fill="url(#gb-${cn.id})" opacity="0.85"/>
      <circle cx="78" cy="20" r="11" fill="url(#gt-${cn.id})"/>
      <text x="42" y="62" text-anchor="middle" dominant-baseline="middle" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="34" font-weight="700" fill="#1d1d1f">${(cn as any).char || ''}</text>
      <circle cx="24" cy="82" r="4" fill="#2EC4B6" opacity="0.35"/>
    </svg>`
    return `
    <div class="connect-item" data-req='${JSON.stringify(cn.requires)}' data-id="${cn.id}" onclick="clickConnect('${cn.id}','${cn.name}')" title="${cn.desc}">
      <div class="connect-icon-v2">${svgIcon}</div>
      <span style="font-size:11px;font-weight:600;color:var(--text-primary);line-height:1.3;">${cn.name}</span>
      <span class="connect-status status-${cn.status}">${sl}</span>
    </div>`
  }).join('')

  const body = `
  <nav class="navbar-dark" id="navbar" style="position:sticky;top:0;z-index:100;">
    <div class="nav-inner">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${LOGO}
        <span class="font-brand" style="font-weight:700;font-size:13px;color:rgba(255,255,255,0.80);letter-spacing:0.8px;">MICRO CONNECT</span>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;background:rgba(93,196,179,0.15);font-size:10px;font-weight:600;color:rgba(93,196,179,0.85);"><i class="fas fa-id-card" style="font-size:9px;"></i>${t.nav.title}</span>
      </a>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost-dark" style="padding:6px 12px;font-size:11px;">${t.nav.langLabel}</a>
        <button onclick="doLogout()" class="btn-ghost-dark" style="padding:6px 12px;font-size:11px;border-color:rgba(255,55,95,0.20);color:rgba(255,100,130,0.7);">
          <i class="fas fa-sign-out-alt" style="font-size:10px;"></i>
        </button>
      </div>
    </div>
  </nav>

  <!-- ===== PROFILE HERO — Immersive Aurora Header ===== -->
  <div class="profile-hero">
    <div class="orb orb-1" style="width:400px;height:400px;top:-30%;left:-10%;"></div>
    <div class="orb orb-2" style="width:350px;height:350px;bottom:-20%;right:-5%;"></div>
    <div class="profile-hero-inner">
      <div class="profile-top-row">
        <div class="profile-avatar-section">
          <div class="profile-avatar">
            <span class="profile-avatar-letter" id="avatar-letter">?</span>
            <div class="profile-avatar-ring"></div>
          </div>
          <div class="profile-info">
            <h1 class="profile-name" id="greeting">${t.dashboard.greeting}</h1>
            <p class="profile-meta" id="sub-greeting">${t.dashboard.subtitle}</p>
            <div class="profile-role-tags" id="profile-role-tags"></div>
          </div>
        </div>
        <div class="profile-actions">
          <a href="/entity-verify${lang === 'en' ? '?lang=en' : ''}" class="btn-ghost-dark" style="padding:10px 18px;font-size:12px;border-radius:10px;">
            <i class="fas fa-plus-circle" style="font-size:11px;"></i>${t.dashboard.addEntity}
          </a>
        </div>
      </div>

      <!-- Stats Ring Cards -->
      <div class="profile-stats-grid" id="stats-row"></div>
    </div>
  </div>

  <main style="max-width:1000px;margin:0 auto;padding:0 24px;">

    <!-- Role Cards -->
    <div class="reveal stagger-1" style="margin-top:32px;position:relative;z-index:3;">
      <div class="section-heading" style="margin-bottom:14px;">
        <div class="section-icon" style="background:linear-gradient(135deg,#b2e8de,#5DC4B3);"><i class="fas fa-fingerprint" style="font-size:13px;color:#fff;"></i></div>
        <h2 style="font-size:16px;font-weight:700;color:var(--text-primary);">${t.dashboard.roleSection}</h2>
        <span style="font-size:11px;color:var(--text-quaternary);margin-left:auto;">${zh ? '你的角色 = 门票' : 'Role = Ticket'}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:40px;" id="role-cards"></div>
    </div>

    <!-- My Deals — Enhanced -->
    <div class="reveal stagger-2">
      <div class="section-heading" style="margin-bottom:14px;">
        <div class="section-icon" style="background:linear-gradient(135deg,#7DD4C7,#3D8F83);"><i class="fas fa-briefcase" style="font-size:13px;color:#fff;"></i></div>
        <h2 style="font-size:16px;font-weight:700;color:var(--text-primary);">${t.dashboard.dealSection}</h2>
      </div>

      <!-- Tabs: Initiated / Participated -->
      <div class="deal-tabs-bar">
        <button class="deal-tab-v2 active" id="dtab-init" onclick="switchDealTab('init')">
          <i class="fas fa-rocket" style="font-size:11px;color:#3D8F83;"></i>${t.dashboard.initiated}
          <span class="deal-tab-count" id="count-init" style="background:rgba(61,143,131,0.10);color:#3D8F83;"></span>
        </button>
        <button class="deal-tab-v2" id="dtab-part" onclick="switchDealTab('part')">
          <i class="fas fa-search-dollar" style="font-size:11px;color:#2d7a6e;"></i>${t.dashboard.participated}
          <span class="deal-tab-count" id="count-part" style="background:rgba(45,122,110,0.10);color:#2d7a6e;"></span>
        </button>
      </div>
      <div id="deal-list" style="margin-bottom:40px;"></div>
    </div>

    <!-- Entities — Enhanced -->
    <div class="reveal stagger-3">
      <div class="section-heading" style="margin-bottom:14px;">
        <div class="section-icon" style="background:linear-gradient(135deg,#c7d2fe,#6366F1);"><i class="fas fa-building" style="font-size:13px;color:#fff;"></i></div>
        <h2 style="font-size:16px;font-weight:700;color:var(--text-primary);">${t.dashboard.entitySection}</h2>
      </div>
      <div id="entity-list" style="margin-bottom:40px;"></div>
    </div>

    <div class="divider"></div>

    <!-- 9 Connects -->
    <div class="reveal stagger-4">
      <div class="section-heading" style="margin-bottom:14px;">
        <div class="section-icon" style="background:linear-gradient(135deg,#5DC4B3,#3D8F83);"><i class="fas fa-th" style="font-size:13px;color:#fff;"></i></div>
        <h2 style="font-size:16px;font-weight:700;color:var(--text-primary);">${t.dashboard.quickNav}</h2>
        <span style="font-size:11px;color:var(--text-quaternary);margin-left:auto;">${zh ? '9个通 · 产品矩阵' : '9 Connects'}</span>
      </div>
      <div class="card" style="padding:24px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px;">${connectsHTML}</div>
      </div>
    </div>
  </main>

  <footer class="footer-aurora" style="padding:48px 24px 32px;margin-top:64px;position:relative;">
    <div style="max-width:960px;margin:0 auto;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;">
        ${LOGO}
        <span class="font-brand" style="color:rgba(255,255,255,0.75);font-weight:700;font-size:14px;letter-spacing:1px;">MICRO CONNECT</span>
      </div>
      <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.25);margin-bottom:6px;">${t.nav.title} · Identity Connect</p>
      <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.15);margin-bottom:24px;">${t.footer.desc}</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:20px;">
        <a href="https://microconnect.com" class="footer-link">${t.footer.backToMain}</a>
        <a href="#" class="footer-link">${t.footer.privacy}</a>
        <a href="#" class="footer-link">${t.footer.terms}</a>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent);margin-bottom:16px;"></div>
      <p style="text-align:center;color:rgba(255,255,255,0.12);font-size:10px;">${t.footer.copyright}</p>
    </div>
  </footer>

  <script>
  var LANG=getLang();
  var tt=function(z,e){return LANG==='en'?e:z};
  var STATUS_MAP={draft:tt('草稿','Draft'),pending:tt('审核中','Pending'),live:tt('招募中','Live'),closed:tt('已关闭','Closed'),matched:tt('已匹配','Matched')};
  var STATUS_COLOR={draft:'#86868b',pending:'#3D8F83',live:'#34c759',closed:'#86868b',matched:'#6366F1'};
  var STATUS_BG={draft:'rgba(134,134,139,0.08)',pending:'rgba(61,143,131,0.08)',live:'rgba(52,199,89,0.08)',closed:'rgba(134,134,139,0.08)',matched:'rgba(99,102,241,0.08)'};
  var PROGRESS_MAP={draft:15,pending:35,live:65,closed:100,matched:100};
  var INDUSTRY_ICONS={'餐饮':'fa-utensils','零售':'fa-store','健身':'fa-dumbbell','茶饮':'fa-mug-hot','默认':'fa-briefcase'};
  var INDUSTRY_COLORS={'餐饮':'#3D8F83','零售':'#6366F1','健身':'#2d7a6e','茶饮':'#8B5CF6','默认':'#5DC4B3'};

  var ROLES={
    initiator:{name:tt('发起机会','Originator'),icon:'fa-rocket',desc:tt('以融资者身份发起投资机会，上传经营数据','Originate deals as a fundraiser, upload business data'),action:tt('去发起机会','Originate a Deal'),target:tt('发起通','Originate Connect'),gradient:'ic-initiator',tagColor:'#3D8F83',tagBg:'rgba(61,143,131,0.12)'},
    participant:{name:tt('参与机会','Participant'),icon:'fa-search-dollar',desc:tt('以投资者身份浏览、筛选和参与投资机会','Browse, filter, and participate in deals'),action:tt('去看机会','Browse Deals'),target:tt('参与通','Deal Connect'),gradient:'ic-participant',tagColor:'#2d7a6e',tagBg:'rgba(45,122,110,0.12)'},
    organization:{name:tt('机构身份','Institution'),icon:'fa-building',desc:tt('以机构身份管理机会，一个人可以在多个机构担任角色','Manage deals as institution, hold multiple org roles'),action:tt('添加机构身份','Add Org Role'),target:tt('全部通','All Connects'),gradient:'ic-organization',tagColor:'#6366F1',tagBg:'rgba(99,102,241,0.12)'}
  };

  var initiatedDeals=[], participatedDeals=[], currentDealTab='init';

  (async function init(){
    if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return}
    var u=getUser();
    document.getElementById('greeting').textContent=tt('你好，','Hello, ')+u.name;
    document.getElementById('sub-greeting').textContent=tt('注册于 ','Member since ')+u.createdAt;
    // Avatar letter
    var al=document.getElementById('avatar-letter');
    if(al) al.textContent=u.name.charAt(0).toUpperCase();

    // Fetch deals
    try{
      var r1=await api('/api/deals/initiated');
      if(r1.success) initiatedDeals=r1.deals;
      var r2=await api('/api/deals/participated');
      if(r2.success) participatedDeals=r2.deals;
    }catch(e){}

    renderProfileTags(u);
    renderStats(u);
    renderRoles(u);
    renderDeals();
    renderEntities(u);
    updateConnects(u);
  })();

  function renderProfileTags(user){
    var c=document.getElementById('profile-role-tags');
    if(!c) return;
    var tags=user.identities.map(function(i){
      var m=ROLES[i.role];
      return '<span class="profile-tag" style="background:'+m.tagBg+';color:'+m.tagColor+';border:1px solid '+m.tagColor+'22;"><i class="fas '+m.icon+'" style="font-size:9px;"></i>'+m.name+'</span>';
    });
    if(!tags.length) tags=['<span class="profile-tag" style="background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"><i class="fas fa-lock" style="font-size:9px;"></i>'+tt('暂无角色','No roles')+'</span>'];
    c.innerHTML=tags.join('');
  }

  function renderStats(user){
    var c=document.getElementById('stats-row');
    var totalDeals=initiatedDeals.length+participatedDeals.length;
    var liveDeals=initiatedDeals.concat(participatedDeals).filter(function(d){return d.status==='live'}).length;
    var items=[
      {label:tt('解锁角色','Roles'),value:user.identities.length,max:3,icon:'fa-fingerprint',color:'#5DC4B3',bg:'rgba(93,196,179,0.12)'},
      {label:tt('发起机会','Originated'),value:initiatedDeals.length,max:10,icon:'fa-rocket',color:'#3D8F83',bg:'rgba(61,143,131,0.12)'},
      {label:tt('参与机会','Participated'),value:participatedDeals.length,max:10,icon:'fa-search-dollar',color:'#2d7a6e',bg:'rgba(45,122,110,0.12)'},
      {label:tt('招募中','Live Deals'),value:liveDeals,max:totalDeals||1,icon:'fa-signal',color:'#32ade6',bg:'rgba(50,173,230,0.12)'},
    ];
    c.innerHTML=items.map(function(s){
      var pct=Math.min(100,Math.round((s.value/s.max)*100));
      return '<div class="stat-ring-card">'+
        '<div class="stat-ring-visual" style="--ring-color:'+s.color+';--ring-pct:'+pct+';">'+
          '<svg viewBox="0 0 60 60" class="stat-ring-svg"><circle class="stat-ring-bg" cx="30" cy="30" r="24"/><circle class="stat-ring-fill" cx="30" cy="30" r="24" style="stroke:'+s.color+';stroke-dashoffset:calc(150.8 - 150.8 * '+pct+' / 100);"/></svg>'+
          '<div class="stat-ring-icon" style="background:'+s.bg+';"><i class="fas '+s.icon+'" style="font-size:14px;color:'+s.color+';"></i></div>'+
        '</div>'+
        '<div class="stat-ring-value" style="color:'+s.color+';">'+s.value+'</div>'+
        '<div class="stat-ring-label">'+s.label+'</div>'+
      '</div>';
    }).join('');
  }

  function renderRoles(user){
    var c=document.getElementById('role-cards');
    var personalRoles=['initiator','participant'];
    
    // Render personal roles (initiator, participant) — simple unlock
    var html=personalRoles.map(function(role){
      var m=ROLES[role];
      var id=user.identities.find(function(i){return i.role===role});
      var ok=!!id;
      var dealCount=role==='initiator'?initiatedDeals.length:participatedDeals.length;
      return '<div class="identity-card '+(ok?m.gradient:'ic-locked')+'">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'+
          '<div style="width:44px;height:44px;border-radius:13px;background:'+(ok?'rgba(255,255,255,0.30)':'rgba(0,0,0,0.03)')+';display:flex;align-items:center;justify-content:center;box-shadow:'+(ok?'0 2px 8px rgba(0,0,0,0.06)':'none')+';backdrop-filter:blur(8px);">'+
            '<i class="fas '+m.icon+'" style="font-size:18px;color:'+(ok?'rgba(0,0,0,0.55)':'var(--text-quaternary)')+';"></i>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:6px;">'+
            (ok?'<span class="micro-badge" style="background:rgba(255,255,255,0.40);color:rgba(0,0,0,0.50);"><i class="fas fa-check-circle" style="font-size:8px;color:#16a34a;"></i>'+tt('已解锁','Active')+'</span>':'<span class="micro-badge" style="background:rgba(0,0,0,0.03);color:var(--text-quaternary);"><i class="fas fa-lock" style="font-size:8px;"></i>'+tt('未解锁','Locked')+'</span>')+
            (ok&&dealCount>0?'<span class="micro-badge" style="background:rgba(255,255,255,0.30);color:rgba(0,0,0,0.45);"><i class="fas fa-briefcase" style="font-size:8px;"></i>'+dealCount+'</span>':'')+
          '</div>'+
        '</div>'+
        '<h3 style="font-size:16px;font-weight:700;color:'+(ok?'rgba(0,0,0,0.72)':'var(--text-secondary)')+';margin-bottom:5px;letter-spacing:-0.02em;">'+m.name+'</h3>'+
        '<p style="font-size:11.5px;color:'+(ok?'rgba(0,0,0,0.38)':'var(--text-tertiary)')+';margin-bottom:18px;line-height:1.65;">'+m.desc+'</p>'+
        (ok
          ? '<div style="display:flex;align-items:center;justify-content:space-between;">'+
              '<span style="font-size:10px;color:rgba(0,0,0,0.22);"><i class="fas fa-calendar-check" style="margin-right:3px;font-size:9px;"></i>'+id.unlockedAt+'</span>'+
              '<button class="btn-card-action" onclick="goConnect(&quot;'+role+'&quot;)">'+m.action+' <i class="fas fa-arrow-right" style="margin-left:4px;font-size:9px;"></i></button>'+
            '</div>'
          : '<button class="btn-unlock" onclick="unlockRole(&quot;'+role+'&quot;)"><i class="fas fa-lock-open" style="margin-right:6px;font-size:11px;"></i>'+tt('解锁此角色','Unlock Role')+'</button>'
        )+
      '</div>';
    }).join('');
    
    // Render organization card — special: shows entity list + add button
    var orgM=ROLES.organization;
    var entities=user.entities||[];
    var entityCount=entities.length;
    var langQ=LANG==='en'?'?lang=en':'';
    
    html+='<div class="identity-card '+(entityCount>0?orgM.gradient:'ic-locked')+'">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'+
        '<div style="width:44px;height:44px;border-radius:13px;background:'+(entityCount>0?'rgba(255,255,255,0.30)':'rgba(0,0,0,0.03)')+';display:flex;align-items:center;justify-content:center;box-shadow:'+(entityCount>0?'0 2px 8px rgba(0,0,0,0.06)':'none')+';backdrop-filter:blur(8px);">'+
          '<i class="fas '+orgM.icon+'" style="font-size:18px;color:'+(entityCount>0?'rgba(0,0,0,0.55)':'var(--text-quaternary)')+';"></i>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          (entityCount>0
            ?'<span class="micro-badge" style="background:rgba(255,255,255,0.40);color:rgba(0,0,0,0.50);"><i class="fas fa-building" style="font-size:8px;color:#6366F1;"></i>'+entityCount+tt(' 个机构',' orgs')+'</span>'
            :'<span class="micro-badge" style="background:rgba(0,0,0,0.03);color:var(--text-quaternary);"><i class="fas fa-building" style="font-size:8px;"></i>'+tt('暂无','None')+'</span>'
          )+
        '</div>'+
      '</div>'+
      '<h3 style="font-size:16px;font-weight:700;color:'+(entityCount>0?'rgba(0,0,0,0.72)':'var(--text-secondary)')+';margin-bottom:5px;letter-spacing:-0.02em;">'+orgM.name+'</h3>'+
      '<p style="font-size:11.5px;color:'+(entityCount>0?'rgba(0,0,0,0.38)':'var(--text-tertiary)')+';margin-bottom:12px;line-height:1.65;">'+orgM.desc+'</p>';
    
    // Show mini entity list inside the card
    if(entityCount>0){
      html+='<div style="margin-bottom:14px;display:flex;flex-direction:column;gap:6px;">';
      entities.forEach(function(e){
        html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:'+(entityCount>0?'rgba(255,255,255,0.35)':'rgba(0,0,0,0.02)')+';backdrop-filter:blur(6px);">'+
          '<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#e0e7ff,#c7d2fe);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
            '<i class="fas fa-store" style="font-size:10px;color:#6366F1;"></i>'+
          '</div>'+
          '<div style="flex:1;min-width:0;">'+
            '<div style="font-size:12px;font-weight:600;color:'+(entityCount>0?'rgba(0,0,0,0.60)':'var(--text-secondary)')+';line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+e.entityName+'</div>'+
            '<div style="font-size:10px;color:'+(entityCount>0?'rgba(0,0,0,0.28)':'var(--text-quaternary)')+';"><i class="fas fa-user-tag" style="margin-right:2px;font-size:8px;"></i>'+e.role+'</div>'+
          '</div>'+
          '<span style="font-size:9px;color:'+(entityCount>0?'rgba(0,0,0,0.20)':'var(--text-quaternary)')+';white-space:nowrap;">'+e.verifiedAt+'</span>'+
        '</div>';
      });
      html+='</div>';
    }
    
    // Always show add button — links to entity-verify
    html+='<a href="/entity-verify'+langQ+'" style="text-decoration:none;">'+
      '<button class="btn-unlock" style="'+(entityCount>0?'border-style:solid;background:rgba(255,255,255,0.30);border-color:rgba(99,102,241,0.20);color:rgba(0,0,0,0.50);':'')+'">'+
        '<i class="fas fa-plus-circle" style="margin-right:6px;font-size:11px;"></i>'+tt('添加机构身份','Add Org Role')+
      '</button>'+
    '</a>'+
    '</div>';
    
    c.innerHTML=html;
  }

  function switchDealTab(tab){
    currentDealTab=tab;
    document.querySelectorAll('.deal-tab-v2').forEach(function(el){el.classList.remove('active')});
    document.getElementById(tab==='init'?'dtab-init':'dtab-part').classList.add('active');
    renderDeals();
  }

  function renderDeals(){
    var c=document.getElementById('deal-list');
    var list=currentDealTab==='init'?initiatedDeals:participatedDeals;
    document.getElementById('count-init').textContent=initiatedDeals.length;
    document.getElementById('count-part').textContent=participatedDeals.length;

    if(!list.length){
      var msg=currentDealTab==='init'?tt('${t.dashboard.noDealInit}','${t.dashboard.noDealInit}'):tt('${t.dashboard.noDealPart}','${t.dashboard.noDealPart}');
      var hint=currentDealTab==='init'?tt('解锁发起机会 → 认证主体 → 去发起通上传数据','Unlock originator → verify entity → upload data'):tt('解锁参与机会后，可在参与通浏览和筛选机会','Unlock participant to browse deals');
      c.innerHTML='<div class="card" style="padding:40px;text-align:center;">'+
        '<div style="width:56px;height:56px;border-radius:16px;background:rgba(93,196,179,0.06);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">'+
          '<i class="fas fa-briefcase" style="font-size:22px;color:var(--text-quaternary);"></i></div>'+
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">'+msg+'</p>'+
        '<p style="font-size:12px;color:var(--text-quaternary);line-height:1.6;max-width:320px;margin:0 auto;">'+hint+'</p></div>';
      return;
    }

    c.innerHTML='<div class="deal-grid">'+list.map(function(d){
      var sc=STATUS_COLOR[d.status]||'#86868b';
      var sl=STATUS_MAP[d.status]||d.status;
      var bg=STATUS_BG[d.status]||'rgba(0,0,0,0.04)';
      var pct=PROGRESS_MAP[d.status]||0;
      var indIcon=INDUSTRY_ICONS[d.industry]||INDUSTRY_ICONS['默认'];
      var indColor=INDUSTRY_COLORS[d.industry]||INDUSTRY_COLORS['默认'];
      var isInit=currentDealTab==='init';
      var partCount=d.participantIds?d.participantIds.length:0;

      return '<div class="deal-card-v2">'+
        '<div class="deal-card-header">'+
          '<div class="deal-card-icon" style="background:linear-gradient(135deg,'+(isInit?'#e0f2ee,#5DC4B3':'#d5ede8,#49A89A')+');">'+
            '<i class="fas '+(isInit?'fa-rocket':'fa-search-dollar')+'" style="font-size:16px;color:'+(isInit?'#2d6b5f':'#1f5e54')+';"></i>'+
          '</div>'+
          '<div class="deal-card-title-wrap">'+
            '<div class="deal-card-title">'+d.title+'</div>'+
            '<div class="deal-card-entity"><i class="fas fa-store" style="font-size:9px;margin-right:3px;color:var(--text-quaternary);"></i>'+d.entityName+'</div>'+
          '</div>'+
          '<span class="deal-status-pill" style="background:'+bg+';color:'+sc+';border:1px solid '+sc+'18;">'+
            '<span class="deal-status-dot" style="background:'+sc+';'+(d.status==='live'?'animation:pulse-dot 2s infinite;':'')+'"></span>'+sl+
          '</span>'+
        '</div>'+
        // Tags row
        '<div class="deal-card-tags">'+
          '<span class="deal-tag" style="background:'+indColor+'12;color:'+indColor+';border:1px solid '+indColor+'18;"><i class="fas '+indIcon+'" style="font-size:9px;"></i>'+d.industry+'</span>'+
          '<span class="deal-tag" style="background:rgba(61,143,131,0.06);color:#3D8F83;border:1px solid rgba(61,143,131,0.10);"><i class="fas fa-coins" style="font-size:9px;"></i>'+d.amount+'</span>'+
          '<span class="deal-tag" style="background:rgba(99,102,241,0.06);color:#6366F1;border:1px solid rgba(99,102,241,0.10);"><i class="fas fa-clock" style="font-size:9px;"></i>'+d.period+'</span>'+
          (partCount>0?'<span class="deal-tag" style="background:rgba(45,122,110,0.06);color:#2d7a6e;border:1px solid rgba(45,122,110,0.10);"><i class="fas fa-users" style="font-size:9px;"></i>'+partCount+tt(' 参与',' joined')+'</span>':'')+
        '</div>'+
        // Progress bar
        '<div class="deal-progress-wrap">'+
          '<div class="deal-progress-bar"><div class="deal-progress-fill" style="width:'+pct+'%;background:'+sc+';"></div></div>'+
          '<div class="deal-progress-meta">'+
            '<span>'+d.createdAt+'</span>'+
            '<span style="color:'+sc+';font-weight:600;">'+pct+'%</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('')+'</div>';
  }

  function renderEntities(user){
    var c=document.getElementById('entity-list');
    if(!user.entities||!user.entities.length){
      c.innerHTML='<div class="card" style="padding:40px;text-align:center;">'+
        '<div style="width:56px;height:56px;border-radius:16px;background:rgba(99,102,241,0.06);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">'+
          '<i class="fas fa-building" style="font-size:22px;color:var(--text-quaternary);"></i></div>'+
        '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">'+tt('暂无已认证主体','No verified entities yet')+'</p>'+
        '<p style="font-size:12px;color:var(--text-quaternary);line-height:1.6;max-width:320px;margin:0 auto;">'+tt('认证主体后可发起融资机会','Verify an entity to originate deals')+'</p></div>';
      return;
    }
    c.innerHTML=user.entities.map(function(e){
      // Count deals for this entity
      var relatedDeals=initiatedDeals.filter(function(d){return d.entityName===e.entityName});
      var liveCount=relatedDeals.filter(function(d){return d.status==='live'}).length;
      return '<div class="entity-card-v2">'+
        '<div class="entity-card-left">'+
          '<div class="entity-card-icon">'+
            '<i class="fas fa-store" style="font-size:16px;color:#6366f1;"></i>'+
            '<span class="entity-verified-badge"><i class="fas fa-check" style="font-size:7px;color:#fff;"></i></span>'+
          '</div>'+
          '<div class="entity-card-info">'+
            '<div class="entity-card-name">'+e.entityName+'</div>'+
            '<div class="entity-card-meta">'+
              '<span><i class="fas fa-user-tag" style="margin-right:3px;font-size:9px;"></i>'+e.role+'</span>'+
              '<span class="entity-meta-dot"></span>'+
              '<span>'+e.verifiedAt+'</span>'+
            '</div>'+
            '<div class="entity-card-tags">'+
              (relatedDeals.length>0?'<span class="entity-mini-tag"><i class="fas fa-briefcase" style="font-size:8px;"></i>'+relatedDeals.length+tt(' 个机会',' deals')+'</span>':'')+
              (liveCount>0?'<span class="entity-mini-tag entity-mini-tag-live"><i class="fas fa-signal" style="font-size:8px;"></i>'+liveCount+tt(' 招募中',' live')+'</span>':'')+
              '<span class="entity-mini-tag entity-mini-tag-verified"><i class="fas fa-shield-alt" style="font-size:8px;"></i>'+tt('已认证','Verified')+'</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<button class="entity-enter-btn" onclick="showToast(&quot;'+tt('协作空间开发中','Workspace coming soon')+'&quot;,&quot;info&quot;)">'+
          '<i class="fas fa-arrow-right" style="font-size:11px;"></i>'+
        '</button>'+
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
    });
  }

  async function unlockRole(role){
    var r=await api('/api/user/unlock',{method:'POST',body:JSON.stringify({role:role})});
    if(r.success){
      var u=getUser();u.identities.push(r.identity);localStorage.setItem('ic_user',JSON.stringify(u));
      showToast(tt('角色解锁成功','Role unlocked!'),'success');
      renderProfileTags(u);renderStats(u);renderRoles(u);updateConnects(u);
    } else showToast(r.message,'error');
  }

  function goConnect(role){
    var m=ROLES[role];
    showToast(tt('即将跳转到'+m.target+'（开发中）','Redirecting to '+m.target+' (coming soon)'),'info');
  }
  function clickConnect(id,name){
    if(id==='identity'){showToast(tt('你已在身份通','You are in Identity Connect'),'info');return}
    var el=document.querySelector('[data-id="'+id+'"]');
    if(el&&el.classList.contains('disabled')){showToast(tt('需先解锁对应角色','Unlock required role first'),'error');return}
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
  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${LOGO}
        <span class="font-brand" style="font-weight:700;font-size:13px;color:var(--text-primary);letter-spacing:0.8px;">MICRO CONNECT</span>
        <span class="badge badge-brand" style="font-size:10px;"><i class="fas fa-id-card" style="font-size:9px;"></i>${t.nav.title}</span>
      </a>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost" style="padding:7px 12px;font-size:12px;">${t.nav.langLabel}</a>
        <span id="nav-user" style="font-size:13px;color:var(--text-tertiary);font-weight:500;"></span>
        <button onclick="doLogout()" class="btn-ghost" style="padding:7px 12px;font-size:12px;color:var(--error);border-color:rgba(255,55,95,0.12);">
          <i class="fas fa-sign-out-alt" style="font-size:11px;"></i>
        </button>
      </div>
    </div>
  </nav>

  <main style="max-width:520px;margin:0 auto;padding:32px 20px 0;">
    <div class="reveal" style="margin-bottom:24px;">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--brand-dark);text-decoration:none;font-weight:500;transition:opacity .2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
        <i class="fas fa-arrow-left" style="font-size:11px;"></i>${t.entity.backToDash}
      </a>
    </div>

    <div class="card reveal stagger-1" style="padding:36px 28px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#e0e7ff,#6366F1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 16px rgba(99,102,241,0.15);">
          <i class="fas fa-building" style="font-size:22px;color:#fff;"></i>
        </div>
        <h1 style="font-size:20px;font-weight:800;color:var(--text-primary);">${t.entity.title}</h1>
        <p style="font-size:13px;color:var(--text-tertiary);margin-top:6px;">${t.entity.subtitle}</p>
      </div>

      <div style="margin-bottom:18px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${t.entity.companyName} <span style="color:var(--error);">*</span></label>
        <input id="ent-name" class="input-field" placeholder="${zh ? '例如: ABC 餐饮连锁' : 'e.g. ABC Restaurant Chain'}">
      </div>
      <div style="margin-bottom:18px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${t.entity.creditCode}</label>
        <input id="ent-code" class="input-field" placeholder="${zh ? '选填' : 'Optional'}">
      </div>
      <div style="margin-bottom:18px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${t.entity.yourRole} <span style="color:var(--error);">*</span></label>
        <select id="ent-role" class="input-field" style="appearance:auto;cursor:pointer;">
          ${roleOpts.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:28px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${t.entity.uploadProof}</label>
        <div class="upload-zone">
          <i class="fas fa-cloud-upload-alt" style="font-size:24px;color:var(--text-quaternary);margin-bottom:8px;display:block;"></i>
          <p style="font-size:12px;color:var(--text-tertiary);">${zh ? '营业执照 / 授权书等' : 'Business license / authorization'}</p>
          <p style="font-size:11px;color:var(--text-quaternary);margin-top:4px;">${zh ? 'Demo 阶段可跳过' : 'Skip for Demo'}</p>
        </div>
      </div>
      <button class="btn-primary" style="width:100%;" onclick="submitEntity()">
        <i class="fas fa-paper-plane" style="font-size:13px;"></i>${t.entity.submit}
      </button>
    </div>

    <div class="reveal stagger-2" style="margin-top:16px;padding:12px 16px;background:rgba(93,196,179,0.03);border:1px solid rgba(93,196,179,0.08);border-radius:12px;">
      <p style="font-size:11px;color:var(--text-tertiary);display:flex;align-items:center;gap:6px;">
        <i class="fas fa-flask" style="color:var(--brand);font-size:10px;"></i>
        ${zh ? 'Demo 阶段提交即通过，无需真实材料。' : 'Demo: auto-approve on submit, no real documents needed.'}
      </p>
    </div>
  </main>

  <footer class="footer-aurora" style="padding:48px 24px 32px;margin-top:64px;position:relative;">
    <div style="max-width:960px;margin:0 auto;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;">
        ${LOGO}
        <span class="font-brand" style="color:rgba(255,255,255,0.75);font-weight:700;font-size:14px;letter-spacing:1px;">MICRO CONNECT</span>
      </div>
      <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.25);margin-bottom:6px;">${t.nav.title} · Identity Connect</p>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent);margin:20px 0 16px;"></div>
      <p style="text-align:center;color:rgba(255,255,255,0.12);font-size:10px;">${t.footer.copyright}</p>
    </div>
  </footer>

  <script>
  (function(){
    if(!getToken()||!getUser()){window.location.href='/'+window.location.search}
    var u=getUser();var nu=document.getElementById('nav-user');if(nu&&u)nu.textContent=u.name;
  })();
  async function submitEntity(){
    var n=document.getElementById('ent-name').value.trim();
    var c=document.getElementById('ent-code').value.trim();
    var r=document.getElementById('ent-role').value;
    if(!n){showToast('${zh ? '请填写公司/项目名称' : 'Please enter entity name'}','error');return}
    var res=await api('/api/entity/verify',{method:'POST',body:JSON.stringify({entityName:n,creditCode:c,role:r})});
    if(res.success){
      // Update local user with full user data from server (includes new entity + auto-unlocked org identity)
      if(res.user){localStorage.setItem('ic_user',JSON.stringify(res.user));}
      else{var u=getUser();u.entities.push(res.entity);localStorage.setItem('ic_user',JSON.stringify(u));}
      showToast('${zh ? '机构身份认证成功' : 'Org role verified!'}','success');
      setTimeout(function(){window.location.href='/dashboard'+window.location.search},800);
    } else showToast(res.message||'${zh ? '提交失败' : 'Failed'}','error');
  }
  </script>`

  return c.html(shell((zh ? '主体认证 | 身份通' : 'Entity Verification | Identity Connect'), body, lang))
})


export default app
