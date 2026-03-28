---
title: 23种GoF设计模式与AI Agent
---

# 23 种 GoF 设计模式 × AI Agent 时代

> [!tip] 交互版本
> 查看交互式网页版本：[GoF Agent Patterns](/static/gof-agent-patterns.html)

---

## 概述

本文档将经典的 23 种 GoF 设计模式与现代 AI Agent 开发相结合，展示每种模式在 Agent 系统中的实际应用场景和代码示例。

---

## 一、创建型模式（5 种）

### 1. Singleton 单例模式

**意图**：确保一个类只有一个实例，并提供全局访问点

**应用场景**：全局唯一 LLM Client

```typescript
class LLMClient {
  static instance = null;
  static getInstance() {
    if (!LLMClient.instance)
      LLMClient.instance = new LLMClient();
    return LLMClient.instance;
  }
  async complete(prompt) { /* 调用 API */ }
}

// Agent A 和 Agent B 共享同一连接池
const agentA = LLMClient.getInstance();
const agentB = LLMClient.getInstance();
console.log(agentA === agentB); // true
```

| 应用场景 | 核心价值 |
|---------|---------|
| 全局 LLMClient 连接池 / VectorDB 实例 / Config 配置中心 / Token 计数器 | 避免每个 Agent 各自初始化 LLM 连接，统一管理 API Key、连接池和全局限流 |

---

### 2. Factory Method 工厂方法模式

**意图**：定义创建对象的接口，让子类决定实例化哪个类

**应用场景**：按任务类型动态实例化 Agent

```typescript
abstract class AgentFactory {
  abstract createAgent(): Agent;

  // 模板方法：创建并执行
  async run(task) {
    const agent = this.createAgent();
    return agent.execute(task);
  }
}

class SearchAgentFactory extends AgentFactory {
  createAgent() { return new SearchAgent(); }
}
class CodeAgentFactory extends AgentFactory {
  createAgent() { return new CodeAgent({lang:'python'}); }
}

// 路由器根据 intent 选择工厂
const factory = intentRouter(task.intent);
const result  = await factory.run(task);
```

| 应用场景 | 核心价值 |
|---------|---------|
| 任务路由器根据用户 intent 分类，实例化对应专项 Agent | 新增 Agent 类型只需扩展一个子类，主流程代码零修改，完全符合开闭原则 |

---

### 3. Abstract Factory 抽象工厂模式

**意图**：创建一系列相关对象，无需指定它们的具体类

**应用场景**：切换 LLM 厂商整套 Agent 族

```typescript
interface AgentSuite {
  createPlanner(): Planner;
  createExecutor(): Executor;
  createCritic(): Critic;
}

class ClaudeSuite implements AgentSuite {
  createPlanner()  { return new ClaudePlanner(); }
  createExecutor() { return new ClaudeExecutor(); }
  createCritic()   { return new ClaudeCritic(); }
}
class GPT4Suite implements AgentSuite {
  createPlanner()  { return new GPT4Planner(); }
  createExecutor() { return new GPT4Executor(); }
  createCritic()   { return new GPT4Critic(); }
}

// 通过环境变量一键切换整套
const suite = process.env.LLM === 'claude'
  ? new ClaudeSuite() : new GPT4Suite();
```

| 应用场景 | 核心价值 |
|---------|---------|
| 一键切换 Claude / GPT-4 / Gemini 整套 Agent 族，不改任何业务代码 | 跨模型厂商迁移时只需替换 Suite 实现，所有 Agent 类型同步切换 |

---

### 4. Builder 建造者模式

**意图**：将复杂对象的构建与其表示分离，支持分步构建

**应用场景**：链式配置复杂 Agent 参数

```typescript
const agent = new AgentBuilder()
  .setModel("claude-sonnet-4-5")
  .setSystemPrompt("You are a research assistant.")
  .addTool(new WebSearchTool())
  .addTool(new PythonREPLTool())
  .addTool(new FileReadTool())
  .setMemory(new VectorMemory({ topK: 5 }))
  .setMaxSteps(20)
  .setTemperature(0.3)
  .setRetryPolicy({ maxRetries: 3, backoff: 'exp' })
  .build();  // 最终返回 Agent 实例

// 不同配置的 Agent 用不同 Builder
const fastAgent = new AgentBuilder().setModel("haiku").build();
const deepAgent = new AgentBuilder().setModel("opus").build();
```

