---
title: 第7章 蒸馏前后模型性能对比
source: doc7_性能对比.docx
---

# 第7章 蒸馏前后模型性能对比

本章综合前述章节的工程实践，执行完整蒸馏流程，并对蒸馏前后模型进行全面性能评估。

---

## 7.1 完整实战流程概览

1. **第一步**：准备 80 万条 CoT 蒸馏数据（见第6章）
2. **第二步**：配置 DeepSpeed ZeRO-3 + Flash Attention 2 训练环境（见第5章）
3. **第三步**：执行 3 Epoch SFT 蒸馏训练（约 72 小时 / 4×A100）
4. **第四步**：在 MATH-500、AIME、LiveCodeBench 等基准上评估
5. **第五步**：分析蒸馏前后差异，优化训练参数

---

## 7.2 完整训练脚本

```python
# train_distill.py
import os
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset
import torch

MODEL_ID = 'Qwen/Qwen2.5-7B-Instruct'
DATA_PATH = './data/distill_train.jsonl'
OUTPUT_DIR = './output/deepseek-r1-distill-qwen-7b-custom'

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
    attn_implementation='flash_attention_2',
    use_cache=False,  # 训练时关闭 KV Cache
)

dataset = load_dataset('json', data_files=DATA_PATH, split='train')

config = SFTConfig(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=16,
    gradient_checkpointing=True,
    learning_rate=5e-5,
    lr_scheduler_type='cosine',
    warmup_ratio=0.05,
    bf16=True,
    max_seq_length=8192,
    dataset_text_field='text',
    logging_steps=10,
    save_steps=200,
    eval_strategy='steps',
    eval_steps=200,
    save_total_limit=3,
    load_best_model_at_end=True,
    report_to='wandb',
)

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    args=config,
)

trainer.train()
trainer.save_model()

# 启动命令
# accelerate launch --config_file accelerate_config.yaml train_distill.py
```

---

## 7.3 评估框架配置

使用 lm-evaluation-harness 进行标准化评估：

```bash
# 安装评估框架
git clone https://github.com/EleutherAI/lm-evaluation-harness
cd lm-evaluation-harness && pip install -e .

# 评估蒸馏前（基础模型）
lm_eval --model hf \
  --model_args pretrained=Qwen/Qwen2.5-7B-Instruct \
  --tasks mathqa,gsm8k,math_500 \
  --batch_size 8 \
  --output_path ./results/baseline

# 评估蒸馏后（蒸馏模型）
lm_eval --model hf \
  --model_args pretrained=./output/deepseek-r1-distill-qwen-7b-custom \
  --tasks mathqa,gsm8k,math_500 \
  --batch_size 8 \
  --output_path ./results/distilled
```

---

## 7.4 蒸馏前后性能对比（参考数据）

以下为 DeepSeek 官方报告的蒸馏版本与基础模型对比数据：

| 模型 | AIME 2024 | MATH-500 | GPQA Diamond | LiveCodeBench |
|-----|-----------|----------|--------------|---------------|
| Qwen2.5-7B-Instruct（蒸馏前） | 13.3% | 75.5% | 33.8% | 23.9% |
| **DeepSeek-R1-Distill-Qwen-7B** | **55.5%** | **92.8%** | **49.1%** | **37.6%** |
| Qwen2.5-14B-Instruct（蒸馏前） | 20.0% | 79.9% | 43.0% | 30.9% |
| **DeepSeek-R1-Distill-Qwen-14B** | **69.7%** | **93.9%** | **59.1%** | **53.1%** |
| DeepSeek-R1-Distill-LLaMA-70B | 70.0% | 94.5% | 65.2% | 57.5% |

---

## 7.5 关键发现分析

1. **AIME 2024（最难数学竞赛）**：7B 蒸馏模型从 13.3% 跃升至 55.5%，提升幅度达 317%，证明 CoT 蒸馏对深度推理任务效果显著。

2. **MATH-500（综合数学）**：从 75.5% 提升至 92.8%，在 7B 模型中达到最优水平，超越所有同规模开源模型。

3. **规模律（Scaling Law）**：蒸馏增益在更大模型（14B、70B）上持续显著，70B 蒸馏版在 AIME 上达 70.0%，接近旗舰级别。

4. **代码能力同步提升**：LiveCodeBench 得分提升约 57%，证明推理能力可跨任务迁移。

---

## 7.6 训练监控指标

```python
# 在 WandB 中关注以下指标

# 1. train/loss：应平稳下降，不出现震荡
# 2. eval/loss：验证集损失，用于判断过拟合
# 3. grad_norm：梯度范数，>10 需降低学习率
# 4. learning_rate：余弦调度，warmup 后线性衰减

# 典型训练曲线（3 Epochs, 80万条数据）
# Epoch 1 end: train_loss ≈ 0.85
# Epoch 2 end: train_loss ≈ 0.72
# Epoch 3 end: train_loss ≈ 0.68
```

---

## 7.7 推理优化与部署

```python
# 使用 vLLM 部署蒸馏模型（高吞吐）
from vllm import LLM, SamplingParams

llm = LLM(
    model='./output/deepseek-r1-distill-qwen-7b-custom',
    tensor_parallel_size=1,
    max_model_len=8192,
    dtype='bfloat16',
)

params = SamplingParams(temperature=0.0, max_tokens=4096)  # 推理时用贪心

outputs = llm.generate(["求解 x³-6x²+11x-6=0"], params)
print(outputs[0].outputs[0].text)

# 量化版本（消费级 GPU）
# llama.cpp 量化命令
# ./quantize ./models/distill-7b-f16.gguf ./models/distill-7b-q4_k_m.gguf Q4_K_M
```

---

## 7.8 蒸馏失败的常见原因

| 失败现象 | 可能原因与解决方案 |
|---------|------------------|
| 模型重复生成内容 | 学习率过高，降至 2e-5；或数据中有大量重复样本 |
| 推理步骤被截断 | max_seq_length 设置过小，增大至 8192 或 16384 |
| 数学性能下降 | 数学数据占比不足，检查数据集分布，增加数学样本 |
| 训练损失不收敛 | 检查数据格式是否正确应用了 chat template |
| GPU 显存 OOM | 开启 gradient_checkpointing 和 CPU offload |
