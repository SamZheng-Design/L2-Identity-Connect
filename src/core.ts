// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect — V12.1 Core Module
// JWT · Data Models · Demo Data · i18n · Shared Components
// ═══════════════════════════════════════════════════════

// ─── JWT (Demo) ───
export const JWT_SECRET = 'micro-connect-demo-secret-2026'

export function toB64(s: string): string {
  const b = new TextEncoder().encode(s)
  let r = ''; for (const c of b) r += String.fromCharCode(c)
  return btoa(r).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function fromB64(s: string): string {
  const p = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4)
  const b = atob(p); const u = new Uint8Array(b.length)
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i)
  return new TextDecoder().decode(u)
}
export function createJWT(payload: Record<string, unknown>): string {
  const h = toB64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const b = toB64(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 }))
  return `${h}.${b}.${toB64(JWT_SECRET + h + b)}`
}
export function parseJWT(token: string): Record<string, unknown> | null {
  try {
    const [, body] = token.split('.')
    if (!body) return null
    const p = JSON.parse(fromB64(body))
    return (p.exp && p.exp < Date.now()) ? null : p
  } catch { return null }
}

// ─── Data Models ───
export interface User {
  id: string; phone?: string; email?: string; name: string; password?: string
  identities: Identity[]; entities: EntityAuth[]; createdAt: string; avatar?: string
}
export type IdentityRole = 'initiator' | 'participant' | 'organization'
export interface Identity { role: IdentityRole; unlockedAt: string; status: 'active' | 'pending' | 'suspended' }
export interface EntityAuth { entityId: string; entityName: string; role: string; verifiedAt: string }

export type PipelineStage = 'originate' | 'assess' | 'risk' | 'deal' | 'terms' | 'contract' | 'settlement' | 'performance'
export interface Deal {
  id: string; title: string; entityName: string; industry: string
  amount: string; period: string
  status: 'draft' | 'pending' | 'live' | 'closed' | 'matched'
  createdAt: string; initiatorId: string; participantIds: string[]
  pipeline: { stage: PipelineStage; status: 'completed' | 'active' | 'pending' | 'blocked'; updatedAt: string }[]
  nextAction?: string
}

export interface Notification {
  id: string; type: 'deal' | 'system' | 'role' | 'entity' | 'security'
  title: string; desc: string; time: string; read: boolean
  icon: string; color: string
}

export interface SecurityLog {
  id: string; action: string; detail: string; time: string; ip: string
  icon: string; color: string
}

