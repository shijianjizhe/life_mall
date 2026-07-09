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

## 核查后剩余功能实施计划（2026-07-09）

> 当前核查结论：20 个主页面、IndexedDB schema、核心购物链路、备份恢复、AI 本地/进阶模式、签到、房间、海报、100 万专题均已有基础实现。下面只列还需要补齐或继续打磨的内容，不包含后端、账号、跨设备同步、真实支付、真实多人互动。

### 完成状态（2026-07-09）

- P0 商品图片体系：已完成。68 个商品均有 `mainImageUrl` 和 2 张详情图，JPG 资源位于 `public/products/`，并通过 `ProductVisual` 在列表、详情、购物车、订单、房间、海报和专题中复用。
- P0 加购飞入动效与震动：已完成。商品卡和详情页加购会触发缩略图飞入购物车、购物车角标定位和 `safeVibrate` 轻触感反馈。
- P1 虚拟房间交互：已完成。保留拖拽、滚轮/按钮缩放，新增双指缩放、中心/物品对齐磁吸辅助线和触感反馈。
- P1 AI 报告四屏：已完成。报告页拆成封面、标题揭晓、数据支撑、人格点评四屏。
- P1 分享降级：已完成。海报页和房间页统一走 `shareCanvasImage`，系统分享不可用时下载图片并提示复制/长按保存路径；专题海报统一下载工具。
- P2 签到数字动画：已完成。快乐币使用 `AnimatedNumber` 滚动更新，并有签到触感反馈。
- P2 假支付仪式感：已完成。支付 loading 拆成阶段文案和进度条，结束前有轻触感反馈，并防重复触发。
- P2 分类页主题差异：已完成。四个分类增加独立页面背景、商品卡、价格色和描边风格。
- P2 海报模板：已完成。海报使用商品图拼贴，空状态也能生成可分享海报。
- P3 备份导入校验：已完成。补充日期、枚举、数量、金额和核心 setting 校验。
- P3 PWA 构建验证：已完成。`npm run build` 通过并生成 `dist/sw.js`、`dist/manifest.webmanifest` 等 PWA 产物。
- P3 文档收口：已完成。README 已替换默认 Vite 模板说明。

以下原计划保留为实现记录和后续回溯依据。

### P0 — 视觉资产与商品图片体系

**目标**：把当前 emoji/占位视觉升级为更像商品图的统一扁平插画资产，并让详情轮播、商品卡片、海报拼贴都能消费同一套图片字段。

**实施步骤**：
1. 定义商品图片资产策略：优先使用 `public/products/` 本地静态图片，避免把图片 Base64 写入 IndexedDB。
2. 为 68 个种子商品补齐 `mainImageUrl`，重点商品补 2-3 张 `galleryImages`。
3. 升级 `ProductEmojiArt` 为通用 `ProductVisual`：有图片时展示图片，图片缺失时保留 emoji fallback。
4. 替换首页推荐、分类商品卡、购物车、订单、收藏、房间、海报、100 万专题中的商品视觉组件。
5. 检查图片尺寸、裁切、懒加载和 `alt` 文案，避免移动端卡片抖动。

**验收标准**：
- 商品列表和详情页不再主要依赖 emoji 展示。
- 详情页轮播能展示真实 `mainImageUrl + galleryImages`。
- 海报生成里能看到商品图拼贴，图片缺失时仍不白屏。

**预计涉及**：`src/data/products.ts`、`src/components/product/ProductCard.tsx`、各商品展示页面、`public/products/`。

### P0 — 加购飞入购物车动效与移动端震动

**目标**：补齐页面说明文档里的“商品缩略图飞入购物车图标 + 购物车角标回弹 + 轻微震动反馈”。

**实施步骤**：
1. 在全局 store 或轻量事件总线中增加 `cartFlyTarget` / `cartFlyRequest` 状态，记录起点图片位置和商品视觉。
2. 在 `ProductCard`、商品详情底部栏、100 万外的常规加购入口触发飞行动画。
3. 在 `AppShell` 或全局 overlay 中渲染飞行动画节点，用 Framer Motion 做抛物线/缩放/淡出。
4. 购物车角标收到加购事件时播放一次回弹动画。
5. 封装 `safeVibrate(pattern)`：仅在支持 `navigator.vibrate` 且用户非桌面环境时调用，失败静默降级。

**验收标准**：
- 列表页和详情页点击加购时能看到缩略图飞向购物车入口。
- 不支持震动的浏览器无报错。
- 连续快速加购不会造成残留动画节点或卡顿。

**预计涉及**：`src/stores/useAppStore.ts`、`src/components/layout/AppShell.tsx`、`src/components/layout/BottomNav.tsx`、`src/components/product/ProductCard.tsx`、`src/pages/ProductDetailPage.tsx`。