| 应用场景 | 核心价值 |
|---------|---------|
| LangChain/AutoGen Agent 初始化，Prompt 模板构建，工具链配置 | 将复杂配置（模型+工具+记忆+参数）拆分为可组合步骤，不同场景复用部分配置 |

---

### 5. Prototype 原型模式

**意图**：通过复制已有对象来创建新对象，避免重复初始化

**应用场景**：克隆基础 Agent 快速派生变体

```typescript
class ResearchAgent {
  model = "claude-sonnet-4-5";
  tools = [searchTool, fetchTool, calcTool];
  systemPrompt = "You are a researcher.";
  temperature  = 0.3;

  clone(): ResearchAgent {
    const copy = new ResearchAgent();
    copy.model = this.model;
    copy.tools = [...this.tools];   // 浅克隆工具列表
    copy.systemPrompt = this.systemPrompt;
    copy.temperature = this.temperature;
    return copy;
  }
}

// 基础 Agent 只初始化一次（昂贵操作）
const base = new ResearchAgent();
await base.initialize();  // 耗时 2s

// 10 个并发 Agent 克隆即可，各自只改差异部分
const cnAgent = base.clone();
cnAgent.systemPrompt += " 请用中文回答。";
const enAgent = base.clone();
enAgent.temperature = 0.1;  // 更确定性
```

| 应用场景 | 核心价值 |
|---------|---------|
| Multi-Agent 并发场景，快速派生同类 Agent 的专化版本 | 避免重复初始化开销，N 个并发 Agent 克隆一个原型，初始化成本从 O(N) 降为 O(1) |

---

## 二、结构型模式（7 种）

### 6. Adapter 适配器模式

**意图**：将不兼容的接口转换为目标接口，使原本无法协作的类可以一起工作

**应用场景**：统一封装异构工具 API

```typescript
// Agent 只认识统一的 Tool 接口
interface Tool {
  name: string;
  description: string;
  call(args: object): Promise<string>;
}

// 适配 Google Custom Search API
class GoogleSearchAdapter implements Tool {
  name = "web_search";
  description = "Search the web for information";

  async call({ query, num = 5 }) {
    const raw = await googleAPI.customSearch({
      q: query, num, key: process.env.GOOGLE_KEY
    });
    // 将 Google 格式 → 统一格式
    return raw.items
      .map(i => `${i.title}: ${i.snippet}`)
      .join("\n");
  }
}
// Bing / Serper / Tavily 同理，各写一个 Adapter
```

| 应用场景 | 核心价值 |
|---------|---------|
| 将 Google/Bing/Serper/Tavily/SerpAPI 等异构搜索服务封装为统一 Tool 接口 | Agent 调用工具无需关心底层 API 差异，切换搜索服务零成本 |

---

### 7. Facade 外观模式

**意图**：为复杂子系统提供简化的统一接口

**应用场景**：简化 Agent 系统调用入口

```typescript
class AgentFacade {
  private planner  = new TaskPlanner();
  private executor = new ToolExecutor();
  private memory   = new VectorMemory();
  private critic   = new OutputCritic();

  // 外部只需调用这一个方法
  async run(userInput: string): Promise<string> {
    // 内部编排四个子系统
    const plan   = await this.planner.decompose(userInput);
    const draft  = await this.executor.runPlan(plan);
    await this.memory.upsert(userInput, draft);
    return this.critic.refine(draft);
  }
}

// 使用方：一行代码，无需了解内部架构
const facade = new AgentFacade();
const answer = await facade.run("分析最新的 AI 论文趋势");
```

| 应用场景 | 核心价值 |
|---------|---------|
| 对外暴露 agent.run(task)，隐藏 Planner/Executor/Memory/Critic 的复杂交互 | 下游调用方接口稳定，内部可随时重构子系统而不影响外部 |

---

### 8. Proxy 代理模式

**意图**：为对象提供代理以控制对其访问，可附加额外逻辑

**应用场景**：透明拦截 LLM 调用

