import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ═══════════════════════════════════════════════════════
// Identity Connect — Main Application V4.0
// Ultra Premium UI — Apple × Vercel × Linear aesthetic
// ═══════════════════════════════════════════════════════

const app = new Hono()
app.use('/api/*', cors())

// ─── JWT Helpers (Demo — Web APIs for Cloudflare Workers) ───
const JWT_SECRET = 'micro-connect-demo-secret-2026'

function toBase64Url(str: string): string {
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
  const sig = toBase64Url(JWT_SECRET + header + body)
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

// ─── Mock Data Store ───
interface User {
  id: string; phone?: string; email?: string; name: string; password?: string;
  avatar?: string; identities: Identity[]; entities: EntityAuth[]; createdAt: string;
}
type IdentityRole = 'initiator' | 'participant' | 'organization'
interface Identity { role: IdentityRole; unlockedAt: string; status: 'active' | 'pending' | 'suspended' }
interface EntityAuth { entityId: string; entityName: string; role: string; verifiedAt: string }

type DealStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'live' | 'completed' | 'rejected'
type ParticipationStatus = 'watching' | 'evaluating' | 'committed' | 'signed' | 'settled' | 'exited'
interface Deal {
  id: string; title: string; entityName: string; industry: string; amount: string;
  status: DealStatus; createdAt: string; updatedAt: string; initiatorId: string;
  monthlyRevenue?: string; term?: string; progress?: number;
}
interface Participation {
  id: string; dealId: string; dealTitle: string; entityName: string; industry: string;
  amount: string; status: ParticipationStatus; joinedAt: string; updatedAt: string;
  participantId: string; committedAmount?: string; expectedReturn?: string; riskScore?: string;
}

const deals: Deal[] = [
  { id: 'd-001', title: 'ABC 餐饮连锁 — 华南区扩张融资', entityName: 'ABC 餐饮连锁', industry: '餐饮', amount: '500万', status: 'live', createdAt: '2026-01-25', updatedAt: '2026-02-20', initiatorId: 'u-001', monthlyRevenue: '120万/月', term: '24个月', progress: 75 },
  { id: 'd-002', title: 'ABC 餐饮连锁 — 供应链升级融资', entityName: 'ABC 餐饮连锁', industry: '餐饮', amount: '200万', status: 'under_review', createdAt: '2026-02-15', updatedAt: '2026-02-25', initiatorId: 'u-001', monthlyRevenue: '120万/月', term: '12个月', progress: 40 },
  { id: 'd-003', title: 'ABC 餐饮连锁 — 新品牌孵化', entityName: 'ABC 餐饮连锁', industry: '餐饮', amount: '800万', status: 'draft', createdAt: '2026-02-26', updatedAt: '2026-02-26', initiatorId: 'u-001', term: '36个月', progress: 10 },
  { id: 'd-010', title: '鲜茶工坊 — 全国加盟体系融资', entityName: '鲜茶工坊', industry: '茶饮', amount: '1200万', status: 'live', createdAt: '2026-01-10', updatedAt: '2026-02-18', initiatorId: 'u-003', monthlyRevenue: '280万/月', term: '36个月', progress: 60 },
  { id: 'd-011', title: '快剪工坊 — 社区店扩张融资', entityName: '快剪工坊', industry: '美业', amount: '300万', status: 'approved', createdAt: '2026-02-01', updatedAt: '2026-02-22', initiatorId: 'u-003', monthlyRevenue: '45万/月', term: '18个月', progress: 55 }
]
const participations: Participation[] = [
  { id: 'p-001', dealId: 'd-010', dealTitle: '鲜茶工坊 — 全国加盟体系融资', entityName: '鲜茶工坊', industry: '茶饮', amount: '1200万', status: 'committed', joinedAt: '2026-01-20', updatedAt: '2026-02-18', participantId: 'u-001', committedAmount: '100万', expectedReturn: '12.5%', riskScore: 'A' },
  { id: 'p-002', dealId: 'd-011', dealTitle: '快剪工坊 — 社区店扩张融资', entityName: '快剪工坊', industry: '美业', amount: '300万', status: 'evaluating', joinedAt: '2026-02-10', updatedAt: '2026-02-22', participantId: 'u-001', riskScore: 'B+' },
  { id: 'p-010', dealId: 'd-001', dealTitle: 'ABC 餐饮连锁 — 华南区扩张融资', entityName: 'ABC 餐饮连锁', industry: '餐饮', amount: '500万', status: 'signed', joinedAt: '2026-02-01', updatedAt: '2026-02-20', participantId: 'u-002', committedAmount: '200万', expectedReturn: '15%', riskScore: 'A-' },
  { id: 'p-011', dealId: 'd-010', dealTitle: '鲜茶工坊 — 全国加盟体系融资', entityName: '鲜茶工坊', industry: '茶饮', amount: '1200万', status: 'committed', joinedAt: '2026-01-15', updatedAt: '2026-02-10', participantId: 'u-002', committedAmount: '500万', expectedReturn: '11%', riskScore: 'A' },
  { id: 'p-012', dealId: 'd-011', dealTitle: '快剪工坊 — 社区店扩张融资', entityName: '快剪工坊', industry: '美业', amount: '300万', status: 'watching', joinedAt: '2026-02-20', updatedAt: '2026-02-22', participantId: 'u-002' }
]
const users: User[] = [
  { id: 'u-001', phone: '13800001234', name: '张三', identities: [{ role: 'initiator', unlockedAt: '2026-01-15', status: 'active' }, { role: 'participant', unlockedAt: '2026-02-01', status: 'active' }], entities: [{ entityId: 'e-001', entityName: 'ABC 餐饮连锁', role: '法人代表', verifiedAt: '2026-01-20' }], createdAt: '2026-01-10' },
  { id: 'u-002', email: 'investor@fund.com', name: '李四', password: 'demo123', identities: [{ role: 'participant', unlockedAt: '2026-01-08', status: 'active' }, { role: 'organization', unlockedAt: '2026-01-10', status: 'active' }], entities: [{ entityId: 'e-010', entityName: '新锐资本', role: '投资总监', verifiedAt: '2026-01-12' }], createdAt: '2026-01-05' },
  { id: 'u-003', phone: '13900005678', name: '王五', identities: [{ role: 'initiator', unlockedAt: '2026-02-20', status: 'active' }], entities: [], createdAt: '2026-02-18' }
]

function findUser(phone?: string, email?: string): User | undefined {
  if (phone) return users.find(u => u.phone === phone)
  if (email) return users.find(u => u.email === email)
  return undefined
}
function findUserById(id: string): User | undefined { return users.find(u => u.id === id) }
function getUserFromToken(authHeader: string | undefined): User | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const payload = parseJWT(authHeader.slice(7))
  if (!payload?.userId) return null
  return findUserById(payload.userId as string) || null
}