// ─── Demo Deals ───
export const deals: Deal[] = [
  {
    id: 'd-001', title: 'ABC 餐饮连锁 · 华南区30店扩张', entityName: 'ABC 餐饮连锁', industry: '餐饮',
    amount: '¥2,000万', period: '18个月', status: 'live', createdAt: '2026-02-10',
    initiatorId: 'u-001', participantIds: ['u-002'],
    pipeline: [
      { stage: 'originate', status: 'completed', updatedAt: '2026-02-10' },
      { stage: 'assess', status: 'completed', updatedAt: '2026-02-14' },
      { stage: 'risk', status: 'completed', updatedAt: '2026-02-18' },
      { stage: 'deal', status: 'active', updatedAt: '2026-02-22' },
      { stage: 'terms', status: 'pending', updatedAt: '' },
      { stage: 'contract', status: 'pending', updatedAt: '' },
      { stage: 'settlement', status: 'pending', updatedAt: '' },
      { stage: 'performance', status: 'pending', updatedAt: '' },
    ],
    nextAction: '等待投资者确认参与意向'
  },
  {
    id: 'd-002', title: 'ABC 餐饮连锁 · 供应链升级', entityName: 'ABC 餐饮连锁', industry: '餐饮',
    amount: '¥500万', period: '12个月', status: 'pending', createdAt: '2026-02-20',
    initiatorId: 'u-001', participantIds: [],
    pipeline: [
      { stage: 'originate', status: 'completed', updatedAt: '2026-02-20' },
      { stage: 'assess', status: 'active', updatedAt: '2026-02-24' },
      { stage: 'risk', status: 'pending', updatedAt: '' },
      { stage: 'deal', status: 'pending', updatedAt: '' },
      { stage: 'terms', status: 'pending', updatedAt: '' },
      { stage: 'contract', status: 'pending', updatedAt: '' },
      { stage: 'settlement', status: 'pending', updatedAt: '' },
      { stage: 'performance', status: 'pending', updatedAt: '' },
    ],
    nextAction: '评估通正在进行AI量化评估'
  },
  {
    id: 'd-003', title: '鲜果时光 · 华东区50店', entityName: '鲜果时光', industry: '零售',
    amount: '¥3,500万', period: '24个月', status: 'live', createdAt: '2026-01-28',
    initiatorId: 'u-003', participantIds: ['u-002'],
    pipeline: [
      { stage: 'originate', status: 'completed', updatedAt: '2026-01-28' },
      { stage: 'assess', status: 'completed', updatedAt: '2026-02-02' },
      { stage: 'risk', status: 'completed', updatedAt: '2026-02-06' },
      { stage: 'deal', status: 'completed', updatedAt: '2026-02-10' },
      { stage: 'terms', status: 'active', updatedAt: '2026-02-15' },
      { stage: 'contract', status: 'pending', updatedAt: '' },
      { stage: 'settlement', status: 'pending', updatedAt: '' },
      { stage: 'performance', status: 'pending', updatedAt: '' },
    ],
    nextAction: '条款通磋商进行中'
  },
  {
    id: 'd-004', title: '快捷健身 · 全国200店', entityName: '快捷健身', industry: '健身',
    amount: '¥8,000万', period: '36个月', status: 'matched', createdAt: '2026-01-15',
    initiatorId: 'u-003', participantIds: ['u-002'],
    pipeline: [
      { stage: 'originate', status: 'completed', updatedAt: '2026-01-15' },
      { stage: 'assess', status: 'completed', updatedAt: '2026-01-18' },
      { stage: 'risk', status: 'completed', updatedAt: '2026-01-22' },
      { stage: 'deal', status: 'completed', updatedAt: '2026-01-25' },
      { stage: 'terms', status: 'completed', updatedAt: '2026-01-30' },
      { stage: 'contract', status: 'completed', updatedAt: '2026-02-05' },
      { stage: 'settlement', status: 'active', updatedAt: '2026-02-10' },
      { stage: 'performance', status: 'pending', updatedAt: '' },
    ],
    nextAction: '结算通正在记录首笔交易'
  },
  {
    id: 'd-005', title: '茶百道加盟 · 西南区域', entityName: '茶百道', industry: '茶饮',
    amount: '¥1,200万', period: '12个月', status: 'live', createdAt: '2026-02-25',
    initiatorId: 'u-001', participantIds: [],
    pipeline: [
      { stage: 'originate', status: 'completed', updatedAt: '2026-02-25' },
      { stage: 'assess', status: 'active', updatedAt: '2026-02-27' },
      { stage: 'risk', status: 'pending', updatedAt: '' },
      { stage: 'deal', status: 'pending', updatedAt: '' },
      { stage: 'terms', status: 'pending', updatedAt: '' },
      { stage: 'contract', status: 'pending', updatedAt: '' },
      { stage: 'settlement', status: 'pending', updatedAt: '' },
      { stage: 'performance', status: 'pending', updatedAt: '' },
    ],
    nextAction: '等待评估通筛子运行'
  },
]