```typescript
class LLMProxy implements LLMInterface {
  private cache = new Map<string, string>();
  private callCount = 0;
  private startTime = Date.now();

  constructor(private real: LLMInterface) {}

  async complete(prompt: string): Promise<string> {
    // 1. 语义缓存：相同 prompt 直接返回
    const cached = await this.semanticCache.get(prompt);
    if (cached) return cached;

    // 2. 限流：每分钟不超过 60 次
    const elapsed = (Date.now() - this.startTime) / 60000;
    if (this.callCount / elapsed > 60)
      await this.rateLimit.wait();

    // 3. 审计日志
    this.auditLog.record({ prompt, timestamp: Date.now() });

    // 4. 真实调用
    const result = await this.real.complete(prompt);
    this.cache.set(prompt, result);
    this.callCount++;
    return result;
  }
}
```

| 应用场景 | 核心价值 |
|---------|---------|
| LLM API 网关：缓存 / 限流 / 安全审计 / Token 费用统计 / 负载均衡 | 所有 LLM 调用经过代理层统一处理横切关注点，业务代码完全不感知 |

---

### 9. Decorator 装饰器模式

**意图**：动态地为对象添加额外职责，比继承更灵活

**应用场景**：无侵入动态叠加 Agent 能力

```typescript
// 基础 Agent
class BaseAgent implements Agent {
  async run(task: string) {
    return this.llm.complete(task);
  }
}

// 装饰器：自动重试（指数退避）
class RetryDecorator implements Agent {
  constructor(private inner: Agent) {}
  async run(task: string) {
    for (let i = 0; i < 3; i++) {
      try { return await this.inner.run(task); }
      catch(e) {
        if (i === 2) throw e;
        await sleep(1000 * 2 ** i); // 1s, 2s, 4s
      }
    }
  }
}

// 装饰器：结构化日志
class LogDecorator implements Agent {
  constructor(private inner: Agent) {}
  async run(task: string) {
    const t0 = Date.now();
    const res = await this.inner.run(task);
    logger.info({ task, ms: Date.now()-t0, tokens: count(res) });
    return res;
  }
}

// 任意叠加：外层先执行
const agent = new LogDecorator(
  new RetryDecorator(
    new RateLimitDecorator(
      new TokenCountDecorator(new BaseAgent()))));
```

| 应用场景 | 核心价值 |
|---------|---------|
| 叠加 Logging / Retry / RateLimit / Tracing / TokenCount，不修改 Agent 本体 | 能力正交组合，任意顺序叠加，测试时可单独摘除某层 |

---

### 10. Composite 组合模式

**意图**：将对象组合成树形结构以表示"部分-整体"层次，统一对待单个对象和组合对象

**应用场景**：树状 Multi-Agent 统一调用

```typescript
interface AgentNode {
  execute(task: Task): Promise<Result[]>;
}

// 叶节点：单个专项 Agent
class LeafAgent implements AgentNode {
  constructor(private role: string) {}
  async execute(task: Task): Promise<Result[]> {
    return [await this.llm.complete(task.input)];
  }
}

// 组合节点：Agent 群组（并行执行）
class AgentGroup implements AgentNode {
  private children: AgentNode[] = [];
  add(child: AgentNode) { this.children.push(child); }

  async execute(task: Task): Promise<Result[]> {
    // 并行分发给所有子节点
    const all = await Promise.all(
      this.children.map(c => c.execute(task))
    );
    return all.flat();
  }
}

// 构建树：Research 团队
const researchTeam = new AgentGroup();
researchTeam.add(new LeafAgent("searcher"));
researchTeam.add(new LeafAgent("analyst"));

// 子群组：Writing 团队
const writingTeam = new AgentGroup();
writingTeam.add(new LeafAgent("drafter"));
writingTeam.add(new LeafAgent("editor"));

// 顶层 Orchestrator 统一调用
const org = new AgentGroup();
org.add(researchTeam);
org.add(writingTeam);
const results = await org.execute(task); // 递归并行
```

| 应用场景 | 核心价值 |
|---------|---------|
| CrewAI / AutoGen 的团队编排，Orchestrator 递归分发任务给子 Agent 树 | 单个 Agent 和 Agent 群组外部接口完全一致，支持任意深度嵌套 |

---

### 11. Bridge 桥接模式

**意图**：将抽象部分与实现部分分离，使它们可以独立变化

**应用场景**：Agent 策略与 LLM 正交扩展

