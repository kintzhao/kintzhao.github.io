#!/usr/bin/env node
/**
 * 快速创建新笔记脚本
 * 用法: npm run new -- notes/my-note "笔记标题"
 *       npm run new -- reading/book-name "书名"
 */

import { writeFileSync, mkdirSync, existsSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = join(__dirname, "../content")

const [, , pathArg, titleArg] = process.argv

if (!pathArg || !titleArg) {
  console.error("用法: npm run new -- <路径> <标题>")
  console.error("示例: npm run new -- notes/python-tip Python小技巧")
  process.exit(1)
}

// 生成 Front Matter
const now = new Date()
const dateStr = now.toISOString().split("T")[0]

const templates = {
  reading: `---
title: ${titleArg}
date: ${dateStr}
tags:
  - 读书笔记
draft: false
description: 
rating: 
---

## 一句话总结

## 核心观点

## 金句摘录

## 个人感想
`,
  daily: `---
title: ${titleArg}
date: ${dateStr}
tags:
  - 日记
draft: false
---

## 今日记录

## 思考与感悟
`,
  default: `---
title: ${titleArg}
date: ${dateStr}
tags: []
draft: false
description: 
---

## 概述

## 正文

## 参考资料
`,
}

// 选择模板
const section = pathArg.split("/")[0]
const template = templates[section] ?? templates.default

// 创建文件
const filePath = join(contentDir, pathArg.endsWith(".md") ? pathArg : `${pathArg}.md`)
const dir = dirname(filePath)

if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
if (existsSync(filePath)) {
  console.error(`❌ 文件已存在: ${filePath}`)
  process.exit(1)
}

writeFileSync(filePath, template, "utf-8")
console.log(`✅ 已创建: ${filePath}`)
