import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect — V5.0
// MicroConnect Product Bible V3.0 严格对齐版
// 以人为单位的万能工作台 · 解锁身份 · 路由中枢
// ═══════════════════════════════════════════════════════

const app = new Hono()
app.use('/api/*', cors())

// ─── JWT Helpers (Demo — Web Crypto for CF Workers) ───
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

// Deal & Participation (for dashboard overview)
interface Deal {
  id: string; title: string; entityName: string; industry: string; amount: string
  status: string; createdAt: string; updatedAt: string; initiatorId: string
  monthlyRevenue?: string; term?: string; progress?: number
}
interface Participation {
  id: string; dealId: string; dealTitle: string; entityName: string; industry: string
  amount: string; status: string; joinedAt: string; updatedAt: string; participantId: string
  committedAmount?: string; expectedReturn?: string; riskScore?: string
}

// ─── Mock Data ───
const deals: Deal[] = [
  { id:'d-001', title:'ABC 餐饮连锁 — 华南区扩张', entityName:'ABC 餐饮连锁', industry:'餐饮', amount:'500万', status:'live', createdAt:'2026-01-25', updatedAt:'2026-02-20', initiatorId:'u-001', monthlyRevenue:'120万/月', term:'24个月', progress:75 },
  { id:'d-002', title:'ABC 餐饮连锁 — 供应链升级', entityName:'ABC 餐饮连锁', industry:'餐饮', amount:'200万', status:'under_review', createdAt:'2026-02-15', updatedAt:'2026-02-25', initiatorId:'u-001', monthlyRevenue:'120万/月', term:'12个月', progress:40 },
  { id:'d-003', title:'ABC 餐饮连锁 — 新品牌孵化', entityName:'ABC 餐饮连锁', industry:'餐饮', amount:'800万', status:'draft', createdAt:'2026-02-26', updatedAt:'2026-02-26', initiatorId:'u-001', term:'36个月', progress:10 },
  { id:'d-010', title:'鲜茶工坊 — 全国加盟融资', entityName:'鲜茶工坊', industry:'茶饮', amount:'1200万', status:'live', createdAt:'2026-01-10', updatedAt:'2026-02-18', initiatorId:'u-003', monthlyRevenue:'280万/月', term:'36个月', progress:60 },
  { id:'d-011', title:'快剪工坊 — 社区店扩张', entityName:'快剪工坊', industry:'美业', amount:'300万', status:'approved', createdAt:'2026-02-01', updatedAt:'2026-02-22', initiatorId:'u-003', monthlyRevenue:'45万/月', term:'18个月', progress:55 }
]
const participations: Participation[] = [
  { id:'p-001', dealId:'d-010', dealTitle:'鲜茶工坊 — 全国加盟融资', entityName:'鲜茶工坊', industry:'茶饮', amount:'1200万', status:'committed', joinedAt:'2026-01-20', updatedAt:'2026-02-18', participantId:'u-001', committedAmount:'100万', expectedReturn:'12.5%', riskScore:'A' },
  { id:'p-002', dealId:'d-011', dealTitle:'快剪工坊 — 社区店扩张', entityName:'快剪工坊', industry:'美业', amount:'300万', status:'evaluating', joinedAt:'2026-02-10', updatedAt:'2026-02-22', participantId:'u-001', riskScore:'B+' },
  { id:'p-010', dealId:'d-001', dealTitle:'ABC 餐饮连锁 — 华南区扩张', entityName:'ABC 餐饮连锁', industry:'餐饮', amount:'500万', status:'signed', joinedAt:'2026-02-01', updatedAt:'2026-02-20', participantId:'u-002', committedAmount:'200万', expectedReturn:'15%', riskScore:'A-' },
  { id:'p-011', dealId:'d-010', dealTitle:'鲜茶工坊 — 全国加盟融资', entityName:'鲜茶工坊', industry:'茶饮', amount:'1200万', status:'committed', joinedAt:'2026-01-15', updatedAt:'2026-02-10', participantId:'u-002', committedAmount:'500万', expectedReturn:'11%', riskScore:'A' }
]
const users: User[] = [
  { id:'u-001', phone:'13800001234', name:'张三', identities:[{ role:'initiator', unlockedAt:'2026-01-15', status:'active' },{ role:'participant', unlockedAt:'2026-02-01', status:'active' }], entities:[{ entityId:'e-001', entityName:'ABC 餐饮连锁', role:'法人代表', verifiedAt:'2026-01-20' }], createdAt:'2026-01-10' },
  { id:'u-002', email:'investor@fund.com', name:'李四', password:'demo123', identities:[{ role:'participant', unlockedAt:'2026-01-08', status:'active' },{ role:'organization', unlockedAt:'2026-01-10', status:'active' }], entities:[{ entityId:'e-010', entityName:'新锐资本', role:'投资总监', verifiedAt:'2026-01-12' }], createdAt:'2026-01-05' },
  { id:'u-003', phone:'13900005678', name:'王五', identities:[{ role:'initiator', unlockedAt:'2026-02-20', status:'active' }], entities:[], createdAt:'2026-02-18' }
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
// i18n TEXT Object (Product Bible 身份通 Prompt §完整i18n)
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
      loginBtn: zh ? '登录' : 'Login',
      registerBtn: zh ? '注册' : 'Register',
      noAccount: zh ? '没有账号？' : 'No account yet? ',
      hasAccount: zh ? '已有账号？' : 'Have an account? ',
      registerLink: zh ? '点此注册' : 'Register',
      loginLink: zh ? '点此登录' : 'Login',
    },
    dashboard: {
      greeting: zh ? '你好' : 'Hello',
      manageIdentity: zh ? '管理你的身份，开启不同的工作流' : 'Manage your identities, unlock different workflows',
      identitySection: zh ? '功能身份' : 'Functional Identities',
      entitySection: zh ? '已认证主体' : 'Verified Entities',
      quickNav: zh ? '快捷导航' : 'Quick Navigation',
      unlocked: zh ? '已解锁' : 'Unlocked',
      locked: zh ? '未解锁' : 'Not Unlocked',
      unlock: zh ? '解锁身份' : 'Unlock',
      enter: zh ? '进入' : 'Enter',
      addEntity: zh ? '+ 认证新主体' : '+ Verify New Entity',
      enterWorkspace: zh ? '进入协作空间' : 'Enter Workspace',
      sinceDate: zh ? '注册于 ' : 'Since ',
      initiatedDeals: zh ? '我发起的机会' : 'Deals I Originated',
      participatedDeals: zh ? '我参与的机会' : 'Deals I Participated In',
      noEntities: zh ? '暂无已认证主体' : 'No verified entities yet',
      verifyHint: zh ? '认证主体后可进入协作空间' : 'Verify an entity to access workspace',
    },
    identities: {
      initiator: {
        name: zh ? '发起身份' : 'Initiator',
        desc: zh ? '上传经营数据，发起融资申请' : 'Upload data, initiate financing',
        target: zh ? '发起通' : 'Originate Connect',
        cta: zh ? '进入发起通' : 'Enter Originate',
      },
      participant: {
        name: zh ? '参与身份' : 'Participant',
        desc: zh ? '浏览投资项目，搭建评估筛子' : 'Browse deals, build assessment sieves',
        target: zh ? '参与通' : 'Deal Connect',
        cta: zh ? '进入参与通' : 'Enter Deal',
      },
      organization: {
        name: zh ? '机构身份' : 'Organization',
        desc: zh ? '机构级批量操作和自定义工作流' : 'Institutional batch operations & custom workflows',
        target: zh ? '全部通' : 'All Connects',
        cta: zh ? '进入机构工作台' : 'Enter Org Workspace',
      }
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
      roles: {
        legal: zh ? '法人代表' : 'Legal Representative',
        finance: zh ? '财务' : 'Finance',
        admin: zh ? '管理员' : 'Administrator',
        other: zh ? '其他' : 'Other',
      }
    },
    footer: {
      copyright: zh ? '© 2026 Micro Connect Group. 保留所有权利。' : '© 2026 Micro Connect Group. All rights reserved.',
      privacy: zh ? '隐私政策' : 'Privacy Policy',
      terms: zh ? '服务条款' : 'Terms of Service',
      backToMain: zh ? '返回主站' : 'Back to Main Site',
      desc: zh ? '以人为单位的万能工作台 · 解锁身份 · 路由中枢' : 'Universal workspace per person · Unlock identity · Routing hub',
    },
    stats: {
      identities: zh ? '已解锁身份' : 'Identities',
      entities: zh ? '已认证主体' : 'Entities',
      initiated: zh ? '发起的机会' : 'Originated',
      participated: zh ? '参与的机会' : 'Participated',
    },
    flow: {
      yTitle: zh ? 'Y 型业务流程' : 'Y-shaped Workflow',
      yDesc: zh ? '身份通是统一入口，根据解锁的身份自动分流' : 'Identity Connect routes you based on your unlocked roles',
      borrowerPath: zh ? '融资者路径' : 'Borrower Path',
      investorPath: zh ? '投资者路径' : 'Investor Path',
      convergence: zh ? '交易达成 · 投后管理' : 'Deal Making · Post-Investment',
    }
  }
}