// ─── Demo Users ───
export const users: User[] = [
  { id: 'u-001', phone: '13800001234', name: '张三', identities: [{ role: 'initiator', unlockedAt: '2026-01-15', status: 'active' }, { role: 'participant', unlockedAt: '2026-02-01', status: 'active' }], entities: [{ entityId: 'e-001', entityName: 'ABC 餐饮连锁', role: '法人代表', verifiedAt: '2026-01-20' }], createdAt: '2026-01-10' },
  { id: 'u-002', email: 'investor@fund.com', name: '李四', password: 'demo123', identities: [{ role: 'participant', unlockedAt: '2026-01-08', status: 'active' }, { role: 'organization', unlockedAt: '2026-01-10', status: 'active' }], entities: [{ entityId: 'e-010', entityName: '新锐资本', role: '投资总监', verifiedAt: '2026-01-12' }], createdAt: '2026-01-05' },
  { id: 'u-003', phone: '13900005678', name: '王五', identities: [{ role: 'initiator', unlockedAt: '2026-02-20', status: 'active' }], entities: [], createdAt: '2026-02-18' }
]

// Demo notifications
export const demoNotifications: Notification[] = [
  { id: 'n-001', type: 'deal', title: 'ABC餐饮连锁进入参与阶段', desc: '投资者可在参与通确认投资意向', time: '2小时前', read: false, icon: 'fa-handshake', color: '#10B981' },
  { id: 'n-002', type: 'system', title: '评估通AI筛子已更新', desc: '茶百道加盟项目正在进行AI量化评估', time: '5小时前', read: false, icon: 'fa-robot', color: '#6366F1' },
  { id: 'n-003', type: 'role', title: '参与角色已解锁', desc: '你已成功解锁参与角色，可浏览投资机会', time: '1天前', read: true, icon: 'fa-unlock', color: '#5DC4B3' },
  { id: 'n-004', type: 'entity', title: 'ABC餐饮连锁认证通过', desc: '法人代表身份已验证，可管理公司下的投资机会', time: '3天前', read: true, icon: 'fa-building', color: '#F59E0B' },
  { id: 'n-005', type: 'security', title: '新设备登录提醒', desc: '你的账号在 Chrome/MacOS 上登录成功', time: '5天前', read: true, icon: 'fa-shield-alt', color: '#EF4444' },
]

// Demo security logs
export const demoSecurityLogs: SecurityLog[] = [
  { id: 's-001', action: '登录成功', detail: 'Chrome · MacOS · 深圳', time: '2026-03-02 09:15', ip: '120.231.***.**', icon: 'fa-sign-in-alt', color: '#34c759' },
  { id: 's-002', action: '解锁角色', detail: '解锁了参与角色', time: '2026-02-28 14:30', ip: '120.231.***.**', icon: 'fa-unlock', color: '#5DC4B3' },
  { id: 's-003', action: '主体认证', detail: 'ABC餐饮连锁 · 法人代表', time: '2026-02-25 11:00', ip: '120.231.***.**', icon: 'fa-building', color: '#6366F1' },
  { id: 's-004', action: '密码修改', detail: '密码已成功修改', time: '2026-02-20 16:45', ip: '120.231.***.**', icon: 'fa-key', color: '#F59E0B' },
  { id: 's-005', action: '登录成功', detail: 'Safari · iOS · 广州', time: '2026-02-18 08:22', ip: '183.56.***.**', icon: 'fa-sign-in-alt', color: '#34c759' },
]

// ─── Utility Functions ───
export function findUser(phone?: string, email?: string): User | undefined {
  if (phone) return users.find(u => u.phone === phone)
  if (email) return users.find(u => u.email === email)
}
export function findUserById(id: string) { return users.find(u => u.id === id) }
export function getUserFromToken(auth: string | undefined): User | null {
  if (!auth?.startsWith('Bearer ')) return null
  const p = parseJWT(auth.slice(7))
  return p?.userId ? (findUserById(p.userId as string) || null) : null
}
export function getInitiatedDeals(userId: string) { return deals.filter(d => d.initiatorId === userId) }
export function getParticipatedDeals(userId: string) { return deals.filter(d => d.participantIds.includes(userId)) }

