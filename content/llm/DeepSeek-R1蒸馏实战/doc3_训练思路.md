---
title: 推理大模型主流训练思路介绍
source: doc3_训练思路.docx
---

# 第3章：推理大模型主流训练思路介绍

本章系统梳理推理增强型大语言模型的主流训练范式，为理解 DeepSeek R1 的技术路线奠定基础。

---

## 3.1 推理能力的本质

推理（Reasoning）能力是指模型对复杂问题进行多步骤逻辑分析、规划与求解的能力，包括数学推理、代码生成、科学问答等。与记忆不同，推理需要模型具备泛化的逻辑结构。

---

## 3.2 思维链（Chain-of-Thought）训练

CoT 训练通过在训练数据中显式包含推理过程，使模型学会边想边答。

| CoT 变体 | 核心思想 |
|---------|---------|
| Standard CoT | 训练数据包含逐步推理过程，监督微调 |
| Zero-shot CoT | 推理时添加 "Let us think step by step" 提示词 |
| Self-consistency | 多次采样 CoT，取多数答案作为最终结果 |
| Tree of Thought (ToT) | 以树状结构探索多条推理路径，回溯选优 |
| Program of Thought | 将推理步骤转换为可执行代码进行验证 |

---

## 3.3 基于强化学习的训练（RLHF / RLVR）

强化学习范式通过奖励信号对模型输出进行优化，是 DeepSeek-R1-Zero 的核心训练方法：

### 3.3.1 RLHF（人类反馈强化学习）

- 训练奖励模型（Reward Model）对人类偏好打分
- 使用 PPO 算法以奖励模型为信号优化语言模型
- 代表作：InstructGPT, ChatGPT, Llama 2 Chat

### 3.3.2 GRPO（Group Relative Policy Optimization）

DeepSeek 提出的改进算法，相比 PPO 无需独立价值网络，训练更稳定：

```python
# GRPO 核心思想伪代码
for question in math_dataset:
    # 对同一问题采样 G 个输出
    outputs = [model.generate(question) for _ in range(G)]
    
    # 计算每个输出的奖励（基于规则：答案正确=+1, 格式正确=+0.1）
    rewards = [reward_fn(o, answer) for o in outputs]
    
    # 归一化奖励，计算相对优势
    advantages = normalize(rewards)
    
    # 使用 PPO-clip 风格更新策略
    loss = -mean(advantages * log_prob(outputs))
    optimizer.step(loss)
```

---

## 3.4 DeepSeek-R1 的四阶段训练流程

1. **冷启动 SFT**：用少量高质量 CoT 数据（数千条）微调基础模型，帮助模型建立输出格式
2. **推理导向 RL**：以 GRPO 在大规模数学/代码问题上进行强化学习，激发深度推理
3. **拒绝采样 + SFT**：从 RL 模型采样高质量样本，过滤低质答案，混合通用数据再次 SFT
4. **对齐 RL**：加入人类偏好奖励信号，提升模型安全性与有用性

---

## 3.5 奖励设计原则

DeepSeek-R1 使用基于规则（Rule-based）的奖励，避免奖励模型的幻觉问题：

- **准确性奖励**：数学题答案正确得 +1，错误得 -1；代码题通过测试用例得分
- **格式奖励**：输出包含 `<think...` 结构得额外分，鼓励显式推理
- **语言一致性惩罚**：推理语言与问题语言不一致时施加惩罚

---

## 3.6 训练范式对比

| 训练方法 | 优劣分析 |
|---------|---------|
| 纯 SFT | 简单高效，但受限于训练数据质量和多样性上限 |
| RLHF (PPO) | 效果好，但需要大量人类标注和稳定奖励模型 |
| GRPO (Rule-based) | 无需人类标注，稳定高效，适合可验证任务（数学/代码） |
| 蒸馏 SFT | 成本最低，适合资源受限场景，效果接近教师模型 |