// ═══════════════════════════════════════════
// 9 Connects Full Product Data (Product Bible §3)
// ═══════════════════════════════════════════

const CONNECTS = [
  { id:'identity',    zh:'身份通', en:'Identity',    icon:'fa-id-card',       color:'#3B82F6', lightColor:'#DBEAFE', status:'live',   requires:[] as string[],                     logoUrl:'https://www.genspark.ai/api/files/s/2UNypAIm', desc_zh:'以人为单位的万能工作台 · 解锁身份 · 路由中枢', desc_en:'Universal workspace · Unlock identity · Routing hub' },
  { id:'application', zh:'发起通', en:'Originate',   icon:'fa-upload',        color:'#F59E0B', lightColor:'#FEF3C7', status:'beta',   requires:['initiator'],                       logoUrl:'https://www.genspark.ai/api/files/s/sGTxJUcV', desc_zh:'发起融资 · 丢材料 · AI 打包成书', desc_en:'Initiate financing · Upload data · AI packaging' },
  { id:'assess',      zh:'评估通', en:'Assess',      icon:'fa-filter',        color:'#6366F1', lightColor:'#E0E7FF', status:'beta',   requires:['participant'],                     logoUrl:'https://www.genspark.ai/api/files/s/UJuchZc6', desc_zh:'投资者自建 AI 筛子 · 多 Agent 分析', desc_en:'Build AI sieves · Multi-agent analysis' },
  { id:'risk',        zh:'风控通', en:'Risk',        icon:'fa-shield-alt',    color:'#6366F1', lightColor:'#E0E7FF', status:'live',   requires:['participant'],                     logoUrl:'https://www.genspark.ai/api/files/s/SrCHke7M', desc_zh:'自定义风控规则 · 材料验真', desc_en:'Custom risk rules · Document verification' },
  { id:'opportunity', zh:'参与通', en:'Deal',        icon:'fa-handshake',     color:'#10B981', lightColor:'#D1FAE5', status:'live',   requires:['participant'],                     logoUrl:'https://www.genspark.ai/api/files/s/UJuchZc6', desc_zh:'参与投资 · 筛后项目看板 · 投资决策', desc_en:'Participate · Filtered deal board · Decision' },
  { id:'terms',       zh:'条款通', en:'Terms',       icon:'fa-sliders-h',     color:'#8B5CF6', lightColor:'#EDE9FE', status:'coming', requires:['initiator','participant'],          logoUrl:'https://www.genspark.ai/api/files/s/xnam27pA', desc_zh:'三联动滑块 · 投融资双方磋商', desc_en:'Triple-linked sliders · Deal negotiation' },
  { id:'contract',    zh:'合约通', en:'Contract',    icon:'fa-file-contract', color:'#8B5CF6', lightColor:'#EDE9FE', status:'beta',   requires:['initiator','participant'],          logoUrl:'https://www.genspark.ai/api/files/s/8qGcHXYE', desc_zh:'电子合约签署 · 法律合规', desc_en:'E-contract signing · Legal compliance' },
  { id:'settlement',  zh:'结算通', en:'Settlement',  icon:'fa-calculator',    color:'#EF4444', lightColor:'#FEE2E2', status:'coming', requires:['initiator','participant'],          logoUrl:'https://www.genspark.ai/api/files/s/AONkBaFh', desc_zh:'大账本 · 记录所有交易数据', desc_en:'Ledger · All transaction records' },
  { id:'performance', zh:'履约通', en:'Performance', icon:'fa-chart-line',    color:'#EF4444', lightColor:'#FEE2E2', status:'coming', requires:['initiator','participant'],          logoUrl:'https://www.genspark.ai/api/files/s/goK923ZW', desc_zh:'每日监控 · 回款预警 · 投后追踪', desc_en:'Daily monitoring · Repayment alerts' },
]


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

app.get('/api/deals/initiated', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, deals: deals.filter(d => d.initiatorId === u.id) })
})

app.get('/api/deals/participated', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, participations: participations.filter(p => p.participantId === u.id) })
})


// ═══════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════

const SVG_LOGO = `<svg width="32" height="32" viewBox="0 0 80 80"><defs><linearGradient id="gt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gt)"/><circle cx="36" cy="44" r="22" fill="url(#gb)" opacity="0.85"/></svg>`