```typescript
// 实现层：LLM 后端
interface LLMBackend {
  generate(prompt: string, opts?: any): Promise<string>;
}
class ClaudeBackend implements LLMBackend {
  async generate(p, opts) { return claudeAPI.complete(p, opts); }
}
class GPT4Backend implements LLMBackend {
  async generate(p, opts) { return openaiAPI.complete(p, opts); }
}

// 抽象层：推理策略（持有 backend 引用）
abstract class AgentStrategy {
  constructor(protected backend: LLMBackend) {}
  abstract run(task: string): Promise<string>;
}
class ReActStrategy extends AgentStrategy {
  async run(task: string) {
    // ReAct 循环，底层调用 this.backend.generate()
    let thought = await this.backend.generate("Thought: " + task);
    // ... 循环直到完成
    return thought;
  }
}

// 2 种策略 × 3 种 LLM = 6 种组合，只需 5 个类
const agent = new ReActStrategy(new ClaudeBackend());
const agent2 = new PlanStrategy(new GPT4Backend());
```

| 应用场景 | 核心价值 |
|---------|---------|
| ReAct / PlanExecute / Reflection 三种策略 × GPT/Claude/Gemini 自由组合 | 避免 3×3=9 个子类爆炸，新增策略不影响 LLM 实现，反之亦然 |

---

### 12. Flyweight 享元模式

**意图**：通过共享细粒度对象来支持大量细粒度对象，减少内存占用

**应用场景**：共享 System Prompt 降低内存

```typescript
class PromptTemplatePool {
  // 内部状态：可共享（不可变）
  private static pool = new Map<string, PromptTemplate>();

  static acquire(templateId: string): PromptTemplate {
    if (!this.pool.has(templateId)) {
      // 只加载一次（可能需要读磁盘/网络）
      this.pool.set(templateId, PromptTemplate.load(templateId));
    }
    return this.pool.get(templateId)!;
  }
}

// 1000 个并发 Agent 共享同一模板对象
// 每个 Agent 只持有自己的外部状态（用户上下文）
async function handleRequest(userId: string, task: string) {
  const tpl = PromptTemplatePool.acquire("researcher_v3");
  const userContext = await loadUserContext(userId); // 外部状态

  // render 时注入外部状态，不修改共享模板
  const prompt = tpl.render({
    task,
    history: userContext.history,
    tools:   userContext.availableTools
  });
  return llm.complete(prompt);
}
```

| 应用场景 | 核心价值 |
|---------|---------|
| 万级并发 Agent 共享 System Prompt / Few-shot 示例 / Tool Schema 定义 | 10000 个并发实例只需一份 System Prompt 对象，内存从 O(N) 降为 O(1) |

---

## 三、行为型模式（11 种）

### 13. Strategy 策略模式

**意图**：定义一系列可互换的算法，将每个算法封装起来，使它们可以相互替换

**应用场景**：运行时切换推理策略

```typescript
interface ReasoningStrategy {
  reason(task: string, tools: Tool[]): Promise<Action>;
}

class ReActStrategy implements ReasoningStrategy {
  async reason(task, tools) {
    // Thought → Action → Observation 循环
    while (!done) {
      const thought = await llm.think(task, history);
      const action  = parseAction(thought);
      history.push(await action.execute());
    }
  }
}
class PlanAndExecuteStrategy implements ReasoningStrategy {
  async reason(task, tools) {
    const steps = await planner.decompose(task);  // 先规划
    for (const step of steps)                     // 再执行
      await executor.run(step, tools);
  }
}
class ReflectionStrategy implements ReasoningStrategy {
  async reason(task, tools) {
    let result = await baseStrategy.reason(task, tools);
    const critique = await critic.evaluate(result);
    if (critique.score < 0.8) result = await refine(result, critique);
    return result;
  }
}

// Agent 动态切换策略
agent.setStrategy(
  task.complexity > 0.8 ? new PlanAndExecuteStrategy()
  : task.needsVerify    ? new ReflectionStrategy()
  :                       new ReActStrategy()
);
```

| 应用场景 | 核心价值 |
|---------|---------|
| 简单问答用 ReAct，复杂研究自动升级 Plan&Execute，高质量要求时启用 Reflection | 推理策略与 Agent 主体解耦，A/B 测试不同策略效果，热切换无需重启 |

---

### 14. Observer 观察者模式

