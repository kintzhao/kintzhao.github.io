---
title: doc5 环境搭建
source: doc5_环境搭建.docx
---

# 第5章：DeepSeek R1 模型蒸馏基本环境搭建
本章提供完整的环境搭建教程，包括硬件选型、系统配置、依赖安装及验证测试。

## 5.1 硬件需求

## 5.2 操作系统与 CUDA

## 5.3 Python 环境配置

## 5.4 核心依赖安装

## 5.5 Accelerate 配置

## 5.6 环境完整性验证

## 5.7 Docker 一键部署方案
对于生产环境，推荐使用官方 Docker 镜像避免依赖冲突：

## 5.8 常见安装问题排查

| 模型规模       | 推荐配置                               |
| ---------- | ---------------------------------- |
| 7B 学生模型训练  | 1×A100 80GB 或 2×A100 40GB（最低配置）    |
| 14B 学生模型训练 | 2×A100 80GB                        |
| 70B 学生模型训练 | 8×A100 80GB 或 4×H100               |
| 消费级 GPU 推理 | RTX 4090 24GB（仅推理 7B 量化版）          |
| 教师模型推理     | 8×A100 80GB（671B MoE 需要约 640GB 显存） |

| # 推荐系统：Ubuntu 22.04 LTS # 检查 CUDA 版本（需 12.1+） nvcc --version nvidia-smi  # 如需安装 CUDA 12.1 wget https://developer.download.nvidia.com/compute/cuda/12.1.0/local_installers/cuda_12.1.0_530.30.02_linux.run sudo sh cuda_12.1.0_530.30.02_linux.run  # 添加环境变量 echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc source ~/.bashrc |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

| # 使用 conda 创建隔离环境 conda create -n deepseek_distill python=3.10 -y conda activate deepseek_distill  # 安装 PyTorch（与 CUDA 12.1 匹配） pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu121  # 验证 PyTorch + CUDA python -c "import torch; print(f'PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}, GPUs: {torch.cuda.device_count()}')" |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| # 核心训练框架 pip install transformers==4.46.0 pip install trl==0.12.0 pip install accelerate==1.0.1 pip install peft==0.13.0  # 分布式训练 pip install deepspeed==0.15.0  # 数据处理 pip install datasets==3.0.0 pip install tokenizers==0.20.0  # 推理加速（教师模型采样） pip install vllm==0.6.0  # Flash Attention 2（显著降低显存） pip install flash-attn==2.6.3 --no-build-isolation  # 量化支持 pip install bitsandbytes==0.44.0 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| # 交互式配置多卡训练 accelerate config  # 或使用预设配置文件 accelerate_config.yaml compute_environment: LOCAL_MACHINE distributed_type: DEEPSPEED num_processes: 4 mixed_precision: bf16 deepspeed_config:   zero_stage: 3   gradient_accumulation_steps: 8 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

| python << 'EOF' import torch import transformers import trl import accelerate import deepspeed import vllm import flash_attn  print(f'✓ PyTorch: {torch.__version__}') print(f'✓ Transformers: {transformers.__version__}') print(f'✓ TRL: {trl.__version__}') print(f'✓ Accelerate: {accelerate.__version__}') print(f'✓ DeepSpeed: {deepspeed.__version__}') print(f'✓ vLLM: {vllm.__version__}') print(f'✓ Flash-Attn: {flash_attn.__version__}') print(f'✓ GPUs: {torch.cuda.device_count()}') print('环境检查全部通过！') EOF |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| # 拉取 NVIDIA PyTorch 官方镜像（内置 CUDA 12.1） docker pull nvcr.io/nvidia/pytorch:24.01-py3  # 启动容器（挂载数据目录） docker run --gpus all -it \   -v /data/models:/models \   -v /data/datasets:/datasets \   --shm-size=64g \   nvcr.io/nvidia/pytorch:24.01-py3 bash  # 容器内安装额外依赖 pip install transformers trl accelerate deepspeed vllm |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| 问题              | 解决方案                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| Flash-Attn 编译失败 | 确保 CUDA 版本与 torch 版本匹配，使用 --no-build-isolation 参数                        |
| DeepSpeed 安装报错  | 先运行 pip install ninja，再重新安装 deepspeed                                    |
| vLLM 无法识别 GPU   | 检查 nvidia-smi 是否正常，确认 CUDA_VISIBLE_DEVICES 设置                            |
| 显存不足 OOM        | 开启 CPU offload 或降低 per_device_batch_size 并增大 gradient_accumulation_steps |
