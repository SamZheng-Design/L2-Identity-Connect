# 身份通 Identity Connect — V12.1 Premium Command Center

## Project Overview
- **Name**: Identity Connect 身份通
- **Goal**: 滴灌通9通产品的统一登录入口 + 主操作台 + 路由中枢
- **Version**: V12.1 — Premium Command Center Edition
- **Architecture**: Modular (core.ts + login.ts + dashboard.ts + pages.ts)

## URLs
- **Production**: https://l2-identity-connect.pages.dev
- **GitHub**: https://github.com/SamZheng-Design/L2-Identity-Connect (branch: v12)

## V12.1 Upgrade Summary

### Login Page (/)
- 9通环形轨道动画 — 9个产品节点围绕身份通Logo旋转
- 信任徽章 — SSO / E2E加密 / RBAC / 合规审计
- 融资方/投资方 双Demo标识
- 品牌视觉全面升级

### Command Center (/dashboard)
- **可交互Pipeline** — 点击任意阶段节点，通过SSO跳转到对应通
- **Deal详情弹窗** — 点击项目卡片，弹窗展示详情+进度+下一步
- **Activity Timeline** — 从全部Deal Pipeline提取最近动态
- **Pipeline过滤器** — 全部/进行中/已完成 Tab筛选
- **进度条** — 每个Deal底部渐变进度条
- **Connect计数** — 九通卡片显示涉及Deal数量
- **总金额统计** — Stats区域新增总金额指标
- **Navbar升级** — 通知铃铛(红点)+设置入口

### Account Settings (/settings)
- 个人信息管理
- 安全设置（密码修改/2FA开关/登录提醒）
- 通知偏好（项目动态/系统通知/邮件通知）
- 安全日志（登录记录/操作记录）

### Notification Center (/notifications)
- 5种通知类型（deal/system/role/entity/security）
- 未读/全部 筛选
- 一键全部已读

### Entity Verify (/entity-verify)
- 统一设计语言
- 返回操作台导航

### Cross-Connect SSO
- 每个通配置 externalUrl
- 点击跳转前先获取SSO Token
- 带参跳转 `?sso=<token>`

## Demo Accounts
| 角色 | 账号 | 凭证 |
|------|------|------|
| 融资方 | 13800001234 | 验证码 123456 |
| 投资方 | investor@fund.com | 密码 demo123 |

## Tech Stack
- Hono + TypeScript on Cloudflare Pages
- Vite build, Wrangler dev/deploy
- CDN: Tailwind-free (custom CSS), FontAwesome, Google Fonts
- Design System: Product Bible V3.0 compliant

## File Structure
```
src/
├── index.tsx     — Entry point, API routes, page routing
├── core.ts       — JWT, data models, demo data, i18n, shared components
├── login.ts      — Login page with orbit ring animation
├── dashboard.ts  — Command Center with pipeline, timeline, modal
└── pages.ts      — Settings, Notifications, Entity Verify
public/static/
├── style.css     — V12.1 Premium Design System
└── favicon.svg   — Brand icon
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/verify-code | Send verification code |
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/sso-token | Generate SSO token for cross-connect |
| GET | /api/user/profile | Get user profile |
| POST | /api/user/unlock | Unlock identity role |
| POST | /api/entity/verify | Verify entity/org role |
| GET | /api/deals/all | Get all related deals with pipeline |

## Deployment
- **Platform**: Cloudflare Pages
- **Project**: l2-identity-connect
- **Status**: Active
- **Last Updated**: 2026-03-02