**意图**：当对象状态变化时，自动通知所有依赖它的观察者

**应用场景**：Agent 事件总线广播

```typescript
class AgentEventBus {
  private listeners = new Map<string, Set<Function>>();

  on(event: string, fn: Function) {
    if (!this.listeners.has(event))
      this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }
  off(event: string, fn: Function) {
    this.listeners.get(event)?.delete(fn);
  }
  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}

const bus = new AgentEventBus();

// 多个观察者订阅同一事件，互不知晓
bus.on("tool_called",   e => structuredLogger.log(e));
bus.on("tool_called",   e => metricsCollector.record(e));
bus.on("step_complete", e => uiStream.push(e));         // 流式 UI
bus.on("token_used",    e => billingService.charge(e));
bus.on("error",         e => alertSystem.page(e));

// Agent 执行时只管 emit，不知道谁在监听
agent.on("tool_result", (result) => bus.emit("tool_called", result));
```

| 应用场景 | 核心价值 |
|---------|---------|
| 执行过程实时推送到 UI / 监控 / 计费 / 告警，新增监控维度只加订阅者 | Agent 执行逻辑完全不知道谁在观察它，观察者可随时插拔 |

---

### 15. Chain of Responsibility 责任链模式

**意图**：请求沿处理链传递，每个处理者决定处理还是继续传递

**应用场景**：Agent Middleware Pipeline

```typescript
abstract class Middleware {
  protected next?: Middleware;
  setNext(m: Middleware) { this.next = m; return m; }
  abstract handle(req: AgentRequest): Promise<AgentRequest>;
}

class SafetyFilter extends Middleware {
  async handle(req) {
    if (await isToxic(req.input))
      throw new BlockedError("Content policy violation");
    return this.next?.handle(req) ?? req;
  }
}
class MemoryInjector extends Middleware {
  async handle(req) {
    req.context = await vectorDB.retrieve(req.input, { topK: 5 });
    return this.next?.handle(req) ?? req;
  }
}
class ToolRouter extends Middleware {
  async handle(req) {
    req.tools = selectTools(req.input, availableTools);
    return this.next?.handle(req) ?? req;
  }
}
class LLMHandler extends Middleware {
  async handle(req) {
    req.output = await llm.complete(req.input, req.context, req.tools);
    return req;
  }
}

// 链式组装
const pipeline = new SafetyFilter();
pipeline
  .setNext(new MemoryInjector())
  .setNext(new ToolRouter())
  .setNext(new LLMHandler());

const result = await pipeline.handle({ input: userQuery });
```

| 应用场景 | 核心价值 |
|---------|---------|
| 用户请求 → 安全检查 → 记忆注入 → 工具路由 → LLM 推理，每层可独立增删 | 中间件顺序可配置，每层独立测试，LangChain/LlamaIndex Pipeline 的底层实现 |

---

### 16. Command 命令模式

**意图**：将请求封装为对象，支持参数化、撤销/重做、队列和日志

**应用场景**：工具调用封装为可撤销命令

```typescript
interface AgentCommand {
  execute(): Promise<Result>;
  undo(): Promise<void>;
  serialize(): string;  // 持久化 / 重放
}

class WriteFileCommand implements AgentCommand {
  private backup: string | null = null;

  constructor(private path: string, private content: string) {}

  async execute() {
    this.backup = await fs.readFile(this.path, 'utf8').catch(() => null);
    await fs.writeFile(this.path, this.content);
    return { path: this.path, written: this.content.length };
  }
  async undo() {
    if (this.backup !== null)
      await fs.writeFile(this.path, this.backup);
    else
      await fs.unlink(this.path);
  }
  serialize() { return JSON.stringify({ type:'write', path: this.path }); }
}

// 命令队列：顺序执行，失败回滚
class CommandQueue {
  private history: AgentCommand[] = [];

  async execute(cmd: AgentCommand) {
    await cmd.execute();
    this.history.push(cmd);
  }
  async undoLast() {
    const cmd = this.history.pop();
    await cmd?.undo();
  }
  async undoAll() {
    while (this.history.length) await this.undoLast();
  }
}
```

| 应用场景 | 核心价值 |
|---------|---------|
| Coding Agent 的文件操作序列支持回滚；Tool Call 历史记录与重放调试 | Agent 每个工具调用都可精准撤销，出错时回滚到安全状态 |

