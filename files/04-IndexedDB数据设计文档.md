# 人生模拟商城（Life Mall）—— IndexedDB 数据设计文档
> 版本：v2.0 · 纯前端本地数据库设计（基于 Dexie.js）

---

## 1. 技术方案说明

浏览器原生 IndexedDB API 较为繁琐，推荐使用 **Dexie.js** 进行封装，语法接近普通对象操作，同时提供事务、索引、版本迁移等能力。

```javascript
import Dexie from 'dexie';

export const db = new Dexie('LifeMallDB');

db.version(1).stores({
  userProfile: 'id',
  products: 'id, categoryCode',
  productCopies: '++id, productId, copyType',
  cartItems: '++id, productId',
  orders: '++id, createdAt',
  favorites: '++id, productId',
  checkins: '++id, checkinDate',
  aiReports: '++id, createdAt',
  aiChatLogs: '++id, productId, createdAt',
  wishlistItems: '++id, productId',
  roomItems: '++id, productId',
  settings: 'key',
});
```

> 由于是单用户本地场景，所有 store 不再需要 `user_id` 字段做多用户区分（IndexedDB本身就是"每个浏览器一个独立用户"），大幅简化了原关系型数据库的设计。

---

## 2. Object Store 详细设计

### 2.1 `userProfile`（用户本地档案，仅一条记录）

```json
{
  "id": "local-user",
  "nickname": "打工人小美",
  "avatarUrl": "/avatars/preset-03.png",
  "happyCoin": 120,
  "joinedAt": "2026-07-01T10:00:00.000Z",
  "onboardingCompleted": true
}
```
- `keyPath`: `id`（固定值 `"local-user"`，全应用只有一条记录）

### 2.2 `products`（商品数据，应用启动时以预置JSON种子数据写入，只读为主）

```json
{
  "id": "prod_001",
  "categoryCode": "too_expensive",
  "name": "保时捷911",
  "price": 1280000,
  "mainImageUrl": "/products/porsche911.png",
  "galleryImages": ["/products/porsche911_1.png", "/products/porsche911_2.png"],
  "stockText": "库存：仅剩你的自尊心",
  "tags": ["梗", "热门"],
  "isActive": true
}
```
- `keyPath`: `id`
- 索引：`categoryCode`（用于分类列表页快速筛选）

### 2.3 `productCopies`（商品AI文案素材池，离线预生成，随机展示降低成本）

```json
{
  "id": 1,
  "productId": "prod_001",
  "copyType": "review",
  "content": "买了但是不会真的送到，主打一个心理安慰",
  "authorName": "隔壁老王"
}
```
- `keyPath`: `++id`（自增）
- 索引：`productId`, `copyType`

### 2.4 `cartItems`（购物车）

```json
{
  "id": 1,
  "productId": "prod_001",
  "quantity": 2,
  "selected": true,
  "addedAt": "2026-07-09T20:00:00.000Z"
}
```
- `keyPath`: `++id`
- 索引：`productId`（防止重复添加时可先查询是否已存在，存在则更新数量而非新增记录）

### 2.5 `orders`（假订单，订单明细以嵌套数组形式存储，无需单独拆表）

```json
{
  "id": 1,
  "items": [
    { "productId": "prod_001", "nameSnapshot": "保时捷911", "priceSnapshot": 1280000, "quantity": 1 }
  ],
  "totalAmount": 1280000,
  "status": "paid_fake",
  "deliveryStatus": "never_delivered",
  "deliveryCopy": "骑手正在思考人生",
  "createdAt": "2026-07-09T20:05:00.000Z"
}
```
- `keyPath`: `++id`
- 索引：`createdAt`（用于历史订单按时间排序）
- **设计说明**：与原关系型设计不同，这里将订单明细直接作为JSON数组嵌入订单记录本身，无需单独的 `order_items` store —— IndexedDB 存储的是文档式对象，没有必要过度拆分关系表，减少不必要的多次查询

### 2.6 `favorites`（收藏）

```json
{ "id": 1, "productId": "prod_001", "createdAt": "2026-07-09T20:10:00.000Z" }
```
- `keyPath`: `++id`
- 索引：`productId`（写入前查重，避免重复收藏）

### 2.7 `checkins`（签到记录）

```json
{ "id": 1, "checkinDate": "2026-07-09", "rewardCoin": 10, "streakDays": 3 }
```
- `keyPath`: `++id`
- 索引：`checkinDate`（唯一，用于判断当天是否已签到及计算连续天数）
- **注意**：`checkinDate` 使用本地日期字符串（`YYYY-MM-DD`），需处理用户手动修改系统时间导致日期异常回退的情况（检测到新签到日期早于最后一条记录时，给出友好提示而非直接报错）

### 2.8 `aiReports`（AI人格分析报告）

```json
{
  "id": 1,
  "title": "数码荷尔蒙过盛型购物人格",
  "content": "你加购最多的分类是数码类，看来工资都被科技以人为本地偷走了……",
  "basedOnSnapshot": { "topCategory": "digital", "totalOrders": 5 },
  "createdAt": "2026-07-09T20:15:00.000Z"
}
```
- `keyPath`: `++id`
- 索引：`createdAt`（获取最新一份报告）