### P1 — 虚拟房间双指缩放、磁吸辅助线与触感反馈

**目标**：让房间布置在移动端可用性接近文档要求，提升摆放的“玩具感”。

**实施步骤**：
1. 为画布 item 增加多指触控识别：两指开始时记录初始距离和初始 scale，移动时更新 scale。
2. 保留桌面 `wheel` 缩放和按钮缩放，统一走同一个 `updateItemScale` 限制范围。
3. 拖拽过程中计算与画布中心线、其他物品边缘/中心的距离，小于阈值时吸附。
4. 渲染横/竖辅助线，拖拽结束后隐藏。
5. 摆放成功、吸附命中、删除时调用轻微震动反馈。

**验收标准**：
- 移动端两指缩放物品可用，单指拖拽不误触缩放。
- 靠近中心线或其他物品时出现辅助线并轻微吸附。
- 房间布局保存后刷新仍能恢复位置、缩放和层级。

**预计涉及**：`src/pages/RoomPage.tsx`、可新增 `src/lib/haptics.ts`。

### P1 — AI 人格报告四屏仪式感

**目标**：把当前“标题 + 数据 + 解读”的报告升级为文档里的四屏纵向结果页。

**实施步骤**：
1. 拆分报告结构为封面、人格标题揭晓、数据支撑、幽默点评四个 `section`。
2. 第 1 屏加入短暂加载/分析态，可在已有报告时快速完成，不阻塞太久。
3. 第 2 屏增加人格角色视觉，可先使用本地插画/商品图组合，后续再换正式素材。
4. 第 3 屏强化数据卡：偏爱分区、虚拟消费、下单次数、收藏数、购物车常驻。
5. 第 4 屏展示解读文本和“生成分享图 / 重新测一次”。
6. 海报入口带上最新报告 ID 或继续读取最新报告，保证分享内容一致。

**验收标准**：
- 页面能自然纵向滑动 4 屏，每屏主题明确。
- 重新测一次会生成新报告并刷新当前四屏内容。
- 空数据用户也能得到友好的默认报告，不出现空白。

**预计涉及**：`src/pages/AiReportPage.tsx`、`src/lib/aiRoast.ts`、`src/pages/PosterPage.tsx`。

### P1 — 分享降级体验

**目标**：当浏览器不支持系统分享或文件分享时，给用户明确的可操作降级路径。

**实施步骤**：
1. 抽出统一 `shareCanvasImage` 工具，供海报页、房间页、100 万专题复用。
2. 支持优先系统分享，其次下载图片，最后展示“长按图片保存 / 已生成下载文件”的提示。
3. 可选支持把分享文案复制到剪贴板，剪贴板失败时只 toast 提示。
4. 分享失败要区分用户取消和能力不支持，避免误报“失败”。

**验收标准**：
- Safari/桌面浏览器不支持文件分享时，用户能明确知道图片已保存或应该长按保存。
- 海报页、房间页、专题页分享行为一致。

**预计涉及**：`src/pages/PosterPage.tsx`、`src/pages/RoomPage.tsx`、`src/pages/MillionEventPage.tsx`、可新增 `src/lib/share.ts`。

### P2 — 签到快乐币数字滚动动画

**目标**：补齐签到成功时快乐币数字从旧值滚到新值的正反馈。

**实施步骤**：
1. 签到前记录旧 `happyCoin`，签到成功后拿到新值。
2. 新增 `AnimatedNumber` 小组件，用 `requestAnimationFrame` 或 Framer Motion 过渡数字。
3. 只在签到成功后的短时间内播放，页面初次加载直接显示静态数字。

**验收标准**：
- 签到成功后快乐币数字有明显增长动画。
- 刷新页面或已签到状态不会重复播放。

**预计涉及**：`src/pages/CheckinPage.tsx`、可新增 `src/components/ui/AnimatedNumber.tsx`。

### P2 — 假支付仪式感增强

**目标**：在已满足 1.5-2.5 秒 loading 的基础上，让支付过程更像“假的但认真”的结算仪式。

**实施步骤**：
1. 把单一 loading 状态拆成 3-4 个阶段：校验快乐、联系平行宇宙仓库、假装扣款、生成永不送达面单。
2. 进度条从 0 平滑到 100%，文案随阶段切换。
3. 加入轻量成功闪光/震动，再跳转订单成功页。
4. 确保重复点击确认支付不会创建重复订单。

**验收标准**：
- 支付动画持续 1.5-2.5 秒且进度可感知。
- 动画结束只生成一笔订单。
- 空购物车或选中项为空仍能正确阻止结算。

**预计涉及**：`src/pages/CheckoutPage.tsx`、`src/stores/useAppStore.ts`。

### P2 — 分类页主题差异细化