---

### 17. Iterator 迭代器模式

**意图**：提供统一方式遍历集合，而不暴露底层表示

**应用场景**：遍历执行计划步骤序列

```typescript
class PlanIterator implements Iterator<Step> {
  private index = 0;
  private skipped = new Set<string>();

  constructor(private steps: Step[]) {}

  next(): IteratorResult<Step> {
    // 跳过被标记为跳过的步骤
    while (this.index < this.steps.length &&
           this.skipped.has(this.steps[this.index].id))
      this.index++;

    if (this.index < this.steps.length)
      return { value: this.steps[this.index++], done: false };
    return { value: undefined as any, done: true };
  }

  // 条件跳转（某步骤失败时跳过依赖它的后续步骤）
  skipDependents(failedStepId: string) {
    this.steps
      .filter(s => s.dependsOn?.includes(failedStepId))
      .forEach(s => this.skipped.add(s.id));
  }
}

// 使用
const iter = new PlanIterator(plan.steps);
for (const step of iter) {
  try {
    await executor.run(step);
  } catch(e) {
    console.error(`Step ${step.id} failed, skipping dependents`);
    iter.skipDependents(step.id);
  }
}
```

| 应用场景 | 核心价值 |
|---------|---------|
| Plan&Execute 逐步执行，支持跳过失败步骤的依赖、断点续行 | 执行顺序逻辑与步骤内容解耦，可插入条件跳转、并行等逻辑 |

---

### 18. Mediator 中介者模式

**意图**：通过中介者对象来封装一组对象的交互，减少对象间的直接依赖

**应用场景**：Orchestrator 解耦 Agent 通信

```typescript
class Orchestrator {
  private agents = new Map<string, Agent>();
  private messageLog: Message[] = [];

  register(name: string, agent: Agent) {
    this.agents.set(name, agent);
  }

  // 所有 Agent 只与 Orchestrator 通信
  async dispatch(from: string, msg: Message): Promise<string> {
    this.messageLog.push({ from, ...msg, ts: Date.now() });

    if (msg.type === 'search_needed')
      return this.agents.get('searcher')!.run(msg.query);
    if (msg.type === 'code_needed')
      return this.agents.get('coder')!.run(msg.spec);
    if (msg.type === 'review_needed')
      return this.agents.get('critic')!.run(msg.content);

    throw new Error(`Unknown message type: ${msg.type}`);
  }
}

// SearchAgent 需要 CodeAgent 帮忙时：
// 错误做法: codeAgent.run(...)      // 直接耦合
// 正确做法: orchestrator.dispatch("searcher", { type:"code_needed", ... })
```

| 应用场景 | 核心价值 |
|---------|---------|
| AutoGen GroupChat、CrewAI Process，防止 Agent 形成意大利面式直接调用 | N 个 Agent 互相通信从 O(N²) 条链路降为 O(N)，新增 Agent 只需向中介者注册 |

---

### 19. Memento 备忘录模式

**意图**：在不破坏封装性的前提下保存并恢复对象状态

**应用场景**：Agent 执行快照与断点恢复

```typescript
class AgentMemento {
  private constructor(
    private readonly _state: AgentState,
    private readonly _step: number,
    private readonly _ts: number
  ) {}

  static create(state: AgentState, step: number): AgentMemento {
    return new AgentMemento(deepClone(state), step, Date.now());
  }
  get state() { return deepClone(this._state); }
  get step()  { return this._step; }
}

class LongRunningAgent {
  private state: AgentState = { memory: [], toolCalls: [], plan: [] };
  private step = 0;
  private checkpoints: AgentMemento[] = [];

  save(): AgentMemento {
    const m = AgentMemento.create(this.state, this.step);
    this.checkpoints.push(m);
    return m;
  }
  restore(m: AgentMemento) {
    this.state = m.state;
    this.step  = m.step;
  }
}

// 每 10 步自动存档，出错时恢复最近检查点
for (let i = 0; i < totalSteps; i++) {
  if (i % 10 === 0) agent.save();
  try { await agent.runStep(); }
  catch(e) {
    agent.restore(checkpoints.at(-1)!);
    await notifyAndRetry(e);
  }
}
```

