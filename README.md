# 身份通 Identity Connect — V12 主操作台版

## 项目概述
- **名称**: 身份通 (Identity Connect)
- **定位**: 滴灌通9通产品的统一登录入口 + 主操作台 + 路由中枢
- **版本**: V12 Command Center Edition
- **合规**: MicroConnect Product Bible V3.0

## URLs
- **Production**: https://l2-identity-connect.pages.dev
- **GitHub**: https://github.com/SamZheng-Design/L2-Identity-Connect (branch: v12)

## V12 核心升级

### 1. 统一登录门户 (/)
- 所有9个通产品的唯一登录入口
- 登录页展示9通产品环，明确传达"一次登录，全通通行"
- 手机号/邮箱双模式登录
- JWT Token 认证，支持跨通 SSO

### 2. 主操作台 (/dashboard) — Command Center
- **全局概览**: 项目总数、招募中、活跃通道、解锁角色 4大指标
- **快捷操作**: 根据已解锁角色动态生成操作入口
- **项目管线**: 跨通 Pipeline 可视化，8阶段全生命周期追踪
  - 发起 → 评估 → 风控 → 参与 → 条款 → 合约 → 结算 → 履约
  - 每个阶段显示 completed / active / pending / blocked 状态
- **身份角色**: 发起角色、参与角色、机构身份的一键解锁
- **认证主体**: 已认证企业及相关deal展示
- **九通产品矩阵**: 按角色分类的9通导航网格
  - 共用 (身份通)
  - 融资方 (发起通)
  - 投资方 (评估通、风控通、参与通)
  - 协同 (条款通、合约通、结算通、履约通)

### 3. 主体认证 (/entity-verify)
- 公司/项目主体认证表单
- 自动关联机构身份

## 九通产品矩阵

| 通 | 英文名 | ID | 角色 | 状态 |
|---|---|---|---|---|
| 身份通 | Identity Connect | identity | 共用 | Live |
| 发起通 | Originate Connect | application | 融资方 | Beta |
| 评估通 | Assess Connect | assess | 投资方 | Beta |
| 风控通 | Risk Connect | risk | 投资方 | Live |
| 参与通 | Deal Connect | opportunity | 投资方 | Live |
| 条款通 | Terms Connect | terms | 协同 | Coming |
| 合约通 | Contract Connect | contract | 协同 | Beta |
| 结算通 | Settlement Connect | settlement | 协同 | Coming |
| 履约通 | Performance Connect | performance | 协同 | Coming |

## API 端点

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/verify-code | 发送手机验证码 |
| POST | /api/auth/register | 注册新用户 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/sso-token | 生成跨通SSO令牌 |
| GET | /api/user/profile | 获取用户信息 |
| POST | /api/user/unlock | 解锁角色身份 |
| POST | /api/entity/verify | 认证机构主体 |
| GET | /api/deals/all | 获取全部相关deal(含Pipeline) |
| GET | /api/deals/initiated | 获取发起的deal |
| GET | /api/deals/participated | 获取参与的deal |

## Demo 账号
- **融资者(张三)**: 手机 `13800001234` / 验证码 `123456`
- **投资者(李四)**: 邮箱 `investor@fund.com` / 密码 `demo123`

## 技术架构
- **Framework**: Hono + TypeScript + SSR
- **Deployment**: Cloudflare Pages
- **Design System**: Apple-inspired, Brand #5DC4B3, 严禁纯黑
- **Authentication**: JWT (24h有效期), SSO跨通支持
- **Data Flow**: 事件驱动 Event Bus (demo阶段 in-memory)

## 部署
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active
- **Last Updated**: 2026-03-01