// ─── Connect product definitions with externalUrl ───
export function getConnects(zh: boolean) {
  const baseUrl = 'https://microconnect.com'
  return [
    { id: 'identity', name: zh ? '身份通' : 'Identity', char: '身', color: '#5DC4B3', icon: 'fa-id-card', requires: [] as string[], status: 'live' as const, desc: zh ? '统一入口 · 角色管理' : 'Unified entry', role: 'shared' as const, externalUrl: '' },
    { id: 'application', name: zh ? '发起通' : 'Originate', char: '发', color: '#F59E0B', icon: 'fa-upload', requires: ['initiator'], status: 'beta' as const, desc: zh ? 'AI打包 · 发起机会' : 'AI packaging', role: 'borrower' as const, externalUrl: `${baseUrl}/application` },
    { id: 'assess', name: zh ? '评估通' : 'Assess', char: '评', color: '#6366F1', icon: 'fa-filter', requires: ['participant'], status: 'beta' as const, desc: zh ? '自建AI筛子' : 'AI sieves', role: 'investor' as const, externalUrl: `${baseUrl}/assess` },
    { id: 'risk', name: zh ? '风控通' : 'Risk', char: '风', color: '#EF4444', icon: 'fa-shield-alt', requires: ['participant'], status: 'live' as const, desc: zh ? '风控 · 验真' : 'Risk · Verify', role: 'investor' as const, externalUrl: `${baseUrl}/risk` },
    { id: 'opportunity', name: zh ? '参与通' : 'Deal', char: '参', color: '#10B981', icon: 'fa-handshake', requires: ['participant'], status: 'live' as const, desc: zh ? '项目看板 · 参与' : 'Deal board', role: 'investor' as const, externalUrl: `${baseUrl}/opportunity` },
    { id: 'terms', name: zh ? '条款通' : 'Terms', char: '条', color: '#8B5CF6', icon: 'fa-sliders-h', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '三联动 · 磋商' : 'Negotiate', role: 'collaborative' as const, externalUrl: `${baseUrl}/terms` },
    { id: 'contract', name: zh ? '合约通' : 'Contract', char: '合', color: '#3B82F6', icon: 'fa-file-contract', requires: ['initiator', 'participant'], status: 'beta' as const, desc: zh ? '电子签署' : 'E-sign', role: 'collaborative' as const, externalUrl: `${baseUrl}/contract` },
    { id: 'settlement', name: zh ? '结算通' : 'Settle', char: '结', color: '#F97316', icon: 'fa-calculator', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '大账本' : 'Ledger', role: 'collaborative' as const, externalUrl: `${baseUrl}/settlement` },
    { id: 'performance', name: zh ? '履约通' : 'Perform', char: '履', color: '#14B8A6', icon: 'fa-chart-line', requires: ['initiator', 'participant'], status: 'coming' as const, desc: zh ? '每日监控' : 'Monitor', role: 'collaborative' as const, externalUrl: `${baseUrl}/performance` },
  ]
}

// Stage metadata
export const STAGE_META: Record<string, { icon: string; color: string }> = {
  originate: { icon: 'fa-upload', color: '#F59E0B' },
  assess: { icon: 'fa-filter', color: '#6366F1' },
  risk: { icon: 'fa-shield-alt', color: '#EF4444' },
  deal: { icon: 'fa-handshake', color: '#10B981' },
  terms: { icon: 'fa-sliders-h', color: '#8B5CF6' },
  contract: { icon: 'fa-file-contract', color: '#3B82F6' },
  settlement: { icon: 'fa-calculator', color: '#F97316' },
  performance: { icon: 'fa-chart-line', color: '#14B8A6' },
}