| 应用场景 | 核心价值 |
|---------|---------|
| Long-running Agent（深度研究/代码生成）的 Checkpoint 机制，任务失败后断点续行 | 耗时任务出错后从中间状态恢复，避免重跑所有步骤 |

---

### 20. State 状态模式

**意图**：对象内部状态改变时改变其行为，使其看起来修改了所属类

**应用场景**：Agent 生命周期状态机

```typescript
type Status = 'idle' | 'planning' | 'executing' | 'reflecting' | 'waiting' | 'error';

class StatefulAgent {
  private _status: Status = 'idle';
  private statusListeners: ((s: Status) => void)[] = [];

  get status() { return this._status; }
  private set status(s: Status) {
    this._status = s;
    this.statusListeners.forEach(fn => fn(s));
  }

  async run(task: string) {
    this.status = 'planning';
    const plan = await this.planner.plan(task);

    this.status = 'executing';
    let result: string;
    try {
      result = await this.executor.run(plan);
    } catch(e) {
      this.status = 'error';
      await this.errorHandler.handle(e);
      return;
    }

    this.status = 'reflecting';
    const refined = await this.critic.refine(result);

    this.status = 'idle';
    return refined;
  }

  interrupt() {
    if (this._status === 'executing') {
      this.executor.cancel();
      this.status = 'idle';
    }
  }
}
```

| 应用场景 | 核心价值 |
|---------|---------|
| Agent Dashboard 实时展示状态（规划中/执行中/思考中），不同状态响应不同操作 | 状态转换逻辑集中管理，避免散落各处的 if/else |

---

### 21. Template Method 模板方法模式

**意图**：在父类中定义算法骨架，将某些步骤延迟到子类实现

**应用场景**：固化 Agent 执行骨架

```typescript
abstract class BaseAgent {
  // 模板方法：固定执行骨架，不可重写
  async run(task: string): Promise<string> {
    await this.preProcess(task);
    const perception = await this.perceive(task);
    const thought    = await this.think(perception);
    const action     = await this.act(thought);
    await this.memorize(task, action.result);
    await this.postProcess(action.result);
    return action.result;
  }

  // 抽象方法：子类必须实现
  abstract think(p: Perception): Promise<Thought>;
  abstract act(t: Thought): Promise<Action>;

  // 钩子方法：有默认实现
  async perceive(task: string): Promise<Perception> {
    return { task, timestamp: Date.now() };
  }
  async memorize(task: string, result: string) {
    await vectorDB.upsert(task, result);
  }
  async preProcess(task: string)  { /* noop */ }
  async postProcess(result: string) { /* noop */ }
}

class ReActAgent extends BaseAgent {
  async think(p: Perception): Promise<Thought> {
    return { plan: await llm.complete("Think step by step: " + p.task) };
  }
  async act(t: Thought): Promise<Action> {
    const tool = selectTool(t.plan);
    return tool.run(t.plan);
  }
}
```

| 应用场景 | 核心价值 |
|---------|---------|
| 所有 Agent 共享 perceive→think→act→memorize 骨架，不同 Agent 只重写核心步骤 | 框架级代码（日志/指标/错误处理）只写一次，新增 Agent 类型只需实现两个方法 |

---

### 22. Visitor 访问者模式

**意图**：在不修改元素类的前提下，为其添加新操作

**应用场景**：分析执行计划不修改步骤类

```typescript
interface PlanStep {
  id: string;
  accept(visitor: PlanVisitor): void;
}

interface PlanVisitor {
  visitToolCall(step: ToolCallStep): void;
  visitLLMCall(step: LLMCallStep): void;
  visitParallel(step: ParallelStep): void;
}

// 具体访问者 1：估算成本
class CostEstimator implements PlanVisitor {
  totalUSD = 0;
  visitToolCall(s) { this.totalUSD += s.estimatedMs * 0.00001; }
  visitLLMCall(s)  { this.totalUSD += s.tokens * 0.000003; }
  visitParallel(s) { s.children.forEach(c => c.accept(this)); }
}

// 具体访问者 2：安全审计
class SecurityAuditor implements PlanVisitor {
  risks: string[] = [];
  visitToolCall(s) {
    if (s.tool === 'shell') this.risks.push("Shell exec detected");
  }
  visitLLMCall(s)  { /* check prompt injection patterns */ }
  visitParallel(s) { s.children.forEach(c => c.accept(this)); }
}

// 执行前分析
const plan = await agent.generatePlan(task);
const cost  = new CostEstimator();
const audit = new SecurityAuditor();
plan.steps.forEach(s => { s.accept(cost); s.accept(audit); });

if (audit.risks.length > 0) throw new Error("Plan blocked: " + audit.risks);
if (cost.totalUSD > 5) await confirmWithUser(cost.totalUSD);
```