### 2.9 `aiChatLogs`（AI客服对话记录，可设置定期清理避免占用过多空间）

```json
{ "id": 1, "productId": "prod_001", "role": "assistant", "content": "亲，这个真的很适合您～", "createdAt": "2026-07-09T20:20:00.000Z" }
```
- `keyPath`: `++id`
- 索引：`productId`, `createdAt`

### 2.10 `wishlistItems`（梦想清单）

```json
{ "id": 1, "productId": null, "customTitle": "环游世界", "fulfilled": false, "createdAt": "2026-07-09T20:25:00.000Z" }
```
- `keyPath`: `++id`
- 索引：`productId`（可为空，支持自定义文字愿望）

### 2.11 `roomItems`（虚拟房间摆放记录）

```json
{ "id": 1, "productId": "prod_001", "positionX": 120, "positionY": 80, "scale": 1.2, "zIndex": 2 }
```
- `keyPath`: `++id`
- 索引：`productId`

### 2.12 `settings`（应用设置，含AI进阶模式配置）

```json
{ "key": "aiAdvancedMode", "value": { "enabled": false, "apiKey": "", "provider": "anthropic" } }
```
- `keyPath`: `key`（简单的键值对存储，如 `aiAdvancedMode`、`darkMode`、`lastBackupAt` 等均可作为独立记录存入此store）
- ⚠️ **安全提示**：`apiKey` 明文存储于本地浏览器中，仅用于前端直接请求第三方API，需在UI层面反复提示用户风险（不在浏览器公共/共享设备开启）

---

## 3. 数据关系与一致性处理（应用层维护）

IndexedDB 不提供外键约束，所有关联关系需在业务代码层自行维护，需注意以下场景：

| 场景 | 处理方式 |
|---|---|
| 商品下架（`products.isActive = false`） | 购物车/收藏中已存在的引用保留展示，但标记"该商品已下架"提示，不强制删除用户历史数据 |
| 删除购物车商品对应的 `productId` 不存在 | 前端渲染时做兜底判断，展示"商品信息丢失"占位卡片，避免白屏报错 |
| 重复添加同一商品到购物车 | 写入前先按 `productId` 查询 `cartItems`，存在则更新 `quantity`，不存在则新增记录 |
| 重复收藏 | 写入前查询 `favorites` 中是否已有相同 `productId`，存在则视为"取消收藏"（删除该记录），实现收藏按钮的开关效果 |

---

## 4. 数据备份/导出方案

导出时，遍历所有 store，组装成一个总JSON文件：

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-07-09T21:00:00.000Z",
  "data": {
    "userProfile": [ ... ],
    "cartItems": [ ... ],
    "orders": [ ... ],
    "favorites": [ ... ],
    "checkins": [ ... ],
    "aiReports": [ ... ],
    "wishlistItems": [ ... ],
    "roomItems": [ ... ],
    "settings": [ ... ]
  }
}
```

- `products` 和 `productCopies` 属于应用预置静态数据，**不需要包含在用户备份文件中**（体积会很大且无必要），恢复时以应用自带的种子数据为准即可
- 导出方式：`JSON.stringify` → `Blob` → 创建临时 `<a>` 标签触发浏览器下载，文件名建议格式为 `lifemall-backup-20260709.json`

---

## 5. 数据导入/恢复方案

1. 用户选择本地JSON文件 → `FileReader` 读取 → `JSON.parse`
2. 校验 `schemaVersion` 是否与当前应用支持的版本兼容（若版本不匹配，需给出迁移或提示"请更新应用后再导入"）
3. 弹出二次确认弹窗（"导入将覆盖当前所有本地数据，此操作不可撤销"）
4. 确认后：清空当前用户数据类store（不清空 `products`/`productCopies`）→ 逐个写入导入的数据 → 提示"恢复成功"

---

## 6. Schema 版本迁移策略

Dexie 支持声明多个版本以实现平滑升级，例如未来新增字段：

```javascript
db.version(1).stores({ /* 见上文 */ });

// 未来版本升级示例：orders 新增 note 字段（无需特殊迁移函数，新字段直接读写undefined即可兼容）
db.version(2).stores({
  orders: '++id, createdAt, note', // 新增索引字段
}).upgrade(tx => {
  // 如需为历史数据填充默认值，可在此编写迁移逻辑
  return tx.table('orders').toCollection().modify(order => {
    if (order.note === undefined) order.note = '';
  });
});
```

---

## 7. 存储容量注意事项

- 现代浏览器对 IndexedDB 的配额通常为剩余磁盘空间的一定比例（Chrome/Edge 较宽松，可达数GB；Safari 相对保守，尤其隐私模式下限制更严格且可能不持久化）
- **强烈建议**：商品图片一律使用远程URL引用（CDN或应用public目录静态资源），**不要**将图片以Base64编码塞入IndexedDB，这是最容易迅速占满配额的做法
- `aiChatLogs` 建议设置保留策略（如只保留最近30天或最近200条记录），避免无限增长
- 可在"设置页"提供"查看当前存储占用情况"（通过 `navigator.storage.estimate()` API）和"清理旧对话记录"的入口
