# 身份通 Identity Connect

## 项目概述
- **产品ID**: identity
- **flowOrder**: 1
- **角色**: shared (共用)
- **阶段**: entry (统一入口)
- **状态**: live 已上线
- **专属色**: #3B82F6 (深) / #DBEAFE (浅)

身份通是 Micro Connect 滴灌通平台"9个通"中的第1个产品——整个平台的**统一入口和路由中枢**。用户注册后解锁不同的角色（发起/参与/机构），然后通过对应的"通"来**发起投资机会**或**参与投资机会**。

> 核心逻辑: 角色是门票，机会是核心。融资者发起机会（Deal），投资者参与机会。身份通负责角色管理和路由分发。

## URLs
- **Sandbox**: https://3000-izbb756u5yvivi2bn44xr-cbeee0f9.sandbox.novita.ai

## 已完成功能
1. **登录/注册系统** — 手机号+验证码 / 邮箱+密码双模式
2. **角色解锁** — 发起角色(Originator)、参与角色(Participant)、机构角色(Institution)
3. **主体认证** — 公司/项目关联认证，Demo阶段自动通过
4. **个人工作台** — 统计概览、角色卡片、机会列表、主体列表
5. **机会管理** — 我发起的机会 / 我参与的机会，带状态和详情
6. **9通快捷导航** — 按角色权限控制访问，显示产品状态(live/beta/coming)
7. **完整i18n** — 中英文双语切换
8. **完整API** — 7个核心接口 + 2个机会查询接口
9. **Apple风格设计系统** — Product Bible V3.0 Design Token

## 功能入口 URI

### 页面路由
| 路径 | 说明 |
|------|------|
| `GET /` | 登录/注册页（暗色沉浸式Hero） |
| `GET /dashboard` | 个人工作台（需登录） |
| `GET /entity-verify` | 主体认证（需登录） |
| `?lang=en` | 任意页面切换英文 |

### API 接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/verify-code` | 发送验证码 |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/user/profile` | 获取用户信息 |
| POST | `/api/user/unlock` | 解锁角色 |
| POST | `/api/entity/verify` | 提交主体认证 |
| GET | `/api/entity/list` | 获取已认证主体列表 |
| GET | `/api/deals/initiated` | 获取我发起的机会 |
| GET | `/api/deals/participated` | 获取我参与的机会 |

## 业务逻辑

### Y 型业务流程
```
                    ┌─ 发起角色 → 发起通(上传数据，创建机会)
身份通(统一入口) ──┤                      ↓ 数据穿越管道
                    └─ 参与角色 → 评估通 → 风控通 → 参与通(筛选机会，参与决策)
                                                          ↓
                         Y型汇合点：条款通 → 合约通 → 结算通 → 履约通
```

### 核心概念
- **角色(Role)** = 门票，决定你能进入哪些"通"
  - 发起角色(Originator)：可进入发起通，上传数据，创建投资机会
  - 参与角色(Participant)：可进入评估通/参与通，浏览和筛选机会
  - 机构角色(Institution)：可进入所有通，批量管理
- **机会(Deal)** = 核心业务对象，融资者发起、投资者参与
- **主体(Entity)** = 公司/项目，发起机会需要先认证主体

## 数据模型

### Deal (投资机会)
```typescript
interface Deal {
  id: string; title: string; entityName: string; industry: string
  amount: string; period: string
  status: 'draft' | 'pending' | 'live' | 'closed' | 'matched'
  createdAt: string; initiatorId: string; participantIds: string[]
}
```

### User
```typescript
interface User {
  id: string; phone?: string; email?: string; name: string
  identities: Identity[]; entities: EntityAuth[]; createdAt: string
}
```

## Demo 账号
- **张三**（融资者）: 手机 `13800001234`，验证码 `123456` — 发起+参与角色，3条发起机会
- **李四**（投资者）: 邮箱 `investor@fund.com`，密码 `demo123` — 参与+机构角色，3条参与机会

## 技术栈
- **框架**: Hono + TypeScript
- **部署**: Cloudflare Pages
- **样式**: 自定义Design Token CSS (Apple风格)
- **交互**: 纯原生JS（inline script）
- **数据**: 内存Mock + localStorage (Demo)
- **认证**: JWT (demo secret)

## 部署
- **平台**: Cloudflare Pages
- **状态**: ✅ Active
- **最后更新**: 2026-02-27