// ─── i18n ───
export function T(lang: string) {
  const zh = lang !== 'en'
  return {
    zh,
    nav: {
      title: zh ? '身份通' : 'Identity Connect',
      backToMain: zh ? '主站' : 'Main Site',
      langLabel: zh ? 'EN' : '中',
      langToggle: zh ? 'en' : 'zh',
    },
    auth: {
      welcome: zh ? '欢迎来到滴灌通' : 'Welcome to Micro Connect',
      subtitle: zh ? '所有"通"产品的统一登录入口' : 'Unified gateway for all Connect products',
      desc: zh ? '登录身份通，进入你的主操作台，管理所有投融资流程' : 'Login to access your command center and manage all investment flows',
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
      trustSSO: zh ? '单点登录' : 'SSO',
      trustEncrypt: zh ? '端到端加密' : 'E2E Encrypted',
      trustRBAC: zh ? 'RBAC 权控' : 'RBAC',
      trustCompliance: zh ? '合规审计' : 'Compliance',
    },
    cmd: {
      title: zh ? '主操作台' : 'Command Center',
      greeting: zh ? '你好' : 'Hello',
      subtitle: zh ? '你的 RBF 投融资全流程操作中心' : 'Your RBF investment operations hub',
      overview: zh ? '全局概览' : 'Overview',
      myConnects: zh ? '我的通' : 'My Connects',
      pipeline: zh ? '项目管线' : 'Pipeline',
      activity: zh ? '最近动态' : 'Recent Activity',
      quickActions: zh ? '快捷操作' : 'Quick Actions',
      roleSection: zh ? '身份角色' : 'Identity Roles',
      entitySection: zh ? '认证主体' : 'Verified Entities',
      noEntities: zh ? '暂无认证主体' : 'No verified entities',
      addEntity: zh ? '+ 认证新主体' : '+ Verify Entity',
      pipelineTitle: zh ? '项目全生命周期' : 'Deal Lifecycle Pipeline',
      pipelineDesc: zh ? '跨通追踪每个项目的进度' : 'Track each deal across all Connects',
      noPipeline: zh ? '暂无进行中的项目' : 'No active pipelines',
      connectHub: zh ? '九通产品矩阵' : '9 Connect Products',
      connectHubDesc: zh ? '点击进入对应的通，SSO 已同步' : 'Click to enter — SSO enabled',
      settings: zh ? '账户设置' : 'Settings',
      notifications: zh ? '通知' : 'Notifications',
      allDeals: zh ? '全部' : 'All',
      activeDeals: zh ? '进行中' : 'Active',
      completedDeals: zh ? '已完成' : 'Completed',
    },
    roles: {
      initiator: { name: zh ? '发起角色' : 'Originator', desc: zh ? '发起投资机会，上传经营数据' : 'Originate deals, upload data', icon: 'fa-rocket', color: '#3D8F83' },
      participant: { name: zh ? '参与角色' : 'Participant', desc: zh ? '浏览、筛选和参与投资机会' : 'Browse and participate in deals', icon: 'fa-search-dollar', color: '#32ade6' },
      organization: { name: zh ? '机构身份' : 'Institution', desc: zh ? '以机构身份管理投融资' : 'Manage as institution', icon: 'fa-building', color: '#6366F1' },
    },
    entity: {
      title: zh ? '认证机构身份' : 'Verify Org Role',
      subtitle: zh ? '认证你在机构中的身份，通过后可管理机会' : 'Verify your institutional role to manage deals',
      companyName: zh ? '公司/项目名称' : 'Company Name',
      creditCode: zh ? '统一社会信用代码' : 'Credit Code',
      yourRole: zh ? '你的角色' : 'Your Role',
      submit: zh ? '提交认证' : 'Submit',
      backToDash: zh ? '返回操作台' : 'Back to Dashboard',
      roles: { legal: zh ? '法人代表' : 'Legal Rep', finance: zh ? '财务' : 'Finance', admin: zh ? '管理员' : 'Admin', other: zh ? '其他' : 'Other' }
    },
    stages: {
      originate: zh ? '发起' : 'Originate',
      assess: zh ? '评估' : 'Assess',
      risk: zh ? '风控' : 'Risk',
      deal: zh ? '参与' : 'Deal',
      terms: zh ? '条款' : 'Terms',
      contract: zh ? '合约' : 'Contract',
      settlement: zh ? '结算' : 'Settle',
      performance: zh ? '履约' : 'Perform',
    },
    dealStatus: {
      draft: zh ? '草稿' : 'Draft', pending: zh ? '审核中' : 'Pending',
      live: zh ? '招募中' : 'Live', closed: zh ? '已关闭' : 'Closed', matched: zh ? '已匹配' : 'Matched',
    },
    settings: {
      title: zh ? '账户设置' : 'Account Settings',
      profile: zh ? '个人信息' : 'Profile',
      security: zh ? '安全设置' : 'Security',
      notifications: zh ? '通知偏好' : 'Notifications',
      securityLog: zh ? '安全日志' : 'Security Log',
      changePwd: zh ? '修改密码' : 'Change Password',
      twoFactor: zh ? '两步验证' : '2FA',
      loginAlert: zh ? '登录提醒' : 'Login Alert',
      dealNotif: zh ? '项目动态' : 'Deal Updates',
      systemNotif: zh ? '系统通知' : 'System',
      emailNotif: zh ? '邮件通知' : 'Email',
    },
    footer: {
      copyright: zh ? '© 2026 Micro Connect Group. 保留所有权利。' : '© 2026 Micro Connect Group. All rights reserved.',
      privacy: zh ? '隐私政策' : 'Privacy',
      terms: zh ? '服务条款' : 'Terms',
      backToMain: zh ? '返回主站' : 'Main Site',
      desc: zh ? '统一入口 · 主操作台 · 路由中枢' : 'Unified entry · Command center · Routing hub',
    },
  }
}

