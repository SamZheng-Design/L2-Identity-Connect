// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect — V12.1 Entry Point
// 组装所有模块：Core + Login + Dashboard + Pages
// ═══════════════════════════════════════════════════════

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  createJWT, parseJWT, users, deals, findUser, findUserById,
  getUserFromToken, getInitiatedDeals, getParticipatedDeals,
  User, Identity, EntityAuth
} from './core'
import { loginPage } from './login'
import { dashboardPage } from './dashboard'
import { settingsPage, notificationsPage, entityVerifyPage } from './pages'

const app = new Hono()
app.use('/api/*', cors())

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
  if (findUser(phone, email)) return c.json({ success: false, message: '该账号已注册' }, 400)
  const u: User = {
    id: `u-${String(Date.now()).slice(-6)}`,
    ...(phone ? { phone } : {}),
    ...(email ? { email, password } : {}),
    name, identities: [], entities: [],
    createdAt: new Date().toISOString().split('T')[0]
  }
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

app.post('/api/auth/sso-token', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  const ssoToken = createJWT({ userId: u.id, name: u.name, type: 'sso', scope: 'all-connects' })
  return c.json({ success: true, ssoToken })
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
  if (!['initiator', 'participant', 'organization'].includes(role)) return c.json({ success: false, message: '无效角色' }, 400)
  if (u.identities.find(i => i.role === role)) return c.json({ success: false, message: '已解锁' }, 400)
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
  if (!u.identities.find(i => i.role === 'organization')) {
    u.identities.push({ role: 'organization', unlockedAt: new Date().toISOString().split('T')[0], status: 'active' })
  }
  return c.json({ success: true, entity, user: { ...u, password: undefined } })
})

app.get('/api/deals/initiated', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, deals: getInitiatedDeals(u.id) })
})

app.get('/api/deals/participated', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  return c.json({ success: true, deals: getParticipatedDeals(u.id) })
})

app.get('/api/deals/all', (c) => {
  const u = getUserFromToken(c.req.header('Authorization'))
  if (!u) return c.json({ success: false, message: '未授权' }, 401)
  const initiated = getInitiatedDeals(u.id)
  const participated = getParticipatedDeals(u.id)
  const allIds = new Set<string>()
  const all: typeof deals = []
  ;[...initiated, ...participated].forEach(d => { if (!allIds.has(d.id)) { allIds.add(d.id); all.push(d) } })
  return c.json({ success: true, deals: all, initiatedCount: initiated.length, participatedCount: participated.length })
})

// ═══════════════════════════════════════════
// Page Routes
// ═══════════════════════════════════════════

app.get('/', (c) => {
  const lang = c.req.query('lang') || 'zh'
  return c.html(loginPage(lang))
})

app.get('/dashboard', (c) => {
  const lang = c.req.query('lang') || 'zh'
  return c.html(dashboardPage(lang))
})

app.get('/settings', (c) => {
  const lang = c.req.query('lang') || 'zh'
  return c.html(settingsPage(lang))
})

app.get('/notifications', (c) => {
  const lang = c.req.query('lang') || 'zh'
  return c.html(notificationsPage(lang))
})

app.get('/entity-verify', (c) => {
  const lang = c.req.query('lang') || 'zh'
  return c.html(entityVerifyPage(lang))
})

export default app
