# 个人知识库

> "敞开大门工作的人会遭遇各种干扰，但偶尔也能获得关于世界的线索，明白什么才是真正重要的。" — Richard Hamming

基于 [Quartz](https://quartz.jzhao.xyz/) 构建的个人知识库网站，帮助你将数字花园和笔记免费发布为网站。

## 📁 知识库结构

```
content/
├── index.md          # 首页
├── notes/            # 📝 技术笔记 — 编程、工具、技术原理
├── reading/          # 📖 读书笔记 — 书摘、感想、评分
├── projects/         # 🚀 项目记录 — 做过的项目、复盘总结
├── daily/            # 💭 日常思考 — 随想、日记、灵感片段
└── tools/            # 🔧 工具箱 — 效率工具、配置、脚本
```

### 内容分区说明

|| 分区 | 说明 | 示例内容 |
||------|------|----------|
|| `notes/` | 技术学习笔记 | 语言语法、框架用法、算法原理 |
|| `reading/` | 阅读记录 | 书摘、读后感、推荐书单 |
|| `projects/` | 项目复盘 | 项目背景、技术选型、经验总结 |
|| `daily/` | 日常记录 | 随想、灵感、待办事项 |
|| `tools/` | 工具整理 | 软件配置、脚本、效率技巧 |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 本地预览

```bash
# 启动本地开发服务器（支持热重载）
npx quartz build --serve

# 默认访问 http://localhost:8080
```

### 构建静态文件

```bash
# 构建到 public/ 目录
npx quartz build
```

---

## 📤 发布与部署

### 自动部署（推荐）

项目已配置 GitHub Actions 自动部署工作流：

1. **触发条件**：推送到 `main` 分支
2. **部署目标**：GitHub Pages
3. **访问地址**：`https://<username>.github.io`

```bash
# 提交更改后自动部署
git add .
git commit -m "更新笔记内容"
git push origin main
```

### 手动部署

如需手动触发部署：

1. 进入仓库的 **Actions** 页面
2. 选择 **部署知识库到 GitHub Pages** 工作流
3. 点击 **Run workflow**

---

## ⚙️ 配置说明

### 主要配置文件

|| 文件 | 说明 |
||------|------|
|| `quartz.config.ts` | 主配置（站点名称、主题、插件） |
|| `quartz.layout.ts` | 页面布局配置 |

### 常用配置项

编辑 `quartz.config.ts`：

```typescript
configuration: {
  pageTitle: "📚 我的知识库",      // 站点标题
  baseUrl: "username.github.io",  // 改成你的 GitHub 用户名
  locale: "zh-CN",                // 语言设置
}
```

### 忽略发布

在文章 frontmatter 中添加 `draft: true` 可阻止发布：

```yaml
---
title: 草稿文章
draft: true
---
```

---

## 📝 写作指南

### 新建文章

在 `content/` 对应目录下创建 `.md` 文件：

```bash
# 创建新笔记
content/notes/my-note.md

# 创建读书笔记
content/reading/book-name.md
```

### Frontmatter 模板

```yaml
---
title: 文章标题
date: 2024-01-01
tags:
  - 标签1
  - 标签2
aliases:
  - 别名
---
```

### 内部链接

使用双方括号链接到其他笔记：

```markdown
参见 [[notes/python-async]] 了解更多
```

> 📖 详细使用说明请查看 [知识库使用说明.md](./知识库使用说明.md)

---

## 🔗 相关链接

- 📖 Quartz 官方文档：https://quartz.jzhao.xyz/
- 💬 Quartz 社区：[Discord](https://discord.gg/cRFFHYye7t)
- 🌐 示例站点：https://quartz.jzhao.xyz/

---

*用 [Quartz](https://quartz.jzhao.xyz) 构建 · 托管于 GitHub Pages*