// ─── SVG Logos ───
export const LOGO = `<svg width="32" height="32" viewBox="0 0 80 80"><defs><linearGradient id="gt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gt)"/><circle cx="36" cy="44" r="22" fill="url(#gb)" opacity="0.85"/></svg>`

export const LOGO_LG = `<svg width="56" height="56" viewBox="0 0 80 80"><defs><linearGradient id="gtl" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient><linearGradient id="gbl" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs><circle cx="44" cy="28" r="22" fill="url(#gtl)"/><circle cx="36" cy="44" r="22" fill="url(#gbl)" opacity="0.85"/></svg>`

// ─── Shared Components ───
export function navBrand(href: string, mode: 'dark' | 'light', zh: boolean) {
  const titleColor = mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'var(--text-primary)'
  const subColor = mode === 'dark' ? 'rgba(255,255,255,0.40)' : 'var(--text-quaternary)'
  return `<a href="${href}" style="display:flex;align-items:center;gap:12px;text-decoration:none;">
    ${LOGO}
    <div style="display:flex;flex-direction:column;gap:1px;line-height:1.15;">
      <span style="font-weight:800;font-size:17px;color:${titleColor};letter-spacing:0.02em;font-family:'Noto Sans SC','PingFang SC',sans-serif;">${zh ? '身份通' : 'Identity'}</span>
      <span class="font-brand" style="font-weight:600;font-size:10px;color:${subColor};letter-spacing:2.5px;text-transform:uppercase;">IDENTITY CONNECT</span>
    </div>
  </a>`
}

export function shell(title: string, body: string, lang: string): string {
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

// Connect card SVG icon
export function connectSVG(cn: { id: string; char: string; color: string }, size: number = 48) {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="gt-${cn.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#3DD8CA"/></linearGradient>
    <linearGradient id="gb-${cn.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#28A696"/><stop offset="100%" stop-color="#2EC4B6"/></linearGradient></defs>
    <rect width="100" height="100" rx="18" fill="#FFF" stroke="#E5E7EB" stroke-width="1.5"/>
    <circle cx="72" cy="26" r="11" fill="url(#gb-${cn.id})" opacity="0.85"/>
    <circle cx="78" cy="20" r="11" fill="url(#gt-${cn.id})"/>
    <text x="42" y="62" text-anchor="middle" dominant-baseline="middle" font-family="'Noto Sans SC','PingFang SC',sans-serif" font-size="34" font-weight="700" fill="#1d1d1f">${cn.char}</text>
    <circle cx="24" cy="82" r="4" fill="${cn.color}" opacity="0.35"/>
  </svg>`
}

// Footer component
export function footerHTML(t: ReturnType<typeof T>) {
  return `<footer class="footer-aurora" style="padding:48px 24px 32px;margin-top:64px;">
    <div style="max-width:1100px;margin:0 auto;position:relative;z-index:1;">
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
  </footer>`
}
