---
title: Python 异步编程笔记
date: 2024-03-15
tags:
  - Python
  - 异步
  - 并发
  - 编程
draft: false
description: asyncio 核心概念、常见模式与踩坑记录
---

## 核心概念

### 事件循环

Python 的异步核心是**事件循环（Event Loop）**，所有协程都在其中调度执行。

```python
import asyncio

async def main():
    print("开始")
    await asyncio.sleep(1)
    print("结束")

asyncio.run(main())
```

### async / await

- `async def` 定义一个**协程函数**
- `await` 暂停当前协程，让出控制权给事件循环
- 协程本身不会自动运行，需要被 `await` 或放入事件循环

### 并发执行

```python
async def fetch(url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.text()

# 并发请求多个 URL
results = await asyncio.gather(
    fetch("https://api.example.com/1"),
    fetch("https://api.example.com/2"),
    fetch("https://api.example.com/3"),
)
```

## 常见踩坑

> [!warning] 在同步函数中调用异步
> 不能直接在同步函数里 `await`，需要用 `asyncio.run()` 或 `loop.run_until_complete()`

> [!tip] 阻塞操作会卡住整个事件循环
> CPU 密集型任务用 `loop.run_in_executor()` 放到线程池执行

## 相关笔记

- [[notes/python-threading|Python 多线程笔记]]
- [[tools/httpx-guide|httpx 异步 HTTP 客户端]]

## 参考资料

- [Python 官方文档 — asyncio](https://docs.python.org/3/library/asyncio.html)
- *《流畅的 Python》第二版 第 21 章*