// ═══════════════════════════════════════════
// API Routes (unchanged logic)
// ═══════════════════════════════════════════
app.post('/api/auth/verify-code', async (c) => {
  const { phone } = await c.req.json()
  if (!phone) return c.json({ success: false, message: '请提供手机号' }, 400)
  return c.json({ success: true, message: '验证码已发送' })
})
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json()
  const { phone, email, verifyCode, password, name } = body
  if (!name) return c.json({ success: false, message: '请提供姓名' }, 400)
  if (phone && verifyCode !== '123456') return c.json({ success: false, message: '验证码错误' }, 400)
  if (findUser(phone, email)) return c.json({ success: false, message: '该账号已注册，请直接登录' }, 400)
  const newUser: User = { id: `u-${String(Date.now()).slice(-6)}`, ...(phone ? { phone } : {}), ...(email ? { email, password } : {}), name, identities: [], entities: [], createdAt: new Date().toISOString().split('T')[0] }
  users.push(newUser)
  const token = createJWT({ userId: newUser.id, name: newUser.name })
  return c.json({ success: true, token, user: { ...newUser, password: undefined } })
})
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  const { phone, email, verifyCode, password } = body
  if (phone && verifyCode !== '123456') return c.json({ success: false, message: '验证码错误' }, 400)
  const user = findUser(phone, email)
  if (!user) return c.json({ success: false, message: '用户不存在，请先注册' }, 404)
  if (email && password && user.password && user.password !== password) return c.json({ success: false, message: '密码错误' }, 401)
  const token = createJWT({ userId: user.id, name: user.name })
  return c.json({ success: true, token, user: { ...user, password: undefined } })
})
app.get('/api/user/profile', (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, user: { ...user, password: undefined } })
})
app.post('/api/user/unlock', async (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  const { role } = await c.req.json()
  if (!['initiator', 'participant', 'organization'].includes(role)) return c.json({ success: false, message: '无效的身份类型' }, 400)
  if (user.identities.find(i => i.role === role)) return c.json({ success: false, message: '该身份已解锁' }, 400)
  const identity: Identity = { role, unlockedAt: new Date().toISOString().split('T')[0], status: 'active' }
  user.identities.push(identity)
  return c.json({ success: true, identity })
})
app.post('/api/entity/verify', async (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  const { entityName, creditCode, role } = await c.req.json()
  if (!entityName || !role) return c.json({ success: false, message: '请填写完整信息' }, 400)
  const entity: EntityAuth = { entityId: `e-${String(Date.now()).slice(-6)}`, entityName, role, verifiedAt: new Date().toISOString().split('T')[0] }
  user.entities.push(entity)
  return c.json({ success: true, entity })
})
app.get('/api/entity/list', (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, entities: user.entities })
})
app.get('/api/deals/initiated', (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, deals: deals.filter(d => d.initiatorId === user.id) })
})
app.get('/api/deals/participated', (c) => {
  const user = getUserFromToken(c.req.header('Authorization'))
  if (!user) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, participations: participations.filter(p => p.participantId === user.id) })
})

// ═══════════════════════════════════════════
// Shared HTML Components — Premium V4.0
// ═══════════════════════════════════════════

const SVG_LOGO = `<svg width="32" height="32" viewBox="0 0 80 80"><defs><linearGradient id="gt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gt)"/><circle cx="36" cy="44" r="22" fill="url(#gb)" opacity="0.85"/></svg>`

function getNavbarGlass(lang: string): string {
  const t = (zh: string, en: string) => lang === 'en' ? en : zh
  const langToggle = lang === 'en' ? 'zh' : 'en'
  const langLabel = lang === 'en' ? '中' : 'EN'
  return `
  <nav class="navbar-glass" id="navbar">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between;">
      <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${SVG_LOGO}
        <span class="font-brand" style="font-weight:700;font-size:14px;color:rgba(255,255,255,0.9);letter-spacing:0.5px;">MICRO CONNECT</span>
      </a>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5);"><i class="fas fa-id-card" style="margin-right:4px;color:#93C5FD;"></i>${t('身份通', 'Identity')}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${langToggle}" class="btn-ghost-light">${langLabel}</a>
        <a href="https://microconnect.com" class="btn-ghost-light">${t('主站', 'Main')}</a>
      </div>
    </div>
  </nav>`
}

