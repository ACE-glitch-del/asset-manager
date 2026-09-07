# 个人资产管理系统（云端同步版）

手机微信、电脑浏览器随时打开，数据实时同步。

## 功能

- 现金总览（账户管理、资产构成、交易记录）
- 月现金流（年度收支趋势、分类占比）
- 固定收入/支出管理（增删改、暂停/启用）
- 个人投资（标的管理、深度分析、回报预测、观点收录）
- 数据自动云端同步，多端共享
- 支持数据导出备份

## 本地运行

```bash
npm install
npm start
```

浏览器打开 http://localhost:3000

---

## 部署到 Render（免费，手机电脑都能访问）

### 第一步：准备代码

把整个 `asset-manager` 文件夹上传到 GitHub 仓库（必须是公开仓库）。

如果没有GitHub账号，先注册一个：https://github.com

创建新仓库 → 把 `asset-manager` 里的所有文件上传进去。

### 第二步：注册 Render

1. 打开 https://render.com
2. 点击右上角 **Get Started** 或 **Sign Up**
3. 选择 **用 GitHub 账号登录**（方便后续自动部署）

### 第三步：创建 Web Service

1. 登录后，点击右上角 **New +** → 选择 **Web Service**
2. 找到你刚才上传的 GitHub 仓库，点击 **Connect**
3. 填写配置：

   | 配置项 | 填写内容 |
   |--------|----------|
   | Name | 随便起，比如 `my-asset`（这个会成为网址的一部分） |
   | Region | 选 `Singapore`（新加坡，国内访问快一点） |
   | Branch | `main` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | 选 **Free**（免费） |

4. 点击 **Create Web Service**

### 第四步：等待部署完成

- Render 会自动拉取代码、安装依赖、启动服务
- 大约需要 2-3 分钟
- 看到页面显示 **Live** 就成功了
- 你的网址是：`https://你的名字.onrender.com`

### 第五步：使用

- 电脑浏览器直接打开这个网址
- 手机微信里：把网址发给文件传输助手 → 点开即可使用
- 数据存在 Render 服务器，所有设备共享同一份数据

---

## 注意事项

### 免费版休眠
Render 免费版 15 分钟无访问会休眠。再次打开时需要等 10-20 秒唤醒（页面会显示加载），唤醒后数据都在，不影响使用。

### 数据安全
- 数据存在 Render 服务器的 JSON 文件里
- 建议定期点击页面右上角「备份」按钮导出 JSON 文件存到自己电脑/网盘
- 如果重新部署（git push），Render 会重置文件系统，数据会丢失——所以**部署成功后不要再随便 git push 更新代码**，如需更新请先导出备份

### 忘记网址怎么办
登录 https://dashboard.render.com → 点击你的 Web Service → 页面上方有网址

---

## 文件结构

```
asset-manager/
├── server.js          # 后端服务（Express）
├── package.json       # 依赖配置
├── public/
│   └── index.html     # 前端页面
├── data/
│   └── data.json      # 数据文件（自动生成）
└── README.md          # 本说明
```