**目标**：让四个分区更贴近页面文档的视觉差异，而不只是顶部渐变不同。

**实施步骤**：
1. 给分类 meta 增加 `cardStyle` / `accentClass` / `textureClass`。
2. 现实买不起：商品卡细金线、深色/金色价格强调。
3. 小时候梦想：更软的卡片、马卡龙背景。
4. 不可能拥有：星空感背景、银紫色点缀。
5. 抽象商品：黑底荧光描边，但确保文字对比度和可读性。

**验收标准**：
- 四个分类列表不看标题也能感知主题差异。
- 移动端商品卡文字不溢出，按钮可点区域充足。

**预计涉及**：`src/lib/constants.ts`、`src/pages/CategoryPage.tsx`、`src/components/product/ProductCard.tsx`、`src/index.css`。

### P2 — 海报模板空状态与视觉差异增强

**目标**：让购物车、收藏、年度、梦想、订单、专题海报在内容为空时也能生成好看的分享图。

**实施步骤**：
1. 为每种模板定义独立空状态文案和占位视觉。
2. 商品图体系完成后，把海报中的 emoji 网格升级为图片/emoji 混合拼贴。
3. 年度账单模板突出总额和人格报告标题。
4. 订单模板突出“永不送达”梗文案。
5. 100 万专题海报与常规海报视觉区分，保留金色挑战感。

**验收标准**：
- 空购物车、空收藏、空愿望时也能保存海报。
- 各模板截图辨识度不同，不只是换标题。

**预计涉及**：`src/pages/PosterPage.tsx`、`src/pages/MillionEventPage.tsx`。

### P3 — 备份导入校验继续加严

**目标**：在已有结构校验基础上，进一步拦截明显异常数据，降低导入脏数据导致 UI 异常的概率。

**实施步骤**：
1. 校验 `orders.items.quantity`、`priceSnapshot`、`totalAmount` 非负且范围合理。
2. 校验日期字段为合法 ISO 或 `YYYY-MM-DD`。
3. 校验枚举字段：订单状态、AI chat role、AI provider 等。
4. 校验 `cartItems.quantity` 不超过 `MAX_CART_QTY`。
5. 导入时对未知 setting key 保留，但对核心 setting 做类型修正或默认值兜底。

**验收标准**：
- 明显损坏或恶意构造的备份文件会给出明确错误。
- 合法旧备份仍可导入，不因过度严格误伤。

**预计涉及**：`src/db/backup.ts`、`src/types/index.ts`。

### P3 — PWA 构建与离线验证

**目标**：确认已配置的 `vite-plugin-pwa` 在真实构建产物中可用。

**实施步骤**：
1. 先解决本地依赖问题：`node_modules/.bin` 权限和 `oxlint` optional native binding 缺失。
2. 执行 `npm run build`，确认 TypeScript、Vite、PWA manifest 和 service worker 正常生成。
3. 用 `npm run preview` 本地预览，检查 manifest、icon、离线缓存。
4. 断网刷新已访问页面，确认核心页面可打开，IndexedDB 数据仍可读取。

**验收标准**：
- build 无错误。
- manifest 可被浏览器识别。
- 已访问过的静态资源断网后可用。

**预计涉及**：`vite.config.ts`、`public/`、依赖安装环境。

### P3 — 清理与文档收口

**目标**：把实现状态和文档保持一致，降低后续接手成本。

**实施步骤**：
1. 清理未使用的 Vite 模板残留样式和资源。
2. 更新 README，替换默认 Vite 文档为 Life Mall 项目说明、运行方式、数据边界。
3. 将完成后的缺口从本计划迁移到“已完成”或单独 changelog。
4. 保留“暂不做范围”：后端、账号、跨设备同步、真实支付、真实多人互动、排行榜。

**验收标准**：
- README 不再是默认模板内容。
- 计划文档能反映真实进度。
- 无无关模板资源影响理解。

**预计涉及**：`README.md`、`PLAN.md`、可能的未使用静态资源。

## 推荐开工顺序

1. P0 商品图片体系  
2. P0 加购飞入动效与震动  
3. P1 房间双指缩放、磁吸辅助线  
4. P1 AI 报告四屏仪式感  
5. P1 分享降级体验  
6. P2 签到数字动画、支付仪式感、分类和海报视觉 polish  
7. P3 备份校验、PWA 构建验证、README/计划收口  

## 本轮注意事项

- 只做纯前端和 IndexedDB 范围内的能力，不引入后端。
- 商品图片走 `public/` 或远程 URL，不写入 IndexedDB。
- 动效补强要有降级路径，不能因为浏览器不支持震动、分享或触控 API 导致报错。
- 当前本地 `npm run lint` 受依赖安装状态影响，后续动代码前建议先修复依赖环境或重装 `node_modules`。

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