function getNavbarLight(lang: string): string {
  const t = (zh: string, en: string) => lang === 'en' ? en : zh
  const langToggle = lang === 'en' ? 'zh' : 'en'
  const langLabel = lang === 'en' ? '中' : 'EN'
  return `
  <nav class="navbar" id="navbar">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between;">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
        ${SVG_LOGO}
        <span class="font-brand" style="font-weight:700;font-size:14px;color:var(--text-primary);letter-spacing:0.5px;">MICRO CONNECT</span>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;background:rgba(59,130,246,0.08);font-size:11px;font-weight:600;color:var(--identity);"><i class="fas fa-id-card" style="font-size:10px;"></i>${t('身份通', 'Identity')}</span>
      </a>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${langToggle}" class="btn-ghost" style="padding:6px 12px;font-size:12px;">${langLabel}</a>
        <span id="nav-username" style="font-size:13px;color:var(--text-secondary);font-weight:500;"></span>
        <button onclick="doLogout()" class="btn-ghost" style="padding:6px 12px;font-size:12px;color:#ef4444;border-color:rgba(239,68,68,0.15);">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </nav>`
}

function getFooter(lang: string): string {
  const t = (zh: string, en: string) => lang === 'en' ? en : zh
  return `
  <footer class="footer-aurora" style="padding:56px 24px 36px;margin-top:80px;position:relative;">
    <div style="max-width:1200px;margin:0 auto;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:20px;">
        ${SVG_LOGO}
        <span class="font-brand" style="color:rgba(255,255,255,0.9);font-weight:700;font-size:16px;letter-spacing:1px;">MICRO CONNECT</span>
      </div>
      <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:24px;">
        ${t('以人为单位的万能工作台 · 解锁身份 · 路由中枢', 'Universal workspace per person · Unlock identity · Routing hub')}
      </p>
      <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:24px;">
        <a href="https://microconnect.com" class="footer-link">${t('返回主站', 'Main Site')}</a>
        <a href="#" class="footer-link">${t('隐私政策', 'Privacy')}</a>
        <a href="#" class="footer-link">${t('服务条款', 'Terms')}</a>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:20px;"></div>
      <p style="text-align:center;color:rgba(255,255,255,0.25);font-size:11px;">
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
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
  <title>${title}</title>
  <meta name="theme-color" content="#0a0f1e">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
  tailwind.config={theme:{extend:{fontFamily:{sans:['-apple-system','BlinkMacSystemFont','Inter','SF Pro Display','Segoe UI','Roboto','Noto Sans SC','sans-serif'],display:['Inter','SF Pro Display','Segoe UI','sans-serif'],mono:['Montserrat','Inter','Futura','Helvetica Neue','sans-serif']},colors:{brand:{DEFAULT:'#5DC4B3',light:'#7DD4C7',dark:'#3D8F83'},identity:{light:'#DBEAFE',DEFAULT:'#3B82F6',dark:'#2563EB'},text:{primary:'#1d1d1f',title:'#0f172a',secondary:'#64748b',tertiary:'#94a3b8'}}}}}
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
      new IntersectionObserver(function(e){if(e[0].isIntersecting){e[0].target.classList.add('visible')}},{threshold:0.1}).observe(el)
    });
    var u=getUser();var el=document.getElementById('nav-username');if(el&&u)el.textContent=u.name;
  });
  </script>
</body>
</html>`
}


