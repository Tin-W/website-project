# 🚀 AXG AI Model Marketplace

一個現代化的 AI API / 模型集市（Model Marketplace）電商平台，專為展示與訂購 OpenAI、DeepSeek 及 Anthropic (Claude) 等頂尖 AI 模型 API 服務而設計。

專案具備完整的多語言切換（繁體中文 / 英文）、響應式卡片展示、模擬流動支付（支付寶/微信支付）以及獨立的管理員後台（Admin Dashboard）系統。

---

## 🛠️ 技術棧 (Tech Stack)

* **前端 (Frontend)**: HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+ Vanilla JS)
* **後端 (Backend)**: Node.js, Express.js
* **資料庫 (Database)**: MongoDB (via Mongoose)
* **容器化部署 (Containerization)**: Docker & Docker Compose
* **多語言支持 (i18n)**: Client-side `lang.json` + LocalStorage 狀態持久化

---

## 📁 專案架構 (Project Structure)

```text
my-ecommerce/
├── docker-compose.yml       # Docker 容器多服務編排設定檔
├── package.json             # Node.js 依賴與腳本
├── server.js                # Express API 伺服器與 MongoDB Schema
├── README.md                # 專案說明文件
└── public/                  # 靜態前端資源庫
    ├── index.html           # 1. 首頁 (Homepage)
    ├── marketplace.html     # 2. AI 模型集市頁 (Marketplace)
    ├── about.html           # 3. 關於我們與團隊介紹頁
    ├── admin.html           # 4. 後台商品管理系統 (Admin Dashboard)
    ├── style.css            # 全站 UI 樣式表
    ├── app.js               # 前端核心邏輯 (i18n, API 串接, 渲染)
    ├── lang.json            # 中英文雙語字典檔
    └── images/              # 圖片庫 (OpenAI, DeepSeek, Claude Logo)