function htmlShell(title: string, body: string, lang: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
  <title>${title}</title>
  <meta name="theme-color" content="#0a0f1e">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
  tailwind.config={theme:{extend:{fontFamily:{sans:['-apple-system','BlinkMacSystemFont','Inter','SF Pro Display','Segoe UI','Roboto','Noto Sans SC','sans-serif'],display:['-apple-system','BlinkMacSystemFont','Inter','SF Pro Display','Segoe UI','sans-serif'],mono:['Montserrat','Inter','Futura','Helvetica Neue','sans-serif']},colors:{brand:{DEFAULT:'#5DC4B3',light:'#7DD4C7',dark:'#3D8F83',accent:'#49A89A'},logo:{bright:'#2EC4B6',bright2:'#3DD8CA',deep:'#28A696'},identity:{light:'#DBEAFE',DEFAULT:'#3B82F6',dark:'#2563EB'},semantic:{info:'#32ade6',success:'#34c759',warning:'#ff9f0a',error:'#ff375f'},text:{primary:'#1d1d1f',title:'#1a1a1a',secondary:'#6e6e73',tertiary:'#86868b',placeholder:'#aeaeb2'},surface:{page:'#f5f5f7',card:'rgba(255,255,255,0.88)',divider:'#f1f5f9'}},borderRadius:{xs:'4px',sm:'8px',md:'12px',lg:'16px',xl:'20px','2xl':'24px','3xl':'32px'}}}}
  </script>
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
  <link href="/static/style.css" rel="stylesheet">
</head>
<body>
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
  <div id="toast" class="toast"></div>
  ${body}
  <script>
  window.addEventListener('scroll',function(){var n=document.getElementById('navbar');if(n)n.classList.toggle('scrolled',window.scrollY>10)});
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.reveal').forEach(function(el){
      new IntersectionObserver(function(e){if(e[0].isIntersecting){e[0].target.classList.add('visible')}},{threshold:0.15}).observe(el)
    });
    var u=getUser();var el=document.getElementById('nav-username');if(el&&u)el.textContent=u.name;
  });
  </script>