// ═══════════════════════════════════════════
// PAGE 1 — Immersive Login/Register (/)
// ═══════════════════════════════════════════
app.get('/', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = (zh: string, en: string) => lang === 'en' ? en : zh

  const body = `
  <div class="hero-immersive">
    <!-- Animated orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    ${getNavbarGlass(lang)}

    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;z-index:2;">
      <div style="width:100%;max-width:440px;">

        <!-- Hero text -->
        <div style="text-align:center;margin-bottom:40px;animation:slide-up 0.8s var(--ease-out-expo) forwards;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.15);margin-bottom:24px;">
            <div style="width:6px;height:6px;border-radius:50%;background:#34c759;box-shadow:0 0 8px rgba(52,199,89,0.5);"></div>
            <span style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;">${t('滴灌通平台 · 统一入口', 'Micro Connect Platform · Unified Entry')}</span>
          </div>
          <h1 style="font-size:36px;font-weight:800;color:white;letter-spacing:-0.5px;line-height:1.2;margin-bottom:12px;">
            ${t('身份通', 'Identity Connect')}
          </h1>
          <p style="font-size:16px;color:rgba(255,255,255,0.5);font-weight:400;line-height:1.6;max-width:340px;margin:0 auto;">
            ${t('选择你的角色，发起或参与投资机会', 'Choose your role — originate or participate in deals')}
          </p>
        </div>

        <!-- Login card (glass) -->
        <div class="card-glass" style="padding:36px 32px;animation:scale-in 0.6s var(--ease-out-expo) 0.2s both;">

          <!-- Tabs -->
          <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:28px;">
            <button class="tab-btn active" onclick="switchTab('phone')" id="tab-phone">
              <i class="fas fa-mobile-alt" style="margin-right:6px;font-size:13px;"></i>${t('手机登录', 'Phone')}
            </button>
            <button class="tab-btn" onclick="switchTab('email')" id="tab-email">
              <i class="fas fa-envelope" style="margin-right:6px;font-size:13px;"></i>${t('邮箱登录', 'Email')}
            </button>
          </div>

          <!-- Phone form -->
          <div id="form-phone">
            <div style="display:flex;gap:8px;margin-bottom:16px;">
              <input type="tel" id="inp-phone" class="input-glass" placeholder="${t('请输入手机号', 'Phone number')}" style="flex:1;">
              <button class="verify-code-btn verify-code-glass" onclick="sendCode()" id="btn-code">${t('获取验证码', 'Get Code')}</button>
            </div>
            <input type="text" id="inp-code" class="input-glass" placeholder="${t('请输入验证码', 'Verification code')}" style="margin-bottom:16px;" maxlength="6">
          </div>

          <!-- Email form -->
          <div id="form-email" style="display:none;">
            <input type="email" id="inp-email" class="input-glass" placeholder="${t('请输入邮箱', 'Email address')}" style="margin-bottom:16px;">
            <input type="password" id="inp-password" class="input-glass" placeholder="${t('请输入密码', 'Password')}" style="margin-bottom:16px;">
          </div>

          <!-- Name field (register) -->
          <div id="name-field" style="display:none;">
            <input type="text" id="inp-name" class="input-glass" placeholder="${t('请输入姓名', 'Your name')}" style="margin-bottom:16px;">
          </div>

          <!-- Submit -->
          <button class="btn-primary btn-glow" style="width:100%;margin-bottom:20px;padding:16px;" onclick="doSubmit()" id="btn-submit">
            ${t('登录', 'Login')}
          </button>

          <!-- Toggle -->
          <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.35);">
            <span id="toggle-text">${t('没有账号？', "Don't have an account? ")}</span>
            <a href="#" onclick="toggleMode(event)" style="color:#93C5FD;text-decoration:none;font-weight:600;" id="toggle-link">${t('点此注册', 'Register')}</a>
          </p>
        </div>

        <!-- Demo hint -->
        <div style="margin-top:24px;padding:16px 20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;animation:fade-in 1s 0.5s both;">
          <p style="font-size:12px;color:rgba(255,255,255,0.3);line-height:1.7;">
            <i class="fas fa-flask" style="color:rgba(59,130,246,0.6);margin-right:6px;"></i>
            <strong style="color:rgba(255,255,255,0.5);">Demo</strong>&nbsp;
            ${t('验证码: 123456 | 手机: 13800001234 | 邮箱: investor@fund.com / demo123', 'Code: 123456 | Phone: 13800001234 | Email: investor@fund.com / demo123')}
          </p>
        </div>

        <!-- Feature pills -->
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:24px;animation:fade-in 1s 0.7s both;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);">
            <i class="fas fa-rocket" style="color:#F59E0B;font-size:10px;"></i>${t('发起机会', 'Originate')}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);">
            <i class="fas fa-search" style="color:#10B981;font-size:10px;"></i>${t('参与机会', 'Participate')}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);">
            <i class="fas fa-building" style="color:#6366F1;font-size:10px;"></i>${t('机构身份', 'Organization')}
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4);">
            <i class="fas fa-lock" style="color:#3B82F6;font-size:10px;"></i>${t('SSO 单点登录', 'SSO Login')}
          </span>
        </div>
      </div>
    </div>
  </div>

  <script>
  var currentTab='phone',isRegister=false,countdown=0;
  (function(){if(getToken()&&getUser()){window.location.href='/dashboard'+window.location.search}})();
  function switchTab(tab){
    currentTab=tab;
    document.getElementById('tab-phone').classList.toggle('active',tab==='phone');
    document.getElementById('tab-email').classList.toggle('active',tab==='email');
    document.getElementById('form-phone').style.display=tab==='phone'?'block':'none';
    document.getElementById('form-email').style.display=tab==='email'?'block':'none';
  }
  function toggleMode(e){
    e.preventDefault();isRegister=!isRegister;var L=getLang();
    document.getElementById('name-field').style.display=isRegister?'block':'none';
    document.getElementById('btn-submit').textContent=isRegister?(L==='en'?'Register':'注册'):(L==='en'?'Login':'登录');
    document.getElementById('toggle-text').textContent=isRegister?(L==='en'?'Already have an account? ':'已有账号？'):(L==='en'?"Don't have an account? ":'没有账号？');
    document.getElementById('toggle-link').textContent=isRegister?(L==='en'?'Login':'点此登录'):(L==='en'?'Register':'点此注册');
  }
  function sendCode(){
    var p=document.getElementById('inp-phone').value.trim();
    if(!p){showToast('${t('请输入手机号','Please enter phone number')}','error');return}
    api('/api/auth/verify-code',{method:'POST',body:JSON.stringify({phone:p})}).then(function(r){if(r.success){showToast('${t('验证码已发送 (123456)','Code sent (123456)')}','success');startCountdown()}});
  }
  function startCountdown(){countdown=60;var b=document.getElementById('btn-code');b.disabled=true;var t=setInterval(function(){countdown--;b.textContent=countdown+'s';if(countdown<=0){clearInterval(t);b.disabled=false;b.textContent='${t('获取验证码','Get Code')}'}},1000)}
  async function doSubmit(){
    var b=document.getElementById('btn-submit');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
    try{
      var body={};
      if(currentTab==='phone'){body.phone=document.getElementById('inp-phone').value.trim();body.verifyCode=document.getElementById('inp-code').value.trim()}
      else{body.email=document.getElementById('inp-email').value.trim();body.password=document.getElementById('inp-password').value.trim()}
      if(isRegister){body.name=document.getElementById('inp-name').value.trim();if(!body.name){showToast('${t('请输入姓名','Please enter name')}','error');return}}
      var ep=isRegister?'/api/auth/register':'/api/auth/login';
      var r=await api(ep,{method:'POST',body:JSON.stringify(body)});
      if(r.success){setAuth(r.token,r.user);showToast(isRegister?'${t('注册成功！','Registered!')}':'${t('登录成功！','Welcome back!')}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},600)}
      else{showToast(r.message||'${t('操作失败','Failed')}','error')}
    }catch(e){showToast('${t('网络错误','Network error')}','error')}
    finally{var L=getLang();b.disabled=false;b.textContent=isRegister?(L==='en'?'Register':'注册'):(L==='en'?'Login':'登录')}
  }
  </script>`

  return c.html(htmlShell(t('身份通 | 滴灌通', 'Identity Connect | Micro Connect'), body, lang))
})


