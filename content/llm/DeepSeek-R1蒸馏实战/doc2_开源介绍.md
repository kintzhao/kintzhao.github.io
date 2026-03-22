---
title: doc2 开源介绍
source: doc2_开源介绍.docx
---

# 第2章：DeepSeek R1 开源情况介绍
本章全面介绍 DeepSeek R1 的开源背景、模型系列、许可证及社区生态。

## 2.1 DeepSeek 公司背景
DeepSeek 由幻方科技于 2023 年成立，专注于大语言模型基础研究。其发布的系列模型在多个国际基准上达到业界顶尖水平，并以全面开源、技术报告详尽著称。DeepSeek-R1 于 2025 年 1 月发布，凭借强化学习驱动的推理能力在全球 AI 社区引发广泛关注。

## 2.2 DeepSeek R1 模型系列

## 2.3 开源许可证

## 2.4 开源资源汇总

## 2.5 核心性能表现
DeepSeek-R1 在多项推理基准上与 OpenAI o1 持平甚至超越：
AIME 2024（数学竞赛）：R1 得分 79.8%，o1 得分 79.2%
MATH-500（数学综合）：R1 得分 97.3%，o1 得分 96.4%
Codeforces 竞赛编程：R1 Elo 2029，超越 96.3% 的人类参赛者
GPQA Diamond（科学推理）：R1 得分 71.5%，o1 得分 75.7%

## 2.6 开源影响与生态
DeepSeek-R1 的开源引发了以下连锁反应：
全球开发者在 24 小时内复现并微调蒸馏版本，社区热度极高。
多个量化版本（GGUF/AWQ/GPTQ）迅速出现，降低部署门槛。
ollama、LM Studio 等本地推理工具在一周内完成适配。
激励 Meta、Mistral 等公司加快开源推理模型的研发节奏。

## 2.7 如何下载模型

| 模型名称                          | 参数量 / 架构特点                  |
| ----------------------------- | --------------------------- |
| DeepSeek-R1-Zero              | 671B MoE，纯 RL 训练，无 SFT 冷启动  |
| DeepSeek-R1                   | 671B MoE，RL + SFT 多阶段训练，旗舰版 |
| DeepSeek-R1-Distill-Qwen-1.5B | 1.5B Dense，蒸馏自 R1，超轻量       |
| DeepSeek-R1-Distill-Qwen-7B   | 7B Dense，蒸馏版本，性价比最高         |
| DeepSeek-R1-Distill-Qwen-14B  | 14B Dense，蒸馏版本，均衡性能         |
| DeepSeek-R1-Distill-Qwen-32B  | 32B Dense，蒸馏版本，接近满血         |
| DeepSeek-R1-Distill-LLaMA-8B  | 8B Dense，LLaMA 架构蒸馏版        |
| DeepSeek-R1-Distill-LLaMA-70B | 70B Dense，最强蒸馏版             |

| DeepSeek-R1 采用 MIT License 开源，允许商业使用、修改和分发。 蒸馏版本（Distill 系列）同样采用 MIT License。 官方蒸馏训练数据集（80万条）以 MIT License 开源。 注意：模型权重中包含的任何第三方数据相关权利需独立评估。 |
| ------------------------------------------------------------------------------------------------------------------------------------------- |

| 资源类型      | 链接 / 说明                                   |
| --------- | ----------------------------------------- |
| 技术论文      | arxiv.org/abs/2501.12948                  |
| 模型权重      | huggingface.co/deepseek-ai                |
| GitHub 仓库 | github.com/deepseek-ai/DeepSeek-R1        |
| 蒸馏训练数据    | HuggingFace: deepseek-ai/DeepSeek-R1-Data |
| API 接口    | platform.deepseek.com（兼容 OpenAI 格式）       |

| # 方法1：使用 huggingface_hub pip install huggingface_hub huggingface-cli download deepseek-ai/DeepSeek-R1-Distill-Qwen-7B \   --local-dir ./models/deepseek-r1-7b  # 方法2：国内镜像（ModelScope） pip install modelscope modelscope download --model deepseek-ai/DeepSeek-R1-Distill-Qwen-7B \   --local_dir ./models/deepseek-r1-7b |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
