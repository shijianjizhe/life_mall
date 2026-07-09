# Life Mall 实施计划

> 依据 PRD / 前端架构 / 页面说明 / IndexedDB 设计文档 · v2.0 纯前端版

---

## 总原则

1. **无后端**：React SPA + IndexedDB（Dexie）+ 可选用户自备 LLM Key  
2. **红线**：无真实支付；多处声明虚拟购物；备份/恢复为 MVP 必做  
3. **交付节奏**：先可跑通「逛→加购→假下单」，再补情绪与沉淀玩法  

---

## Phase 0 — 工程与基础设施（先做）

| 任务 | 说明 |
|------|------|
| Vite + React + TS | 项目脚手架 |
| Tailwind CSS | 设计 token（品牌色、四分区色） |
| React Router | 20 条路由（含懒加载） |
| Dexie.js | `LifeMallDB` 12 个 store + schema v1 |
| Zustand | cart / user / settings 等全局状态 |
| 种子数据 | 4 分类 × 15–20 商品（约 60–80 SKU）+ 文案池 |
| 设计系统组件 | Button、Card、BottomNav、AppShell、Toast、Empty |

**完成标准**：`npm run dev` 可启动；DB 初始化；空壳页面可跳转。

---

## Phase 1 — 核心购物链路（MVP 主路径）

按用户旅程实现：

1. `/onboarding` 三屏引导 + `onboardingCompleted`  
2. `/` 首页：声明条、搜索入口、四分区、今日推荐、专题 banner、底栏  
3. `/category/:categoryCode` 分区列表 + 排序 + 本地分页  
4. `/search` 本地模糊搜索 + 历史  
5. `/product/:productId` 详情、收藏、加购、进 AI  
6. `/cart` 数量/删除/全选/总价 + AI 吐槽气泡  
7. `/checkout` 假地址/支付方式 + 1.5–2.5s 动画  
8. `/order/success/:orderId` 随机送达文案 + 首单备份引导  

**完成标准**：刷新后购物车/订单仍在；假下单清空购物车并写 `orders`。

---

## Phase 2 — 沉淀与账户

9. `/orders` 历史订单  
10. `/favorites` 收藏夹  
11. `/wishlist` 梦想清单（商品关联 + 自定义）  
12. `/profile` 个人中心数据总览 + 入口  
13. `/backup` 导出/导入 JSON（二次确认）  
14. `/settings` 昵称头像、AI Key、免责声明、清数据  

**完成标准**：备份导出可恢复；设置可清数据；个人中心统计正确。

---

## Phase 3 — 情绪与活跃

15. `/ai-chat/:productId?` 本地文案库 + 可选 LLM  
16. `/ai-report` 基于本地行为的人格报告  
17. `/checkin` 连续签到 + 快乐币 + 日期回退友好提示  
18. 备份提醒：首单 / 满 5 单 / 使用满 3 天  

---

## Phase 4 — 玩法与传播

19. `/room` 已购商品拖拽布置（存 `roomItems`）  
20. `/share/poster` html2canvas 海报  
21. `/event/million` 100 万预算挑战  
22. PWA（vite-plugin-pwa）+ 动效 polish  

---

## 技术约定（实现时遵守）

- 写操作：先 Zustand 再异步 Dexie，保证 UI 即时反馈  
- 商品图：public/远程 URL，不进 IndexedDB Base64  
- AI：未配置 Key 时必须有本地吐槽，功能不降级为空白  
- 图片占位：可用 SVG/emoji 占位，避免依赖不可用 CDN  

---

## 本轮开工顺序

1. 脚手架 + 依赖 + Tailwind + 路由壳  
2. Dexie + 种子数据 + 核心 store  
3. Layout / 设计 token / 公共组件  
4. 核心购物 8 页打通  
5. 沉淀页 + 备份设置  
6. AI / 签到 / 房间 / 海报 / 专题  
7. 构建验证  

---

## 目录结构（目标）

```
src/
  app/           # 入口、路由、Providers
  components/    # 通用 UI
  db/            # Dexie、seed、backup
  stores/        # Zustand
  pages/         # 20 个页面
  lib/           # 工具、AI 文案匹配、常量
  styles/        # 全局样式
  data/          # 种子 JSON / 文案池
public/
```
