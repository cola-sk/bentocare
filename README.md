# 伴学小账 (BentoCare)

<div align="center">

🍱 **伴学小账 (BentoCare)** —— 陪伴孩子上学成长，清晰记录每一笔托管、午餐考勤与缺勤退费。

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Vercel%20Postgres-4169e1)](https://vercel.com/docs/storage/vercel-postgres)

</div>

---

## 📖 产品简介

“伴学小账 (BentoCare)” 是一款面向家庭移动端 H5 优先的考勤打卡与**“按天计费 / 按月预付 + 缺勤退费”**自动核算对账工具。

针对孩子在校午餐、校外小饭桌、晚托班、校车接送等日常托管场景，帮助家长轻松记录考勤，并在月末自动根据请假缺勤记录精确核算应退费用与实付差额，一键生成对账长图。

详细产品与技术方案请参阅：👉 **[docs/technical-solution.md](docs/technical-solution.md)**

---

## 🌟 核心功能模块

### 1. 考勤打卡与日历看板 (`/`)
- 📱 **移动端月历视图**：出勤（绿色）、请假退费（红色）、休息（灰色）清晰呈现。
- 📝 **单日考勤抽屉**：各服务项目独立打卡，可录入缺勤原因备注（如“发烧请假”、“学校秋游”）。
- ⚡ **一键快捷批量**：支持“今日打卡”、“今日一键全勤”、“今日全部请假”。

### 2. 智能费用核算与对账中心 (`/bills`)
- 🧮 **双计费模式核算**：
  - **按月预付 + 缺勤退费 (`PER_MONTH`)**：支持固定单日退费额（如 60 元/天）与按当月法定工作日均摊两种模式。
  - **按天计费 (`PER_DAY`)**：出勤天数实时累加计费。
- 📊 **结算大看板**：汇总预付总额、缺勤应退总额、按天消费总额、实际应付净额与结算差额结余。
- 📸 **微信长图分享**：一键将当月账单生成为高清对账小卡片长图，方便直接发微信家长群或托管老师。
- 📄 **CSV 数据导出**：导出明细对账单，支持 Excel 打开。
- 📈 **年度汇总报表**：全年支出与退费趋势概览。

### 3. 多孩与服务项目配置中心 (`/settings`)
- 👶 **多孩档案管理**：支持多个孩子档案独立维护与一键切换。
- ⚙️ **托管项目自定义**：自由新增/编辑午餐、小饭桌、接送等服务项目及其单价与退费规则。
- 💾 **数据备份与云端存储**：提供完整的 JSON 导入与导出，全面接入 Vercel Postgres 云数据库。

---

## 📐 计费模型与核算公式

| 计费类型 | 业务场景 | 核算公式 |
| :--- | :--- | :--- |
| **按天后付 (`PER_DAY`)** | 次卡校车、临时晚托 | $\text{费用} = \text{出勤天数} \times \text{单日单价}$ |
| **包月预付 + 缺勤退费 (`PER_MONTH`)** | 学校午餐、校外小饭桌 | $\text{实耗} = \text{预付包月} - (\text{缺席天数} \times \text{单日退费标准})$ |

**月度总结算：**
$$\text{总实付净额} = \sum \text{按月项目实耗} + \sum \text{按天项目实耗}$$
$$\text{核销后结余} = \text{总预付额} - \text{总实付净额} = \text{缺勤应退总额} - \text{按天总消费}$$

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 克隆或进入项目目录
cd ~/coding/bentocare

# 2. 安装依赖
pnpm install

# 3. 生成 Prisma Client
pnpm prisma:generate

# 4. 启动开发服务器
pnpm dev
```

在手机浏览器或电脑打开：`http://localhost:3000`

### 生产环境构建

```bash
pnpm build
pnpm start
```

---

## ☁️ 部署至 Vercel

1. 将代码推送至 GitHub 仓库。
2. 登录 [Vercel](https://vercel.com/) 并导入该仓库。
3. 在项目控制台中点击 **Storage** -> **Create Database** -> **Postgres** 创建并连接数据库。
4. Vercel 将自动注入数据库环境变量，部署即刻生效。

---

## 📂 项目目录结构

```
~/coding/bentocare/
├── docs/                      # 架构与技术设计方案文档
│   └── technical-solution.md
├── prisma/                    # 数据库 Schema 与迁移
│   └── schema.prisma
├── src/
│   ├── app/                   # Next.js App Router 页面与 API
│   │   ├── api/               # Serverless CRUD 接口
│   │   ├── bills/page.tsx     # 对账单与长图分享
│   │   ├── settings/page.tsx  # 配置中心与数据备份
│   │   ├── layout.tsx         # 移动端容器与布局
│   │   └── page.tsx           # 首页打卡与月历看板
│   ├── components/            # UI 组件 (日历、账单、长图、设置)
│   ├── hooks/                 # useLedgerStore 统一状态与持久化
│   └── lib/                   # 计费引擎、节假日、工具函数
├── public/                    # 静态资源与 PWA manifest
└── README.md
```

---

## 📄 License

MIT License © 2026 BentoCare Team
