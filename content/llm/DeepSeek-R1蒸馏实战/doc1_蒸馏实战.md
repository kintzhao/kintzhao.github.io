---
title: 第1章 DS模型蒸馏实战
source: doc1_蒸馏实战.docx
---

# 第1章 DS模型蒸馏实战

本章提供端到端的蒸馏实战操作指南，涵盖完整代码示例与实验配置。

---

## 1.1 实战目标

本实战以 DeepSeek-R1-Distill-Qwen-7B 为对标，从头完成以下流程：

1. 加载教师模型（DeepSeek-R1）并采样推理数据
2. 对学生模型（Qwen2.5-7B-Instruct）执行 SFT 蒸馏训练
3. 评估蒸馏前后在数学推理任务上的性能差异

---

## 1.2 环境快速确认

```bash
# 验证 GPU 可用性
python -c "import torch; print(torch.cuda.get_device_name(0))"

# 安装核心依赖
pip install transformers==4.46.0 trl==0.12.0 accelerate deepspeed
pip install vllm==0.6.0  # 用于教师模型推理加速
```

---

## 1.3 数据采样——从教师模型生成 CoT 样本

使用 vLLM 对 DeepSeek-R1 进行高并发推理，生成包含 `<think...` 标签的思维链数据：

```python
from vllm import LLM, SamplingParams

llm = LLM(
    model='deepseek-ai/DeepSeek-R1',
    tensor_parallel_size=4,   # 4×A100
    max_model_len=16384,
)

sampling_params = SamplingParams(
    temperature=0.6,
    top_p=0.95,
    max_tokens=8192,
)

prompts = ["<｜User｜>求解方程 x²-5x+6=0<｜Assistant｜>"]
outputs = llm.generate(prompts, sampling_params)

for out in outputs:
    print(out.outputs[0].text)
```

---

## 1.4 学生模型 SFT 蒸馏训练

使用 TRL 的 SFTTrainer 对 Qwen2.5-7B 进行监督微调，输入为教师模型生成的 CoT 数据：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

model = AutoModelForCausalLM.from_pretrained(
    'Qwen/Qwen2.5-7B-Instruct',
    torch_dtype='bfloat16',
    attn_implementation='flash_attention_2',
)

dataset = load_dataset('json', data_files='distill_data.jsonl')['train']

config = SFTConfig(
    output_dir='./distill_output',
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=5e-5,
    bf16=True,
    max_seq_length=8192,
    logging_steps=10,
    save_steps=500,
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=config,
)
trainer.train()
```

---

## 1.5 DeepSpeed ZeRO-3 配置（多卡训练）

```json
// ds_config.json
{
  "zero_optimization": {
    "stage": 3,
    "offload_optimizer": {"device": "cpu"},
    "offload_param": {"device": "cpu"}
  },
  "bf16": {"enabled": true},
  "train_batch_size": "auto"
}
```

```bash
# 启动训练
deepspeed --num_gpus=4 train.py --deepspeed ds_config.json
```

---

## 1.6 模型推理验证

```python
from transformers import pipeline

pipe = pipeline(
    'text-generation',
    model='./distill_output/final',
    torch_dtype='bfloat16',
    device_map='auto'
)

result = pipe(
    "<｜User｜>计算 15 的阶乘<｜Assistant｜>",
    max_new_tokens=2048,
    do_sample=False
)
print(result[0]['generated_text'])
```

---

## 1.7 实战注意事项

- 教师模型推理时建议使用 `temperature=0.6`，避免生成过于随机或过于确定的 CoT
- SFT 训练中 `max_seq_length` 应覆盖 95% 以上样本长度，过短会截断推理步骤
- 使用 Flash Attention 2 可将显存占用降低约 30%，强烈推荐开启
- 蒸馏数据中 `<think` 标签内的推理过程是关键监督信号，不可丢弃