// ═══════════════════════════════════════════
// PAGE 2 — Premium Dashboard (/dashboard)
// ═══════════════════════════════════════════
app.get('/dashboard', (c) => {
  const lang = c.req.query('lang') || 'zh'
  const t = (zh: string, en: string) => lang === 'en' ? en : zh

  const connects = [
    { id:'identity', zh:'身份通', en:'Identity', color:'#3B82F6', icon:'fa-id-card', requires:'[]' },
    { id:'application', zh:'发起通', en:'Originate', color:'#F59E0B', icon:'fa-upload', requires:'["initiator"]' },
    { id:'assess', zh:'评估通', en:'Assess', color:'#6366F1', icon:'fa-filter', requires:'["participant"]' },
    { id:'risk', zh:'风控通', en:'Risk', color:'#6366F1', icon:'fa-shield-alt', requires:'["participant"]' },
    { id:'opportunity', zh:'参与通', en:'Deal', color:'#10B981', icon:'fa-handshake', requires:'["participant"]' },
    { id:'terms', zh:'条款通', en:'Terms', color:'#8B5CF6', icon:'fa-sliders-h', requires:'["initiator","participant"]' },
    { id:'contract', zh:'合约通', en:'Contract', color:'#8B5CF6', icon:'fa-file-contract', requires:'["initiator","participant"]' },
    { id:'settlement', zh:'结算通', en:'Settlement', color:'#EF4444', icon:'fa-calculator', requires:'["initiator","participant"]' },
    { id:'performance', zh:'履约通', en:'Performance', color:'#EF4444', icon:'fa-chart-line', requires:'["initiator","participant"]' },
  ]

  const connectsHTML = connects.map(cn => `
    <div class="connect-item" data-requires='${cn.requires}' data-id="${cn.id}" onclick="clickConnect('${cn.id}','${t(cn.zh,cn.en)}')">
      <div class="connect-icon" style="background:linear-gradient(135deg,${cn.color},${cn.color}dd);">
        <i class="fas ${cn.icon}"></i>
      </div>
      <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">${t(cn.zh,cn.en)}</span>
    </div>
  `).join('')

  const body = `
  ${getNavbarLight(lang)}

  <main style="max-width:1080px;margin:0 auto;padding:24px 20px 0;">

    <!-- Welcome banner -->
    <div class="reveal" style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:32px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="avatar-ring">
          <i class="fas fa-user" style="font-size:24px;color:white;"></i>
        </div>
        <div>
          <h1 style="font-size:24px;font-weight:800;color:var(--text-title);letter-spacing:-0.3px;" id="greeting">${t('你好','Hello')}</h1>
          <p style="font-size:14px;color:var(--text-tertiary);margin-top:2px;" id="sub-greeting">${t('管理你的身份，发起或参与投资机会','Manage identities, originate or participate in deals')}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <a href="/entity-verify${lang==='en'?'?lang=en':''}" class="btn-ghost" style="font-size:13px;">
          <i class="fas fa-plus-circle"></i>${t('认证新主体','Verify Entity')}
        </a>
      </div>
    </div>

    <!-- Stats overview row -->
    <div class="reveal stagger-1 quick-stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:32px;" id="stats-row">
      <div class="stat-panel"><div class="stat-number" id="stat-identities">0</div><div class="stat-label">${t('已解锁身份','Identities')}</div></div>
      <div class="stat-panel"><div class="stat-number" id="stat-entities">0</div><div class="stat-label">${t('已认证主体','Entities')}</div></div>
      <div class="stat-panel"><div class="stat-number" id="stat-initiated">0</div><div class="stat-label">${t('发起的机会','Originated')}</div></div>
      <div class="stat-panel"><div class="stat-number" id="stat-participated">0</div><div class="stat-label">${t('参与的机会','Participated')}</div></div>
    </div>

    <!-- Identity cards (Bento grid) -->
    <div class="reveal stagger-2">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#DBEAFE,#3B82F6);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-fingerprint" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:var(--text-title);">${t('我的身份 · 机会角色','My Identities · Deal Roles')}</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:36px;" id="identity-cards"></div>
    </div>

    <!-- Initiated deals -->
    <div class="reveal stagger-3" id="initiated-section" style="display:none;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#fef3c7,#F59E0B);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-rocket" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:var(--text-title);">${t('我发起的机会','Deals I Originated')}</h2>
        <span id="initiated-count" style="font-size:12px;font-weight:600;color:var(--text-tertiary);background:var(--bg-divider);padding:3px 12px;border-radius:20px;margin-left:auto;"></span>
      </div>
      <div id="initiated-list" style="display:grid;gap:12px;margin-bottom:36px;"></div>
    </div>

    <!-- Participated deals -->
    <div class="reveal stagger-4" id="participated-section" style="display:none;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#d1fae5,#10B981);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-hand-holding-usd" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:var(--text-title);">${t('我参与的机会','Deals I Participated In')}</h2>
        <span id="participated-count" style="font-size:12px;font-weight:600;color:var(--text-tertiary);background:var(--bg-divider);padding:3px 12px;border-radius:20px;margin-left:auto;"></span>
      </div>
      <div id="participated-list" style="display:grid;gap:12px;margin-bottom:36px;"></div>
    </div>

    <!-- Entities -->
    <div class="reveal stagger-5">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#e0e7ff,#6366F1);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-building" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:var(--text-title);">${t('已认证主体','Verified Entities')}</h2>
      </div>
      <div id="entity-list" style="margin-bottom:36px;"></div>
    </div>

    <div class="section-divider"></div>

    <!-- Quick Navigation -->
    <div class="reveal stagger-6">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#f1f5f9,#94a3b8);display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-th" style="font-size:14px;color:white;"></i>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:var(--text-title);">${t('九通导航','Navigate Connects')}</h2>
      </div>
      <div class="card-elevated" style="padding:28px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;" id="connects-grid">
          ${connectsHTML}
        </div>
      </div>
    </div>

  </main>

  ${getFooter(lang)}

  <script>
  var LANG=getLang();
  var IDENTITIES_META={
    initiator:{zh:'发起机会',en:'Originate Deals',icon:'fa-rocket',desc_zh:'作为融资者，上传经营数据，发起融资机会',desc_en:'As a fundraiser, upload data and originate financing deals',target_zh:'发起通',target_en:'Originate Connect',cta_zh:'发起融资机会',cta_en:'Originate Deals',color:'#F59E0B',gradient:'icp-initiator'},
    participant:{zh:'参与机会',en:'Participate in Deals',icon:'fa-search',desc_zh:'作为投资者，浏览投资项目，评估并参与投资机会',desc_en:'As an investor, browse projects, assess and participate in deals',target_zh:'参与通',target_en:'Deal Connect',cta_zh:'参与投资机会',cta_en:'Participate in Deals',color:'#10B981',gradient:'icp-participant'},
    organization:{zh:'机构身份',en:'Organization',icon:'fa-building',desc_zh:'机构级权限，批量操作和自定义工作流',desc_en:'Institutional access with batch operations & custom workflows',target_zh:'全部通',target_en:'All Connects',cta_zh:'进入机构工作台',cta_en:'Enter Org Workspace',color:'#6366F1',gradient:'icp-organization'}
  };
  var tt=function(z,e){return LANG==='en'?e:z};

  (function init(){
    if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return}
    var user=getUser();
    document.getElementById('greeting').textContent=tt('你好，','Hello, ')+user.name;
    document.getElementById('sub-greeting').textContent=tt('注册于 '+user.createdAt+' · 管理你的身份，开启投融资之旅','Since '+user.createdAt+' · Manage identities, start your journey');

    // Stats
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
      var cls=unlocked?m.gradient:'icp-locked';
      var textColor=unlocked?'rgba(0,0,0,0.75)':'var(--text-secondary)';
      var subColor=unlocked?'rgba(0,0,0,0.5)':'var(--text-tertiary)';
      return '<div class="identity-card-premium '+cls+'">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'+
          '<div style="width:48px;height:48px;border-radius:14px;background:'+(unlocked?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.04)')+';display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">'+
            '<i class="fas '+m.icon+'" style="font-size:20px;color:'+(unlocked?'rgba(0,0,0,0.6)':'var(--text-tertiary)')+';"></i>'+
          '</div>'+
          (unlocked?'<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.3);font-size:11px;font-weight:600;color:rgba(0,0,0,0.6);backdrop-filter:blur(4px);"><i class="fas fa-check-circle" style="font-size:10px;"></i>'+tt('已解锁','Unlocked')+'</span>':
          '<span style="font-size:11px;color:var(--text-placeholder);">'+tt('未解锁','Locked')+'</span>')+
        '</div>'+
        '<h3 style="font-size:17px;font-weight:700;color:'+textColor+';margin-bottom:4px;">'+tt(m.zh,m.en)+'</h3>'+
        '<p style="font-size:12px;color:'+subColor+';margin-bottom:20px;line-height:1.5;">'+tt(m.desc_zh,m.desc_en)+'</p>'+
        (unlocked?
          '<div style="display:flex;align-items:center;justify-content:space-between;">'+
            '<span style="font-size:11px;color:'+subColor+';">'+id.unlockedAt+'</span>'+
            '<button class="btn-card-action" onclick="enterConnect(\''+role+'\')">'+
              tt(m.cta_zh,m.cta_en)+' <i class="fas fa-arrow-right" style="margin-left:4px;font-size:10px;"></i></button>'+
          '</div>'
          :
          '<button class="btn-card-unlock" onclick="unlockIdentity(\''+role+'\')">'+
            '<i class="fas fa-lock-open" style="margin-right:6px;"></i>'+tt('解锁此角色','Unlock This Role')+'</button>'
        )+
      '</div>';
    }).join('');
  }

  function renderEntities(user){
    var c=document.getElementById('entity-list');
    if(!user.entities||user.entities.length===0){
      c.innerHTML='<div class="card-elevated" style="padding:32px;text-align:center;"><i class="fas fa-building" style="font-size:28px;color:var(--text-placeholder);margin-bottom:12px;display:block;"></i><p style="font-size:14px;color:var(--text-tertiary);margin-bottom:4px;">'+tt('暂无已认证主体','No verified entities yet')+'</p><p style="font-size:12px;color:var(--text-placeholder);">'+tt('认证主体后可进入协作空间','Verify an entity to access workspace')+'</p></div>';
      return;
    }
    c.innerHTML=user.entities.map(function(e){
      return '<div class="card-elevated" style="padding:20px 24px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">'+
        '<div style="display:flex;align-items:center;gap:14px;">'+
          '<div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#e0e7ff,#a5b4fc);display:flex;align-items:center;justify-content:center;"><i class="fas fa-store" style="font-size:16px;color:#4f46e5;"></i></div>'+
          '<div>'+
            '<div style="font-size:15px;font-weight:600;color:var(--text-title);">'+e.entityName+'</div>'+
            '<div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;"><i class="fas fa-user-tag" style="margin-right:4px;"></i>'+e.role+' · '+e.verifiedAt+'</div>'+
          '</div>'+
        '</div>'+
        '<button class="btn-ghost" style="font-size:12px;padding:8px 16px;" onclick="showToast(\''+tt('协作空间开发中','Workspace coming soon')+'\',\'info\')"><i class="fas fa-arrow-right" style="margin-right:4px;"></i>'+tt('进入空间','Workspace')+'</button>'+
      '</div>';
    }).join('');
  }

  function updateConnects(user){
    var roles=user.identities.map(function(i){return i.role});
    var hasOrg=roles.includes('organization');
    document.querySelectorAll('.connect-item').forEach(function(el){
      var req=JSON.parse(el.getAttribute('data-requires'));
      var id=el.getAttribute('data-id');
      var ok=false;
      if(id==='identity')ok=true;
      else if(hasOrg)ok=true;
      else if(req.length===0)ok=true;
      else ok=req.some(function(r){return roles.includes(r)});
      if(!ok){el.classList.add('disabled');el.title=tt('需先解锁对应身份','Unlock required identity first')}
      else{el.classList.remove('disabled')}
    });
  }

  async function unlockIdentity(role){
    var r=await api('/api/user/unlock',{method:'POST',body:JSON.stringify({role:role})});
    if(r.success){var u=getUser();u.identities.push(r.identity);localStorage.setItem('ic_user',JSON.stringify(u));showToast(tt('角色解锁成功！','Role unlocked!'),'success');document.getElementById('stat-identities').textContent=u.identities.length;renderIdentityCards(u);updateConnects(u);loadDeals(u)}
    else{showToast(r.message,'error')}
  }
  function enterConnect(role){var m=IDENTITIES_META[role];showToast(tt('即将跳转到'+m.target_zh+'（开发中）','Redirecting to '+m.target_en+' (coming soon)'),'info')}
  function clickConnect(id,name){
    if(id==='identity'){showToast(tt('你已在身份通','You are in Identity Connect'),'info');return}
    var el=document.querySelector('[data-id="'+id+'"]');
    if(el&&el.classList.contains('disabled')){showToast(tt('需先解锁对应角色 — '+name,'Unlock required role for '+name),'error');return}
    showToast(tt('即将跳转到'+name+'（开发中）','Redirecting to '+name+' (coming soon)'),'info');
  }

  // Deal status maps
  var DS={draft:{zh:'草稿',en:'Draft',color:'#64748b',bg:'#f1f5f9',icon:'fa-pencil-alt'},submitted:{zh:'已提交',en:'Submitted',color:'#3b82f6',bg:'#eff6ff',icon:'fa-paper-plane'},under_review:{zh:'审核中',en:'Reviewing',color:'#f59e0b',bg:'#fffbeb',icon:'fa-clock'},approved:{zh:'已通过',en:'Approved',color:'#22c55e',bg:'#f0fdf4',icon:'fa-check-circle'},live:{zh:'募集中',en:'Live',color:'#3B82F6',bg:'#DBEAFE',icon:'fa-broadcast-tower'},completed:{zh:'已完成',en:'Done',color:'#64748b',bg:'#f1f5f9',icon:'fa-flag-checkered'},rejected:{zh:'已拒绝',en:'Rejected',color:'#ef4444',bg:'#fef2f2',icon:'fa-times-circle'}};
  var PS={watching:{zh:'关注中',en:'Watching',color:'#64748b',bg:'#f1f5f9',icon:'fa-eye'},evaluating:{zh:'评估中',en:'Evaluating',color:'#f59e0b',bg:'#fffbeb',icon:'fa-search'},committed:{zh:'已承诺',en:'Committed',color:'#3B82F6',bg:'#DBEAFE',icon:'fa-handshake'},signed:{zh:'已签约',en:'Signed',color:'#22c55e',bg:'#f0fdf4',icon:'fa-file-signature'},settled:{zh:'已结算',en:'Settled',color:'#6366f1',bg:'#eef2ff',icon:'fa-calculator'},exited:{zh:'已退出',en:'Exited',color:'#64748b',bg:'#f1f5f9',icon:'fa-door-open'}};

  function badge(map,s){var v=map[s]||{zh:s,en:s,color:'#64748b',bg:'#f1f5f9',icon:'fa-circle'};return '<span class="tag" style="color:'+v.color+';background:'+v.bg+';"><i class="fas '+v.icon+'" style="font-size:9px;"></i>'+tt(v.zh,v.en)+'</span>'}

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
              '<h3 style="font-size:15px;font-weight:700;color:var(--text-title);margin:0;">'+d.title+'</h3>'+
              badge(DS,d.status)+
            '</div>'+
            '<div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:var(--text-secondary);">'+
              '<span><i class="fas fa-tag" style="margin-right:4px;color:var(--text-tertiary);"></i>'+d.industry+'</span>'+
              '<span><i class="fas fa-coins" style="margin-right:4px;color:#F59E0B;"></i>'+d.amount+'</span>'+
              (d.monthlyRevenue?'<span><i class="fas fa-chart-bar" style="margin-right:4px;color:#10B981;"></i>'+d.monthlyRevenue+'</span>':'')+
              (d.term?'<span><i class="fas fa-calendar" style="margin-right:4px;color:var(--text-tertiary);"></i>'+d.term+'</span>':'')+
            '</div>'+
            (d.progress!=null?'<div class="progress-bar" style="margin-top:12px;"><div class="progress-fill" style="width:'+d.progress+'%;"></div></div><div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">'+tt('进度','Progress')+' '+d.progress+'%</div>':'')+
          '</div>'+
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">'+
            '<span style="font-size:11px;color:var(--text-placeholder);">'+d.updatedAt+'</span>'+
            '<button class="btn-ghost" style="padding:6px 14px;font-size:11px;" onclick="showToast(\''+tt('即将跳转到发起通（开发中）','Redirecting to Originate (coming soon)')+'\',\'info\')"><i class="fas fa-external-link-alt" style="margin-right:4px;"></i>'+tt('详情','Details')+'</button>'+
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
              '<h3 style="font-size:15px;font-weight:700;color:var(--text-title);margin:0;">'+p.dealTitle+'</h3>'+
              badge(PS,p.status)+
            '</div>'+
            '<div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:var(--text-secondary);">'+
              '<span><i class="fas fa-tag" style="margin-right:4px;color:var(--text-tertiary);"></i>'+p.industry+'</span>'+
              '<span><i class="fas fa-coins" style="margin-right:4px;color:#F59E0B;"></i>'+tt('总额 ','Total ')+p.amount+'</span>'+
              (p.committedAmount?'<span><i class="fas fa-handshake" style="margin-right:4px;color:#3B82F6;"></i>'+tt('承诺 ','Committed ')+p.committedAmount+'</span>':'')+
              (p.expectedReturn?'<span><i class="fas fa-percentage" style="margin-right:4px;color:#10B981;"></i>'+p.expectedReturn+'</span>':'')+
              (p.riskScore?'<span><i class="fas fa-shield-alt" style="margin-right:4px;color:#6366F1;"></i>'+p.riskScore+'</span>':'')+
            '</div>'+
          '</div>'+
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">'+
            '<span style="font-size:11px;color:var(--text-placeholder);">'+p.updatedAt+'</span>'+
            '<button class="btn-ghost" style="padding:6px 14px;font-size:11px;" onclick="showToast(\''+tt('即将跳转到参与通（开发中）','Redirecting to Deal Connect (coming soon)')+'\',\'info\')"><i class="fas fa-external-link-alt" style="margin-right:4px;"></i>'+tt('详情','Details')+'</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  </script>`

  return c.html(htmlShell(t('工作台 | 身份通', 'Dashboard | Identity Connect'), body, lang))
})


