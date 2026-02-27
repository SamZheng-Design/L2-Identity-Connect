# 身份通 Identity Connect

## 项目概述
- **产品ID**: identity
- **flowOrder**: 1
- **角色**: shared (共用)
- **阶段**: entry (统一入口)
- **状态**: live 已上线
- **专属色**: #3B82F6 (深) / #DBEAFE (浅)

身份通是 Micro Connect 滴灌通平台"9个通"中的第1个产品——整个平台的**统一入口和路由中枢**。它是一个以人为单位的万能工作台，用户注册后可以解锁不同的功能身份（发起身份/参与身份/机构身份），然后被路由到对应的"通"。

> 📚 图书馆比喻: 身份通 = 办借书证。走进图书馆，先办证，选择你是作者（融资者）、读者（投资者）还是机构会员。一张证多个身份，随时解锁。

## URLs
- **Sandbox**: https://3000-izbb756u5yvivi2bn44xr-cbeee0f9.sandbox.novita.ai
- **Logo**: https://www.genspark.ai/api/files/s/2UNypAIm

## 已完成功能
1. **登录/注册系统** — 手机号+验证码 / 邮箱+密码双模式
2. **功能身份解锁** — 发起身份(initiator)、参与身份(participant)、机构身份(organization)
3. **主体认证** — 公司/项目关联认证，Demo阶段自动通过
4. **个人工作台** — 统计概览、身份卡片、机会列表、主体列表
5. **Y型业务流程图** — 可视化展示完整的9通流转架构
6. **9通快捷导航** — 按身份权限控制访问，显示产品状态(live/beta/coming)
7. **完整i18n** — 中英文双语切换（TEXT对象集中管理）
8. **完整API** — 7个核心接口 + 2个机会查询接口
9. **Apple风格设计系统** — 100% 遵循 Product Bible V3.0 Design Token

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
| POST | `/api/user/unlock` | 解锁功能身份 |
| POST | `/api/entity/verify` | 提交主体认证 |
| GET | `/api/entity/list` | 获取已认证主体列表 |
| GET | `/api/deals/initiated` | 获取发起的机会 |
| GET | `/api/deals/participated` | 获取参与的机会 |

## Y 型业务流程

```
                    ┌─── 融资者路径 ──→ 发起通(上传数据)
身份通(统一入口) ──┤                         ↓ 数据穿越管道
                    └─── 投资者路径 ──→ 评估通 → 风控通 → 参与通(看板)
                                                               ↓
                         Y型汇合点：条款通 → 合约通 → 结算通 → 履约通
```

## 数据模型

### User
```typescript
interface User {
  id: string; phone?: string; email?: string; name: string
  identities: Identity[]; entities: EntityAuth[]; createdAt: string
}
```

### Identity
```typescript
type IdentityRole = 'initiator' | 'participant' | 'organization'
interface Identity { role: IdentityRole; unlockedAt: string; status: 'active' | 'pending' | 'suspended' }
```

### EntityAuth
```typescript
interface EntityAuth { entityId: string; entityName: string; role: string; verifiedAt: string }
```

## Design Token 对齐清单 (Product Bible V3.0)
- [x] 主品牌色 `#5DC4B3`
- [x] 身份通色 `#3B82F6` / `#DBEAFE`
- [x] 文字 primary `#1d1d1f`（禁止纯黑）
- [x] 文字 secondary `#6e6e73`
- [x] 页面背景 `#f5f5f7`
- [x] 卡片 `rgba(255,255,255,0.88)`
- [x] Navbar 56px 毛玻璃 `blur(24px) saturate(180%)`
- [x] Footer Aurora `radial-gradient(ellipse 130% 90% at 50% 20%, ...)`
- [x] Card 20px圆角 多层阴影
- [x] Logo SVG 双圆叠合标识
- [x] 字体栈 Inter + Montserrat + Noto Sans SC
- [x] 滚动渐现 IntersectionObserver + .reveal

## 技术栈
- **框架**: Hono + TypeScript
- **部署**: Cloudflare Pages
- **样式**: Tailwind CSS (CDN) + 自定义Design Token CSS
- **交互**: 纯原生JS（inline script）
- **数据**: 内存Mock + localStorage (Demo)
- **认证**: JWT (demo secret)

## Demo 账号
- 手机: `13800001234`，验证码: `123456` → 张三（发起+参与身份）
- 邮箱: `investor@fund.com`，密码: `demo123` → 李四（参与+机构身份）

## 部署
- **平台**: Cloudflare Pages
- **状态**: ✅ Active
- **最后更新**: 2026-02-27
