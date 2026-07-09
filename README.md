# Life Mall 人生模拟商城

纯前端 + IndexedDB 的情绪消费模拟商城。用户可以逛商品、加购物车、假下单、生成海报、布置虚拟房间、签到领快乐币；所有用户数据只保存在当前浏览器本地，不接入真实支付和后端服务。

## 技术栈

- React + Vite + TypeScript
- React Router
- Zustand
- Dexie / IndexedDB
- Tailwind CSS
- html2canvas
- vite-plugin-pwa

## 本地运行

```bash
npm install
npm run dev
```

## 验证命令

```bash
node node_modules/typescript/bin/tsc -b --noEmit
npm run build
npm run preview
```

如果 `npm run lint` 报 `oxlint` native binding 缺失，通常是 optional dependency 没安装完整。重新执行 `npm install` 后再运行即可。

## 数据边界

- 无后端、无账号、无跨设备同步。
- 购物车、订单、收藏、签到、房间布局、AI 设置等数据存储在浏览器 IndexedDB。
- 数据备份/恢复页可导出 JSON，也可导入 JSON 覆盖恢复。
- 可选 AI 进阶模式使用用户自己的 API Key，Key 仅保存在本地浏览器。

## 静态资产

商品图片位于 `public/products/`，种子商品通过 `mainImageUrl` 和 `galleryImages` 引用这些文件。图片不会写入 IndexedDB，避免占用浏览器存储配额。