// ═══════════════════════════════════════════
// PAGE 3 — Entity Verification (/entity-verify)
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
  ${getNavbarLight(lang)}

  <main style="max-width:560px;margin:0 auto;padding:32px 20px 0;">
    <!-- Breadcrumb -->
    <div class="reveal" style="margin-bottom:28px;">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--identity);text-decoration:none;font-weight:500;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
        <i class="fas fa-arrow-left"></i>${t('返回工作台', 'Back to Dashboard')}
      </a>
    </div>

    <!-- Steps indicator -->
    <div class="reveal stagger-1" style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--identity);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">1</div>
        <span style="font-size:13px;font-weight:600;color:var(--text-title);">${t('填写信息','Fill Info')}</span>
      </div>
      <div style="flex:1;height:2px;background:linear-gradient(90deg,var(--identity),var(--text-placeholder));border-radius:1px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--bg-divider);color:var(--text-tertiary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">2</div>
        <span style="font-size:13px;color:var(--text-tertiary);">${t('提交审核','Review')}</span>
      </div>
      <div style="flex:1;height:2px;background:var(--bg-divider);border-radius:1px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--bg-divider);color:var(--text-tertiary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">3</div>
        <span style="font-size:13px;color:var(--text-tertiary);">${t('完成','Done')}</span>
      </div>
    </div>

    <!-- Form card -->
    <div class="card-elevated reveal stagger-2" style="padding:36px 32px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#e0e7ff,#6366F1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 16px rgba(99,102,241,0.2);">
          <i class="fas fa-building" style="font-size:24px;color:white;"></i>
        </div>
        <h1 style="font-size:22px;font-weight:800;color:var(--text-title);letter-spacing:-0.3px;">
          ${t('认证你的主体', 'Verify Your Entity')}
        </h1>
        <p style="font-size:13px;color:var(--text-tertiary);margin-top:6px;">
          ${t('认证通过后即可进入该主体的协作空间', 'Access the entity workspace after verification')}
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">
          ${t('公司/项目名称', 'Company/Project Name')} <span style="color:#ef4444;">*</span>
        </label>
        <input id="ent-name" class="input-field" placeholder="${t('例如: ABC 餐饮连锁', 'e.g. ABC Restaurant Chain')}">
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">
          ${t('统一社会信用代码', 'Unified Credit Code')}
        </label>
        <input id="ent-code" class="input-field" placeholder="${t('选填 — 非必填', 'Optional')}">
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">
          ${t('你在该主体的角色', 'Your Role')} <span style="color:#ef4444;">*</span>
        </label>
        <select id="ent-role" class="input-field" style="appearance:auto;cursor:pointer;">
          ${roleOptions.map(r => `<option value="${r.value}">${t(r.zh, r.en)}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:28px;">
        <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">
          ${t('上传证明材料', 'Upload Documents')}
        </label>
        <div id="upload-zone" class="upload-zone">
          <i class="fas fa-cloud-upload-alt" style="font-size:28px;color:var(--text-placeholder);margin-bottom:10px;display:block;"></i>
          <p style="font-size:13px;color:var(--text-tertiary);line-height:1.6;">
            ${t('营业执照 / 授权书等', 'Business license / authorization')}<br>
            <span style="font-size:11px;color:var(--text-placeholder);">${t('Demo 阶段可跳过','Skip for Demo')}</span>
          </p>
        </div>
      </div>

      <button class="btn-primary btn-glow" style="width:100%;" onclick="submitEntity()">
        <i class="fas fa-paper-plane"></i>${t('提交认证', 'Submit Verification')}
      </button>
    </div>

    <!-- Hint -->
    <div class="reveal stagger-3" style="margin-top:20px;padding:14px 18px;background:rgba(59,130,246,0.03);border:1px solid rgba(59,130,246,0.08);border-radius:14px;">
      <p style="font-size:12px;color:var(--text-tertiary);display:flex;align-items:center;gap:6px;">
        <i class="fas fa-flask" style="color:var(--identity);"></i>
        ${t('Demo 阶段提交即通过，无需真实材料。', 'Demo: auto-approve on submit, no real documents needed.')}
      </p>
    </div>
  </main>

  ${getFooter(lang)}

  <script>
  (function(){if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return}})();
  async function submitEntity(){
    var n=document.getElementById('ent-name').value.trim();
    var c=document.getElementById('ent-code').value.trim();
    var r=document.getElementById('ent-role').value;
    if(!n){showToast('${t('请填写公司/项目名称','Please enter entity name')}','error');return}
    var res=await api('/api/entity/verify',{method:'POST',body:JSON.stringify({entityName:n,creditCode:c,role:r})});
    if(res.success){var u=getUser();u.entities.push(res.entity);localStorage.setItem('ic_user',JSON.stringify(u));showToast('${t('认证成功！','Verified!')}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},1000)}
    else{showToast(res.message||'${t('提交失败','Failed')}','error')}
  }
  </script>`

  return c.html(htmlShell(t('主体认证 | 身份通', 'Entity Verification | Identity Connect'), body, lang))
})


export default app
