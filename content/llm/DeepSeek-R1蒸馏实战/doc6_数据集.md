---
title: 模型蒸馏数据集准备与数据清洗
source: doc6_数据集.docx
---

# 第6章：模型蒸馏数据集准备与数据清洗

高质量的训练数据是蒸馏成功的关键。本章介绍数据采集、清洗和格式化的完整流程。

---

## 6.1 数据来源策略

蒸馏数据可通过以下三种途径获取：

| 数据来源 | 优劣分析 |
|---------|---------|
| DeepSeek 官方开源数据（推荐） | 80万条高质量 CoT，直接可用，质量最高 |
| 通过 API 自行采样 | 可定制化领域数据，成本较高（约 $0.001/千 token） |
| 本地部署教师模型采样 | 一次性成本高，后续免费，适合大规模数据需求 |

---

## 6.2 下载官方蒸馏数据集

```python
from datasets import load_dataset

# 加载官方 80 万条蒸馏数据
dataset = load_dataset(
    'deepseek-ai/DeepSeek-R1-Data',
    split='train'
)

print(f'数据集大小: {len(dataset)} 条')
print(f'字段: {dataset.column_names}')
print(dataset[0])  # 查看样本格式
```

---

## 6.3 自定义数据采样流程

针对特定领域（如金融、医疗、法律）需自行采样：

```python
import json
from openai import OpenAI

# DeepSeek API 兼容 OpenAI 格式
client = OpenAI(
    api_key='your-deepseek-api-key',
    base_url='https://api.deepseek.com/v1'
)

def sample_cot(question: str) -> dict:
    response = client.chat.completions.create(
        model='deepseek-reasoner',  # R1 推理模型
        messages=[{"role": "user", "content": question}],
        max_tokens=8192,
    )
    reasoning = response.choices[0].message.reasoning_content
    answer = response.choices[0].message.content
    return {
        'question': question,
        'reasoning': reasoning,
        'answer': answer,
        'full_output': f'<think\n{reasoning}\n</think\n\n{answer}'
    }

# 批量采样
questions = open('questions.txt').readlines()
results = [sample_cot(q.strip()) for q in questions]

with open('distill_data_raw.jsonl', 'w') as f:
    for r in results:
        f.write(json.dumps(r, ensure_ascii=False) + '\n')
```

---

## 6.4 数据清洗流程

原始采样数据需经过以下清洗步骤：

### 6.4.1 过滤无效样本

```python
def is_valid_sample(sample: dict) -> bool:
    reasoning = sample.get('reasoning', '')
    answer = sample.get('answer', '')
    
    # 过滤1：推理过程过短（<100 tokens）
    if len(reasoning.split()) < 100:
        return False
    
    # 过滤2：推理过程包含乱码或重复
    if reasoning.count('\n\n\n') > 5:
        return False
    
    # 过滤3：答案为空
    if not answer.strip():
        return False
    
    # 过滤4：语言不一致（中文问题配英文回答等）
    # 可使用 langdetect 库检测
    
    return True

clean_data = [s for s in raw_data if is_valid_sample(s)]
print(f'清洗后保留: {len(clean_data)}/{len(raw_data)} ({len(clean_data)/len(raw_data)*100:.1f}%)')
```

### 6.4.2 答案正确性验证（数学数据）

```python
import re
from sympy import sympify, simplify

def verify_math_answer(answer: str, gold: str) -> bool:
    """提取并验证数学答案"""
    # 提取 \boxed{} 中的答案
    match = re.search(r'\\boxed\{([^}]+)\}', answer)
    if not match:
        return False
    predicted = match.group(1)
    try:
        return simplify(sympify(predicted) - sympify(gold)) == 0
    except:
        return predicted.strip() == gold.strip()
```

---

## 6.5 数据格式化

将清洗后的数据转换为 Qwen/LLaMA 对话格式：

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen2.5-7B-Instruct')

def format_sample(sample: dict) -> dict:
    messages = [
        {"role": "user", "content": sample['question']},
        {"role": "assistant", "content": sample['full_output']}
    ]
    # 应用对话模板
    text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=False
    )
    return {'text': text, 'token_count': len(tokenizer.encode(text))}

formatted = [format_sample(s) for s in clean_data]

# 过滤超长样本（> 8192 tokens）
formatted = [s for s in formatted if s['token_count'] <= 8192]
print(f'最终数据量: {len(formatted)} 条')
```

---

## 6.6 数据分析与统计

```python
import numpy as np
import matplotlib.pyplot as plt

lengths = [s['token_count'] for s in formatted]

print(f'平均长度: {np.mean(lengths):.0f} tokens')
print(f'中位数: {np.median(lengths):.0f} tokens')
print(f'95分位: {np.percentile(lengths, 95):.0f} tokens')
print(f'最大长度: {max(lengths)} tokens')

# 可视化长度分布
plt.hist(lengths, bins=50)
plt.xlabel('Token Length')
plt.ylabel('Count')
plt.title('Distillation Data Length Distribution')
plt.savefig('data_length_dist.png')
```

---

## 6.7 数据集最终结构

| 数据子集 | 说明 |
|---------|------|
| 数学推理（Math） | MATH, AMC, AIME, 竞赛题，约 40 万条 |
| 代码生成（Code） | LeetCode, Codeforces, 算法题，约 20 万条 |
| 科学推理（Science） | 物理、化学、生物、GPQA，约 10 万条 |
| 通用推理（General） | 逻辑题、阅读理解等，约 10 万条 |
| **总计** | 约 80 万条，平均 2800 tokens/条 |