</body>
</html>`
}

function navbarGlass(t: ReturnType<typeof T>): string {
  return `
  <nav class="navbar-glass" id="navbar">
    <div class="nav-inner">
      <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${SVG_LOGO}
        <span class="font-brand" style="font-weight:700;font-size:14px;color:rgba(255,255,255,0.9);letter-spacing:0.5px;">MICRO CONNECT</span>
      </a>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5);"><i class="fas fa-id-card" style="margin-right:4px;color:#93C5FD;"></i>${t.nav.title}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost-light">${t.nav.langLabel}</a>
        <a href="https://microconnect.com" class="btn-ghost-light">${t.nav.backToMain}</a>
      </div>
    </div>
  </nav>`
}

function navbarLight(t: ReturnType<typeof T>, lang: string): string {
  return `
  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a href="/dashboard${lang==='en'?'?lang=en':''}" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${SVG_LOGO}
        <span class="font-brand" style="font-weight:700;font-size:14px;color:#1d1d1f;letter-spacing:0.5px;">MICRO CONNECT</span>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;background:rgba(59,130,246,0.08);font-size:11px;font-weight:600;color:#3B82F6;"><i class="fas fa-id-card" style="font-size:10px;"></i>${t.nav.title}</span>
      </a>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost" style="padding:6px 12px;font-size:12px;">${t.nav.langLabel}</a>
        <span id="nav-username" style="font-size:13px;color:#6e6e73;font-weight:500;"></span>
        <button onclick="doLogout()" class="btn-ghost" style="padding:6px 12px;font-size:12px;color:#ff375f;border-color:rgba(255,55,95,0.15);">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </nav>`
}

function footer(t: ReturnType<typeof T>): string {
  return `
  <footer class="footer-aurora" style="padding:56px 24px 36px;margin-top:80px;position:relative;">
    <div style="max-width:1200px;margin:0 auto;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:20px;">
        ${SVG_LOGO}
        <span class="font-brand" style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;letter-spacing:1px;">MICRO CONNECT</span>
      </div>
      <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:24px;">${t.footer.desc}</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:24px;">
        <a href="https://microconnect.com" class="footer-link">${t.footer.backToMain}</a>
        <a href="#" class="footer-link">${t.footer.privacy}</a>
        <a href="#" class="footer-link">${t.footer.terms}</a>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:20px;"></div>
      <p style="text-align:center;color:rgba(255,255,255,0.25);font-size:11px;">${t.footer.copyright}</p>
    </div>
  </footer>`
}


// ═══════════════════════════════════════════
// PAGE 1 — Login / Register (/)
// 📚 图书馆比喻: 办借书证
// ═══════════════════════════════════════════
app.get('/', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = T(lang)

  const body = `
  <div class="hero-immersive">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    ${navbarGlass(t)}

    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;z-index:2;">
      <div style="width:100%;max-width:440px;">

        <!-- Hero -->
        <div style="text-align:center;margin-bottom:40px;animation:slide-up 0.8s var(--ease-out-expo) forwards;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.15);margin-bottom:24px;">
            <div style="width:6px;height:6px;border-radius:50%;background:#34c759;animation:pulse-dot 2s infinite;"></div>
            <span style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;">${lang !== 'en' ? '滴灌通平台 · 统一入口' : 'Micro Connect · Unified Entry'}</span>
          </div>
          <h1 style="font-size:36px;font-weight:800;color:white;letter-spacing:-0.5px;line-height:1.2;margin-bottom:12px;">
            ${t.auth.welcome}
          </h1>
          <p style="font-size:15px;color:rgba(255,255,255,0.45);font-weight:400;line-height:1.6;max-width:340px;margin:0 auto 16px;">
            ${t.auth.subtitle}
          </p>
          <p style="font-size:13px;color:rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;gap:6px;">
            <span style="font-size:16px;">&#128218;</span> ${t.auth.libraryHint}
          </p>
        </div>

        <!-- Login Card -->
        <div class="card-glass" style="padding:36px 32px;animation:scale-in 0.6s var(--ease-out-expo) 0.2s both;">
          <!-- Tabs -->
          <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:28px;">
            <button class="tab-btn active" onclick="switchTab('phone')" id="tab-phone">
              <i class="fas fa-mobile-alt" style="margin-right:6px;font-size:13px;"></i>${t.auth.phoneTab}
            </button>
            <button class="tab-btn" onclick="switchTab('email')" id="tab-email">
              <i class="fas fa-envelope" style="margin-right:6px;font-size:13px;"></i>${t.auth.emailTab}
            </button>
          </div>

          <!-- Phone -->
          <div id="form-phone">
            <div style="display:flex;gap:8px;margin-bottom:16px;">
              <input type="tel" id="inp-phone" class="input-glass" placeholder="${t.auth.phonePlaceholder}" style="flex:1;">
              <button class="verify-code-btn" onclick="sendCode()" id="btn-code">${t.auth.getCode}</button>
            </div>
            <input type="text" id="inp-code" class="input-glass" placeholder="${t.auth.codePlaceholder}" style="margin-bottom:16px;" maxlength="6">
          </div>

          <!-- Email -->
          <div id="form-email" style="display:none;">
            <input type="email" id="inp-email" class="input-glass" placeholder="${t.auth.emailPlaceholder}" style="margin-bottom:16px;">
            <input type="password" id="inp-password" class="input-glass" placeholder="${t.auth.passwordPlaceholder}" style="margin-bottom:16px;">
          </div>

          <!-- Name (register) -->
          <div id="name-field" style="display:none;">
            <input type="text" id="inp-name" class="input-glass" placeholder="${t.auth.namePlaceholder}" style="margin-bottom:16px;">
          </div>

          <!-- Submit -->
          <button class="btn-primary" style="width:100%;margin-bottom:20px;padding:16px;box-shadow:0 0 24px rgba(59,130,246,0.35),0 4px 16px rgba(59,130,246,0.25);border:1px solid rgba(59,130,246,0.3);" onclick="doSubmit()" id="btn-submit">
            ${t.auth.loginBtn}
          </button>

          <!-- Toggle -->
          <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.35);">
            <span id="toggle-text">${t.auth.noAccount}</span>
            <a href="#" onclick="toggleMode(event)" style="color:#93C5FD;text-decoration:none;font-weight:600;" id="toggle-link">${t.auth.registerLink}</a>
          </p>
        </div>

        <!-- Demo Hint -->
        <div style="margin-top:24px;padding:16px 20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;animation:fade-in 1s 0.5s both;">
          <p style="font-size:12px;color:rgba(255,255,255,0.3);line-height:1.7;">
            <i class="fas fa-flask" style="color:rgba(59,130,246,0.6);margin-right:6px;"></i>
            <strong style="color:rgba(255,255,255,0.5);">Demo</strong>&nbsp;
            ${lang !== 'en'
              ? '验证码: 123456 | 手机: 13800001234 | 邮箱: investor@fund.com / demo123'
              : 'Code: 123456 | Phone: 13800001234 | Email: investor@fund.com / demo123'}
          </p>
        </div>

        <!-- Y-Flow hint -->
        <div style="display:flex;justify-content:center;gap:12px;margin-top:24px;animation:fade-in 1s 0.7s both;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);">
            <i class="fas fa-rocket" style="color:#F59E0B;font-size:10px;"></i>${t.identities.initiator.name}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);">
            <i class="fas fa-search" style="color:#10B981;font-size:10px;"></i>${t.identities.participant.name}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);">
            <i class="fas fa-building" style="color:#6366F1;font-size:10px;"></i>${t.identities.organization.name}
          </span>
        </div>
      </div>
    </div>
  </div>

  <script>
  // Auth redirect
  (function(){if(getToken()&&getUser()){window.location.href='/dashboard'+window.location.search;return}})();
  var isRegister=false,currentTab='phone',countdown=0;

  function switchTab(tab){
    currentTab=tab;
    document.getElementById('tab-phone').classList.toggle('active',tab==='phone');
    document.getElementById('tab-email').classList.toggle('active',tab==='email');
    document.getElementById('form-phone').style.display=tab==='phone'?'block':'none';
    document.getElementById('form-email').style.display=tab==='email'?'block':'none';
  }
  function toggleMode(e){
    e.preventDefault();isRegister=!isRegister;
    document.getElementById('name-field').style.display=isRegister?'block':'none';
    document.getElementById('btn-submit').textContent=isRegister?'${t.auth.registerBtn}':'${t.auth.loginBtn}';
    document.getElementById('toggle-text').textContent=isRegister?'${t.auth.hasAccount}':'${t.auth.noAccount}';
    document.getElementById('toggle-link').textContent=isRegister?'${t.auth.loginLink}':'${t.auth.registerLink}';
  }
  function sendCode(){
    var p=document.getElementById('inp-phone').value.trim();
    if(!p){showToast('${t.auth.phonePlaceholder}','error');return}
    api('/api/auth/verify-code',{method:'POST',body:JSON.stringify({phone:p})}).then(function(r){
      if(r.success){showToast('${lang!=='en'?'验证码已发送 (123456)':'Code sent (123456)'}','success');startCountdown()}
    });
  }
  function startCountdown(){
    countdown=60;var b=document.getElementById('btn-code');b.disabled=true;
    var iv=setInterval(function(){countdown--;b.textContent=countdown+'s';
      if(countdown<=0){clearInterval(iv);b.disabled=false;b.textContent='${t.auth.getCode}'}
    },1000);
  }
  async function doSubmit(){
    var b=document.getElementById('btn-submit');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    try{
      var body={};
      if(currentTab==='phone'){body.phone=document.getElementById('inp-phone').value.trim();body.verifyCode=document.getElementById('inp-code').value.trim()}
      else{body.email=document.getElementById('inp-email').value.trim();body.password=document.getElementById('inp-password').value.trim()}
      if(isRegister){body.name=document.getElementById('inp-name').value.trim();if(!body.name){showToast('${t.auth.namePlaceholder}','error');return}}
      var r=await api(isRegister?'/api/auth/register':'/api/auth/login',{method:'POST',body:JSON.stringify(body)});
      if(r.success){setAuth(r.token,r.user);showToast(isRegister?'${lang!=='en'?'注册成功！':'Registered!'}':'${lang!=='en'?'登录成功！':'Welcome back!'}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},600)}
      else{showToast(r.message||'${lang!=='en'?'操作失败':'Failed'}','error')}
    }catch(e){showToast('${lang!=='en'?'网络错误':'Network error'}','error')}
    finally{b.disabled=false;b.textContent=isRegister?'${t.auth.registerBtn}':'${t.auth.loginBtn}'}
  }
  </script>`

  return c.html(htmlShell(t.nav.title + ' | ' + (lang !== 'en' ? '滴灌通' : 'Micro Connect'), body, lang))
})


// ═══════════════════════════════════════════
// PAGE 2 — Dashboard (/dashboard)
// 个人工作台 · 身份卡片 · Y型路由 · 9通导航
// ═══════════════════════════════════════════
app.get('/dashboard', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = T(lang)
  const zh = lang !== 'en'

  // Build connects grid HTML
  const connectsHTML = CONNECTS.map(cn => {
    const name = zh ? cn.zh : cn.en
    const desc = zh ? cn.desc_zh : cn.desc_en
    const statusLabel = cn.status === 'live' ? (zh?'已上线':'Live') : cn.status === 'beta' ? 'Beta' : (zh?'即将上线':'Coming')
    const statusClass = 'status-' + cn.status
    return `
    <div class="connect-item" data-requires='${JSON.stringify(cn.requires)}' data-id="${cn.id}" onclick="clickConnect('${cn.id}','${name}')" title="${desc}">
      <div class="connect-icon" style="background:linear-gradient(135deg,${cn.lightColor},${cn.color});">
        <i class="fas ${cn.icon}"></i>
      </div>
      <span style="font-size:12px;font-weight:600;color:#1d1d1f;">${name}</span>
      <span class="connect-status ${statusClass}">${statusLabel}</span>
    </div>`
  }).join('')

  // Y-Flow visual
  const yFlowHTML = `
    <div class="card-elevated reveal stagger-2" style="padding:28px;margin-bottom:36px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#5DC4B3,#3D8F83);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-project-diagram" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:17px;font-weight:700;color:#1a1a1a;">${t.flow.yTitle}</h2>
        <span style="font-size:12px;color:#86868b;margin-left:auto;">${t.flow.yDesc}</span>
      </div>

      <!-- Y-Flow Diagram -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
        <!-- Entry: 身份通 -->
        <div style="padding:10px 24px;border-radius:12px;background:linear-gradient(135deg,#DBEAFE,#3B82F6);color:white;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px;">
          <i class="fas fa-id-card"></i> ${t.nav.title}${zh?' (统一入口)':' (Entry)'}
        </div>
        <div style="width:2px;height:20px;background:linear-gradient(180deg,#3B82F6,#86868b);"></div>

        <!-- Fork -->
        <div style="display:flex;gap:32px;align-items:flex-start;flex-wrap:wrap;justify-content:center;">
          <!-- Borrower Path -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:0;min-width:140px;">
            <div style="padding:3px 12px;border-radius:8px;background:rgba(245,158,11,0.1);font-size:11px;font-weight:600;color:#F59E0B;margin-bottom:8px;">${t.flow.borrowerPath}</div>
            <div style="width:2px;height:12px;background:#F59E0B;"></div>
            <div style="padding:8px 16px;border-radius:10px;background:#FEF3C7;border:1px solid rgba(245,158,11,0.2);font-size:12px;font-weight:600;color:#92400e;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-upload" style="font-size:10px;"></i>${zh?'发起通':'Originate'}
            </div>
          </div>

          <!-- Investor Path -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:0;min-width:140px;">
            <div style="padding:3px 12px;border-radius:8px;background:rgba(16,185,129,0.1);font-size:11px;font-weight:600;color:#10B981;margin-bottom:8px;">${t.flow.investorPath}</div>
            <div style="width:2px;height:12px;background:#10B981;"></div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
              <div style="padding:6px 14px;border-radius:8px;background:#E0E7FF;border:1px solid rgba(99,102,241,0.15);font-size:11px;font-weight:600;color:#3730a3;display:flex;align-items:center;gap:4px;"><i class="fas fa-filter" style="font-size:9px;"></i>${zh?'评估通':'Assess'}</div>
              <div style="width:2px;height:6px;background:#6366F1;"></div>
              <div style="padding:6px 14px;border-radius:8px;background:#E0E7FF;border:1px solid rgba(99,102,241,0.15);font-size:11px;font-weight:600;color:#3730a3;display:flex;align-items:center;gap:4px;"><i class="fas fa-shield-alt" style="font-size:9px;"></i>${zh?'风控通':'Risk'}</div>
              <div style="width:2px;height:6px;background:#10B981;"></div>
              <div style="padding:6px 14px;border-radius:8px;background:#D1FAE5;border:1px solid rgba(16,185,129,0.15);font-size:11px;font-weight:600;color:#065f46;display:flex;align-items:center;gap:4px;"><i class="fas fa-handshake" style="font-size:9px;"></i>${zh?'参与通':'Deal'}</div>
            </div>
          </div>
        </div>

        <!-- Convergence -->
        <div style="width:2px;height:16px;background:linear-gradient(180deg,#86868b,#8B5CF6);margin-top:8px;"></div>
        <div style="padding:3px 14px;border-radius:8px;background:rgba(139,92,246,0.1);font-size:11px;font-weight:600;color:#8B5CF6;margin-bottom:8px;">${t.flow.convergence}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
          <span style="padding:5px 12px;border-radius:8px;background:#EDE9FE;border:1px solid rgba(139,92,246,0.15);font-size:11px;font-weight:600;color:#5b21b6;"><i class="fas fa-sliders-h" style="font-size:9px;margin-right:4px;"></i>${zh?'条款通':'Terms'}</span>
          <span style="padding:5px 12px;border-radius:8px;background:#EDE9FE;border:1px solid rgba(139,92,246,0.15);font-size:11px;font-weight:600;color:#5b21b6;"><i class="fas fa-file-contract" style="font-size:9px;margin-right:4px;"></i>${zh?'合约通':'Contract'}</span>
          <span style="padding:5px 12px;border-radius:8px;background:#FEE2E2;border:1px solid rgba(239,68,68,0.15);font-size:11px;font-weight:600;color:#991b1b;"><i class="fas fa-calculator" style="font-size:9px;margin-right:4px;"></i>${zh?'结算通':'Settlement'}</span>
          <span style="padding:5px 12px;border-radius:8px;background:#FEE2E2;border:1px solid rgba(239,68,68,0.15);font-size:11px;font-weight:600;color:#991b1b;"><i class="fas fa-chart-line" style="font-size:9px;margin-right:4px;"></i>${zh?'履约通':'Performance'}</span>
        </div>
      </div>
    </div>`

  const body = `
  ${navbarLight(t, lang)}

  <main style="max-width:1080px;margin:0 auto;padding:24px 20px 0;">

    <!-- Welcome -->
    <div class="reveal" style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:32px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="avatar-ring"><i class="fas fa-user" style="font-size:24px;color:white;"></i></div>
        <div>
          <h1 style="font-size:24px;font-weight:800;color:#1a1a1a;letter-spacing:-0.3px;" id="greeting">${t.dashboard.greeting}</h1>
          <p style="font-size:14px;color:#86868b;margin-top:2px;" id="sub-greeting">${t.dashboard.manageIdentity}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <a href="/entity-verify${lang==='en'?'?lang=en':''}" class="btn-ghost" style="font-size:13px;">
          <i class="fas fa-plus-circle"></i>${t.dashboard.addEntity}
        </a>
      </div>
    </div>

    <!-- Stats -->
    <div class="reveal stagger-1" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:32px;" id="stats-row">
      <div class="stat-panel"><div class="stat-number" id="stat-identities">0</div><div class="stat-label">${t.stats.identities}</div></div>
      <div class="stat-panel"><div class="stat-number" id="stat-entities">0</div><div class="stat-label">${t.stats.entities}</div></div>
      <div class="stat-panel"><div class="stat-number" id="stat-initiated">0</div><div class="stat-label">${t.stats.initiated}</div></div>
      <div class="stat-panel"><div class="stat-number" id="stat-participated">0</div><div class="stat-label">${t.stats.participated}</div></div>
    </div>

    <!-- Identity Cards -->
    <div class="reveal stagger-2">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#DBEAFE,#3B82F6);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-fingerprint" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;">${t.dashboard.identitySection}</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:36px;" id="identity-cards"></div>
    </div>

    <!-- Y-Flow Diagram -->
    ${yFlowHTML}

    <!-- Initiated Deals -->
    <div class="reveal stagger-3" id="initiated-section" style="display:none;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#fef3c7,#F59E0B);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-rocket" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;">${t.dashboard.initiatedDeals}</h2>
        <span id="initiated-count" style="font-size:12px;font-weight:600;color:#86868b;background:#f1f5f9;padding:3px 12px;border-radius:20px;margin-left:auto;"></span>
      </div>
      <div id="initiated-list" style="display:grid;gap:12px;margin-bottom:36px;"></div>
    </div>

    <!-- Participated Deals -->
    <div class="reveal stagger-4" id="participated-section" style="display:none;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#d1fae5,#10B981);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-hand-holding-usd" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;">${t.dashboard.participatedDeals}</h2>
        <span id="participated-count" style="font-size:12px;font-weight:600;color:#86868b;background:#f1f5f9;padding:3px 12px;border-radius:20px;margin-left:auto;"></span>
      </div>
      <div id="participated-list" style="display:grid;gap:12px;margin-bottom:36px;"></div>
    </div>

    <!-- Entities -->
    <div class="reveal stagger-5">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#e0e7ff,#6366F1);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-building" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;">${t.dashboard.entitySection}</h2>
      </div>
      <div id="entity-list" style="margin-bottom:36px;"></div>
    </div>

    <div class="section-divider"></div>

    <!-- Quick Navigation: 9 Connects -->
    <div class="reveal stagger-6">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#5DC4B3,#3D8F83);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-th" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:#1a1a1a;">${t.dashboard.quickNav}</h2>
        <span style="font-size:12px;color:#86868b;margin-left:auto;">${zh?'9+3 产品矩阵':'9+3 Product Matrix'}</span>
      </div>
      <div class="card-elevated" style="padding:28px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;" id="connects-grid">
          ${connectsHTML}
        </div>
      </div>
    </div>

  </main>

  ${footer(t)}

  <script>
  var LANG=getLang();
  var tt=function(z,e){return LANG==='en'?e:z};

  var IDENTITIES_META={
    initiator:{name:tt('发起身份','Initiator'),icon:'fa-rocket',desc:tt('上传经营数据，发起融资申请','Upload data, initiate financing'),target:tt('发起通','Originate Connect'),cta:tt('进入发起通','Enter Originate'),color:'#F59E0B',gradient:'ic-initiator'},
    participant:{name:tt('参与身份','Participant'),icon:'fa-search',desc:tt('浏览投资项目，搭建评估筛子','Browse deals, build assessment sieves'),target:tt('参与通','Deal Connect'),cta:tt('进入参与通','Enter Deal'),color:'#10B981',gradient:'ic-participant'},
    organization:{name:tt('机构身份','Organization'),icon:'fa-building',desc:tt('机构级批量操作和自定义工作流','Institutional batch operations & custom workflows'),target:tt('全部通','All Connects'),cta:tt('进入机构工作台','Enter Org Workspace'),color:'#6366F1',gradient:'ic-organization'}
  };

  (function init(){
    if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return}
    var user=getUser();
    document.getElementById('greeting').textContent=tt('你好，','Hello, ')+user.name;
    document.getElementById('sub-greeting').textContent=tt('注册于 ','Since ')+user.createdAt+' · '+tt('管理你的身份，开启投融资之旅','Manage identities, start your journey');
    document.getElementById('stat-identities').textContent=user.identities.length;
    document.getElementById('stat-entities').textContent=user.entities.length;
    renderIdentityCards(user);
    renderEntities(user);
    updateConnects(user);
    loadDeals(user);
  })();

  function renderIdentityCards(user){
    var c=document.getElementById('identity-cards');
    var roles=['initiator','participant','organization'];
    c.innerHTML=roles.map(function(role){
      var m=IDENTITIES_META[role];
      var id=user.identities.find(function(i){return i.role===role});
      var unlocked=!!id;
      var cls=unlocked?m.gradient:'ic-locked';
      var textC=unlocked?'rgba(0,0,0,0.75)':'#6e6e73';
      var subC=unlocked?'rgba(0,0,0,0.5)':'#86868b';
      return '<div class="identity-card '+cls+'">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'+
          '<div style="width:48px;height:48px;border-radius:14px;background:'+(unlocked?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.04)')+';display:flex;align-items:center;justify-content:center;">'+
            '<i class="fas '+m.icon+'" style="font-size:20px;color:'+(unlocked?'rgba(0,0,0,0.6)':'#86868b')+';"></i>'+
          '</div>'+
          (unlocked?'<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.3);font-size:11px;font-weight:600;color:rgba(0,0,0,0.6);"><i class="fas fa-check-circle" style="font-size:10px;"></i>'+tt('已解锁','Unlocked')+'</span>':
          '<span style="font-size:11px;color:#aeaeb2;">'+tt('未解锁','Locked')+'</span>')+
        '</div>'+
        '<h3 style="font-size:17px;font-weight:700;color:'+textC+';margin-bottom:4px;">'+m.name+'</h3>'+
        '<p style="font-size:12px;color:'+subC+';margin-bottom:20px;line-height:1.5;">'+m.desc+'</p>'+
        (unlocked?
          '<div style="display:flex;align-items:center;justify-content:space-between;">'+
            '<span style="font-size:11px;color:'+subC+';">'+id.unlockedAt+'</span>'+
            '<button class="btn-card-action" onclick="enterConnect(&quot;'+role+'&quot;)">'+
              m.cta+' <i class="fas fa-arrow-right" style="margin-left:4px;font-size:10px;"></i></button>'+
          '</div>'
          :
          '<button class="btn-card-unlock" onclick="unlockIdentity(&quot;'+role+'&quot;)">'+
            '<i class="fas fa-lock-open" style="margin-right:6px;"></i>'+tt('解锁此角色','Unlock This Role')+'</button>'
        )+
      '</div>';
    }).join('');
  }

  function renderEntities(user){
    var c=document.getElementById('entity-list');
    if(!user.entities||user.entities.length===0){
      c.innerHTML='<div class="card-elevated" style="padding:32px;text-align:center;"><i class="fas fa-building" style="font-size:28px;color:#aeaeb2;margin-bottom:12px;display:block;"></i><p style="font-size:14px;color:#86868b;margin-bottom:4px;">'+tt('暂无已认证主体','No verified entities yet')+'</p><p style="font-size:12px;color:#aeaeb2;">'+tt('认证主体后可进入协作空间','Verify an entity to access workspace')+'</p></div>';
      return;
    }
    c.innerHTML=user.entities.map(function(e){
      return '<div class="card-elevated" style="padding:20px 24px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">'+
        '<div style="display:flex;align-items:center;gap:14px;">'+
          '<div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#e0e7ff,#a5b4fc);display:flex;align-items:center;justify-content:center;"><i class="fas fa-store" style="font-size:16px;color:#4f46e5;"></i></div>'+
          '<div>'+
            '<div style="font-size:15px;font-weight:600;color:#1a1a1a;">'+e.entityName+'</div>'+
            '<div style="font-size:12px;color:#86868b;margin-top:2px;"><i class="fas fa-user-tag" style="margin-right:4px;"></i>'+e.role+' · '+e.verifiedAt+'</div>'+
          '</div>'+
        '</div>'+
        '<button class="btn-ghost" style="font-size:12px;padding:8px 16px;" onclick="showToast(&quot;'+tt('协作空间开发中','Workspace coming soon')+'&quot;,&quot;info&quot;)"><i class="fas fa-arrow-right" style="margin-right:4px;"></i>'+tt('进入空间','Workspace')+'</button>'+
      '</div>';
    }).join('');
  }

  function updateConnects(user){
    var roles=user.identities.map(function(i){return i.role});
    var hasOrg=roles.includes('organization');
    document.querySelectorAll('.connect-item').forEach(function(el){
      var req=JSON.parse(el.getAttribute('data-requires'));
      var id=el.getAttribute('data-id');
      var ok=id==='identity'||hasOrg||req.length===0||req.some(function(r){return roles.includes(r)});
      el.classList.toggle('disabled',!ok);
      if(!ok)el.title=tt('需先解锁对应身份','Unlock required identity first');
    });
  }

  async function unlockIdentity(role){
    var r=await api('/api/user/unlock',{method:'POST',body:JSON.stringify({role:role})});
    if(r.success){
      var u=getUser();u.identities.push(r.identity);localStorage.setItem('ic_user',JSON.stringify(u));
      showToast(tt('角色解锁成功！','Role unlocked!'),'success');
      document.getElementById('stat-identities').textContent=u.identities.length;
      renderIdentityCards(u);updateConnects(u);loadDeals(u);
    } else{showToast(r.message,'error')}
  }

  function enterConnect(role){
    var m=IDENTITIES_META[role];
    showToast(tt('即将跳转到'+m.target+'（开发中）','Redirecting to '+m.target+' (coming soon)'),'info');
  }
  function clickConnect(id,name){
    if(id==='identity'){showToast(tt('你已在身份通','You are in Identity Connect'),'info');return}
    var el=document.querySelector('[data-id="'+id+'"]');
    if(el&&el.classList.contains('disabled')){showToast(tt('需先解锁对应角色','Unlock required role first'),'error');return}
    showToast(tt('即将跳转到'+name+'（开发中）','Redirecting to '+name+' (coming soon)'),'info');
  }

  // Deal status maps
  var DS={draft:{zh:'草稿',en:'Draft',color:'#86868b',bg:'#f5f5f7',icon:'fa-pencil-alt'},submitted:{zh:'已提交',en:'Submitted',color:'#3b82f6',bg:'#DBEAFE',icon:'fa-paper-plane'},under_review:{zh:'审核中',en:'Reviewing',color:'#f59e0b',bg:'#FEF3C7',icon:'fa-clock'},approved:{zh:'已通过',en:'Approved',color:'#34c759',bg:'#D1FAE5',icon:'fa-check-circle'},live:{zh:'募集中',en:'Live',color:'#3B82F6',bg:'#DBEAFE',icon:'fa-broadcast-tower'},completed:{zh:'已完成',en:'Done',color:'#86868b',bg:'#f5f5f7',icon:'fa-flag-checkered'},rejected:{zh:'已拒绝',en:'Rejected',color:'#ff375f',bg:'#FEE2E2',icon:'fa-times-circle'}};
  var PS={watching:{zh:'关注中',en:'Watching',color:'#86868b',bg:'#f5f5f7',icon:'fa-eye'},evaluating:{zh:'评估中',en:'Evaluating',color:'#f59e0b',bg:'#FEF3C7',icon:'fa-search'},committed:{zh:'已承诺',en:'Committed',color:'#3B82F6',bg:'#DBEAFE',icon:'fa-handshake'},signed:{zh:'已签约',en:'Signed',color:'#34c759',bg:'#D1FAE5',icon:'fa-file-signature'},settled:{zh:'已结算',en:'Settled',color:'#6366f1',bg:'#E0E7FF',icon:'fa-calculator'},exited:{zh:'已退出',en:'Exited',color:'#86868b',bg:'#f5f5f7',icon:'fa-door-open'}};

  function badge(map,s){var v=map[s]||{zh:s,en:s,color:'#86868b',bg:'#f5f5f7',icon:'fa-circle'};return '<span class="tag" style="color:'+v.color+';background:'+v.bg+';"><i class="fas '+v.icon+'" style="font-size:9px;"></i>'+tt(v.zh,v.en)+'</span>'}

  async function loadDeals(user){
    var hasI=user.identities.some(function(i){return i.role==='initiator'});
    var hasP=user.identities.some(function(i){return i.role==='participant'});
    var hasO=user.identities.some(function(i){return i.role==='organization'});
    if(hasI||hasO){
      var r1=await api('/api/deals/initiated');
      if(r1.success&&r1.deals.length>0){
        document.getElementById('initiated-section').style.display='block';
        document.getElementById('initiated-count').textContent=r1.deals.length+tt(' 个项目',' deals');
        document.getElementById('stat-initiated').textContent=r1.deals.length;
        renderInitiated(r1.deals);
      }
    }
    if(hasP||hasO){
      var r2=await api('/api/deals/participated');
      if(r2.success&&r2.participations.length>0){
        document.getElementById('participated-section').style.display='block';
        document.getElementById('participated-count').textContent=r2.participations.length+tt(' 个项目',' deals');
        document.getElementById('stat-participated').textContent=r2.participations.length;
        renderParticipated(r2.participations);
      }
    }
  }

  function renderInitiated(list){
    document.getElementById('initiated-list').innerHTML=list.map(function(d){
      return '<div class="deal-card deal-'+d.status+'">'+
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">'+
          '<div style="flex:1;min-width:200px;">'+
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">'+
              '<h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0;">'+d.title+'</h3>'+
              badge(DS,d.status)+
            '</div>'+
            '<div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:#6e6e73;">'+
              '<span><i class="fas fa-tag" style="margin-right:4px;color:#86868b;"></i>'+d.industry+'</span>'+
              '<span><i class="fas fa-coins" style="margin-right:4px;color:#F59E0B;"></i>'+d.amount+'</span>'+
              (d.monthlyRevenue?'<span><i class="fas fa-chart-bar" style="margin-right:4px;color:#10B981;"></i>'+d.monthlyRevenue+'</span>':'')+
              (d.term?'<span><i class="fas fa-calendar" style="margin-right:4px;color:#86868b;"></i>'+d.term+'</span>':'')+
            '</div>'+
            (d.progress!=null?'<div class="progress-bar" style="margin-top:12px;"><div class="progress-fill" style="width:'+d.progress+'%;"></div></div><div style="font-size:11px;color:#86868b;margin-top:4px;">'+tt('进度','Progress')+' '+d.progress+'%</div>':'')+
          '</div>'+
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">'+
            '<span style="font-size:11px;color:#aeaeb2;">'+d.updatedAt+'</span>'+
            '<button class="btn-ghost" style="padding:6px 14px;font-size:11px;" onclick="showToast(&quot;'+tt('即将跳转到发起通','Redirecting to Originate')+'&quot;,&quot;info&quot;)"><i class="fas fa-external-link-alt" style="margin-right:4px;"></i>'+tt('详情','Details')+'</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  function renderParticipated(list){
    document.getElementById('participated-list').innerHTML=list.map(function(p){
      return '<div class="deal-card deal-'+p.status+'">'+
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">'+
          '<div style="flex:1;min-width:200px;">'+
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">'+
              '<h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0;">'+p.dealTitle+'</h3>'+
              badge(PS,p.status)+
            '</div>'+
            '<div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:#6e6e73;">'+
              '<span><i class="fas fa-tag" style="margin-right:4px;color:#86868b;"></i>'+p.industry+'</span>'+
              '<span><i class="fas fa-coins" style="margin-right:4px;color:#F59E0B;"></i>'+tt('总额 ','Total ')+p.amount+'</span>'+
              (p.committedAmount?'<span><i class="fas fa-handshake" style="margin-right:4px;color:#3B82F6;"></i>'+tt('承诺 ','Committed ')+p.committedAmount+'</span>':'')+
              (p.expectedReturn?'<span><i class="fas fa-percentage" style="margin-right:4px;color:#10B981;"></i>'+p.expectedReturn+'</span>':'')+
              (p.riskScore?'<span><i class="fas fa-shield-alt" style="margin-right:4px;color:#6366F1;"></i>'+p.riskScore+'</span>':'')+
            '</div>'+
          '</div>'+
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">'+
            '<span style="font-size:11px;color:#aeaeb2;">'+p.updatedAt+'</span>'+
            '<button class="btn-ghost" style="padding:6px 14px;font-size:11px;" onclick="showToast(&quot;'+tt('即将跳转到参与通','Redirecting to Deal Connect')+'&quot;,&quot;info&quot;)"><i class="fas fa-external-link-alt" style="margin-right:4px;"></i>'+tt('详情','Details')+'</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  </script>`

  return c.html(htmlShell((zh ? '工作台 | 身份通' : 'Dashboard | Identity Connect'), body, lang))
})


// ═══════════════════════════════════════════
// PAGE 3 — Entity Verification (/entity-verify)
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
  ${navbarLight(t, lang)}

  <main style="max-width:560px;margin:0 auto;padding:32px 20px 0;">
    <!-- Breadcrumb -->
    <div class="reveal" style="margin-bottom:28px;">
      <a href="/dashboard${lang==='en'?'?lang=en':''}" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#3B82F6;text-decoration:none;font-weight:500;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
        <i class="fas fa-arrow-left"></i>${t.entity.backToDash}
      </a>
    </div>

    <!-- Steps -->
    <div class="reveal stagger-1" style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">1</div>
        <span style="font-size:13px;font-weight:600;color:#1a1a1a;">${zh?'填写信息':'Fill Info'}</span>
      </div>
      <div style="flex:1;height:2px;background:linear-gradient(90deg,#3B82F6,#aeaeb2);border-radius:1px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:#f1f5f9;color:#86868b;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">2</div>
        <span style="font-size:13px;color:#86868b;">${zh?'提交审核':'Review'}</span>
      </div>
      <div style="flex:1;height:2px;background:#f1f5f9;border-radius:1px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:#f1f5f9;color:#86868b;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">3</div>
        <span style="font-size:13px;color:#86868b;">${zh?'完成':'Done'}</span>
      </div>
    </div>

    <!-- Form -->
    <div class="card-elevated reveal stagger-2" style="padding:36px 32px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#e0e7ff,#6366F1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 16px rgba(99,102,241,0.2);">
          <i class="fas fa-building" style="font-size:24px;color:white;"></i>
        </div>
        <h1 style="font-size:22px;font-weight:800;color:#1a1a1a;letter-spacing:-0.3px;">${t.entity.title}</h1>
        <p style="font-size:13px;color:#86868b;margin-top:6px;">${t.entity.subtitle}</p>
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">
          ${t.entity.companyName} <span style="color:#ff375f;">*</span>
        </label>
        <input id="ent-name" class="input-field" placeholder="${zh?'例如: ABC 餐饮连锁':'e.g. ABC Restaurant Chain'}">
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">${t.entity.creditCode}</label>
        <input id="ent-code" class="input-field" placeholder="${zh?'选填 — 非必填':'Optional'}">
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">
          ${t.entity.yourRole} <span style="color:#ff375f;">*</span>
        </label>
        <select id="ent-role" class="input-field" style="appearance:auto;cursor:pointer;">
          ${roleOpts.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:28px;">
        <label style="font-size:13px;font-weight:600;color:#6e6e73;display:block;margin-bottom:8px;">${t.entity.uploadProof}</label>
        <div class="upload-zone">
          <i class="fas fa-cloud-upload-alt" style="font-size:28px;color:#aeaeb2;margin-bottom:10px;display:block;"></i>
          <p style="font-size:13px;color:#86868b;line-height:1.6;">
            ${zh?'营业执照 / 授权书等':'Business license / authorization'}<br>
            <span style="font-size:11px;color:#aeaeb2;">${zh?'Demo 阶段可跳过':'Skip for Demo'}</span>
          </p>
        </div>
      </div>

      <button class="btn-primary" style="width:100%;" onclick="submitEntity()">
        <i class="fas fa-paper-plane"></i>${t.entity.submit}
      </button>
    </div>

    <!-- Hint -->
    <div class="reveal stagger-3" style="margin-top:20px;padding:14px 18px;background:rgba(59,130,246,0.03);border:1px solid rgba(59,130,246,0.08);border-radius:14px;">
      <p style="font-size:12px;color:#86868b;display:flex;align-items:center;gap:6px;">
        <i class="fas fa-flask" style="color:#3B82F6;"></i>
        ${zh?'Demo 阶段提交即通过，无需真实材料。':'Demo: auto-approve on submit, no real documents needed.'}
      </p>
    </div>
  </main>

  ${footer(t)}

  <script>
  (function(){if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return}})();
  async function submitEntity(){
    var n=document.getElementById('ent-name').value.trim();
    var c=document.getElementById('ent-code').value.trim();
    var r=document.getElementById('ent-role').value;
    if(!n){showToast('${zh?'请填写公司/项目名称':'Please enter entity name'}','error');return}
    var res=await api('/api/entity/verify',{method:'POST',body:JSON.stringify({entityName:n,creditCode:c,role:r})});
    if(res.success){var u=getUser();u.entities.push(res.entity);localStorage.setItem('ic_user',JSON.stringify(u));showToast('${zh?'认证成功！':'Verified!'}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},1000)}
    else{showToast(res.message||'${zh?'提交失败':'Failed'}','error')}
  }
  </script>`

  return c.html(htmlShell((zh ? '主体认证 | 身份通' : 'Entity Verification | Identity Connect'), body, lang))
})


export default app