| 应用场景 | 核心价值 |
|---------|---------|
| 执行前对计划做成本估算 / Token 预算检查 / 依赖图分析 / 安全审计 | 对同一执行计划进行多种分析，各自独立实现，不修改任何 Step 类定义 |

---

### 23. Interpreter 解释器模式

**意图**：为语言定义文法，并构建解释器来解释该语言中的句子

**应用场景**：Prompt 模板动态解析渲染

```typescript
// Prompt 模板 DSL 语法：
// {{variable}}          - 变量替换
// {{#if condition}}...{{/if}} - 条件块
// {{#each list}}...{{/each}}  - 循环块
// {{>partial_name}}      - 引用子模板

class PromptInterpreter {
  private partials = new Map<string, string>();

  addPartial(name: string, template: string) {
    this.partials.set(name, template);
  }

  interpret(template: string, ctx: Record<string, any>): string {
    let result = template;
    // 1. 引用子模板
    result = result.replace(/\{\{>(\w+)\}\}/g,
      (_, name) => this.interpret(this.partials.get(name) ?? '', ctx));
    // 2. 条件块
    result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, cond, body) => ctx[cond] ? this.interpret(body, ctx) : '');
    // 3. 循环块
    result = result.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (_, list, body) => (ctx[list] as any[])
        .map(item => this.interpret(body, { ...ctx, this: item }))
        .join('\n'));
    // 4. 变量替换
    result = result.replace(/\{\{(\w+)\}\}/g,
      (_, key) => String(ctx[key] ?? ''));
    return result;
  }
}

const interpreter = new PromptInterpreter();
interpreter.addPartial('tool_list', '{{#each tools}}- {{this.name}}: {{this.desc}}\n{{/each}}');

const prompt = interpreter.interpret(`
You are {{role}}.
{{#if hasTools}}Available tools:\n{{>tool_list}}{{/if}}
Task: {{task}}
`, { role: 'researcher', hasTools: true, tools, task: userInput });
```

| 应用场景 | 核心价值 |
|---------|---------|
| 动态 Prompt 模板系统，条件渲染工具列表 / 历史记忆 / 角色设定 | Prompt 逻辑与代码分离，非工程师也可编辑模板，支持版本管理和 A/B 测试 |

---

## 总结

| 分类 | 模式 | Agent 应用场景 |
|-----|------|--------------|
| 创建型 | Singleton | 全局 LLM Client |
| 创建型 | Factory Method | 动态实例化 Agent |
| 创建型 | Abstract Factory | 切换 LLM 厂商整套 Agent |
| 创建型 | Builder | 链式配置 Agent 参数 |
| 创建型 | Prototype | 克隆 Agent 快速派生 |
| 结构型 | Adapter | 统一封装异构工具 API |
| 结构型 | Facade | 简化 Agent 系统入口 |
| 结构型 | Proxy | 透明拦截 LLM 调用 |
| 结构型 | Decorator | 动态叠加 Agent 能力 |
| 结构型 | Composite | 树状 Multi-Agent |
| 结构型 | Bridge | 策略与 LLM 正交扩展 |
| 结构型 | Flyweight | 共享 Prompt 模板 |
| 行为型 | Strategy | 运行时切换推理策略 |
| 行为型 | Observer | Agent 事件总线 |
| 行为型 | Chain of Responsibility | Middleware Pipeline |
| 行为型 | Command | 可撤销工具调用 |
| 行为型 | Iterator | 遍历执行计划 |
| 行为型 | Mediator | Orchestrator 解耦通信 |
| 行为型 | Memento | 断点恢复 |
| 行为型 | State | Agent 状态机 |
| 行为型 | Template Method | 固化执行骨架 |
| 行为型 | Visitor | 分析执行计划 |
| 行为型 | Interpreter | Prompt 模板解析 |
