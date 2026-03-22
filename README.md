# 📚 个人知识管理网站

基于 [Quartz v4](https://quartz.jzhao.xyz) 构建，支持双链、知识图谱、全文搜索、评论。

---

## 🚀 一次性初始化（只做一次）

### 第一步：在 GitHub 创建仓库

1. 登录 GitHub，点击右上角 **+** → **New repository**
2. 仓库名填写：`你的用户名.github.io`（例如 `zhangsan.github.io`）
3. 设置为 **Public**，不要勾选初始化 README
4. 点击 **Create repository**

### 第二步：在本地安装 Quartz

```bash
# 克隆 Quartz 官方仓库到本地
git clone https://github.com/jackyzha0/quartz.git 你的用户名.github.io
cd 你的用户名.github.io

# 安装依赖（约需 1-2 分钟）
npm install
```

### 第三步：复制本模板文件

将本仓库的以下文件覆盖到你的 Quartz 目录：

```
quartz.config.ts        ← 主配置（记得改 baseUrl 和用户名）
quartz.layout.ts        ← 布局配置（记得改 Giscus 评论仓库信息）
quartz/styles/custom.scss
content/                ← 整个内容目录
.github/workflows/deploy.yml
scripts/new-note.mjs
```

### 第四步：修改个人信息

打开 `quartz.config.ts`，修改：
```ts
baseUrl: "你的用户名.github.io",   // ← 必改
pageTitle: "你的知识库名称",         // ← 建议改
```

打开 `quartz.layout.ts`，修改评论配置（可先跳过，后续再配）：
```ts
repo: "你的用户名/你的用户名.github.io",
repoId: "...",       // 从 https://giscus.app 获取
categoryId: "...",   // 从 https://giscus.app 获取
```

### 第五步：推送到 GitHub

```bash
# 绑定到你刚创建的 GitHub 仓库
git remote set-url origin https://github.com/你的用户名/你的用户名.github.io.git

# 首次推送
git add .
git commit -m "初始化知识库"
git push -u origin main
```

### 第六步：开启 GitHub Pages

1. 打开仓库页面 → **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**
3. 保存后约等 1-2 分钟，访问 `https://你的用户名.github.io` 即上线 🎉

---

## ✍️ 日常写作流程

### 方式一：命令行快速创建（推荐）

```bash
# 创建技术笔记
npm run new -- notes/docker-basics "Docker 基础入门"

# 创建读书笔记
npm run new -- reading/the-pragmatic-programmer "程序员修炼之道"

# 创建项目记录
npm run new -- projects/my-app "个人 App 开发记录"

# 创建日记
npm run new -- daily/2024-03-15 "2024-03-15 日记"
```

### 方式二：配合 Obsidian 写作

1. 用 Obsidian 打开 `content/` 文件夹（作为 Vault）
2. 直接在 Obsidian 里写笔记，支持所见即所得预览
3. `[[双链]]` 语法 Quartz 原生支持，无需任何插件

### 本地预览

```bash
# 启动本地服务器，实时预览效果
npm start
# 浏览器打开 http://localhost:8080
```

### 发布到线上

```bash
# 写完笔记后，三步发布
git add .
git commit -m "新增：笔记标题"
git push

# ← 推送后 GitHub Actions 自动构建，约 1-2 分钟后线上更新
```

---

## 📁 内容目录结构

```
content/
├── index.md          ← 首页
├── notes/            ← 技术笔记
│   ├── index.md
│   └── python-async.md
├── reading/          ← 读书笔记
│   ├── index.md
│   └── template.md   ← 读书笔记模板（draft:true 不发布）
├── projects/         ← 项目记录
│   └── index.md
├── daily/            ← 日常思考
│   └── index.md
└── tools/            ← 工具箱
    └── index.md
```

### 私密内容（不发布）

有两种方式隐藏内容：

```yaml
# 方式一：Front Matter 标记草稿（不会出现在网站）
---
draft: true
---
```

```bash
# 方式二：放入 private/ 文件夹（已加入 .gitignore，不会上传到 GitHub）
content/private/my-secret-note.md
```

---

## 🔧 进阶配置

### 配置 Giscus 评论

1. 访问 [giscus.app](https://giscus.app)
2. 填入你的仓库名，选择 Discussion 分类
3. 复制生成的 `repoId` 和 `categoryId` 到 `quartz.layout.ts`

### 绑定自定义域名

1. 在域名服务商处添加 CNAME 记录：`@ → 你的用户名.github.io`
2. GitHub 仓库 → Settings → Pages → Custom domain 填入你的域名
3. 勾选 **Enforce HTTPS**

### 添加谷歌分析

在 `quartz.config.ts` 中修改：
```ts
analytics: {
  provider: "google",
  tagId: "G-XXXXXXXXXX",  // 你的 GA4 测量 ID
},
```

---

## ❓ 常见问题

**Q: 推送后网站没更新？**  
A: 去仓库 Actions 标签页查看构建日志，看是否有报错。

**Q: 本地预览正常，线上显示异常？**  
A: 检查 `quartz.config.ts` 的 `baseUrl` 是否填写正确。

**Q: 想要私密笔记不上传 GitHub？**  
A: 把文件放进 `content/private/` 目录，已在 `.gitignore` 中排除。
