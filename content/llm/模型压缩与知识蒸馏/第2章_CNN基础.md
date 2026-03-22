---
title: 第2章 CNN基础
---

# 第 2 章 CNN基础

本章为后续模型压缩章节奠定理论基础，系统介绍卷积神经网络的核心概念、计算原理与经典架构。

## 2.1 卷积神经网络概述

### 2.1.1 什么是CNN

卷积神经网络（Convolutional Neural Network, CNN）是一种专门用于处理具有网格结构数据的深度学习模型，在图像识别、目标检测、语义分割等计算机视觉任务中取得了突破性成果。

CNN的核心思想：
- **局部连接**：每个神经元只与局部区域连接，减少参数量
- **权值共享**：同一特征图使用相同的卷积核，大幅降低参数
- **平移等变性**：卷积操作对输入的平移具有等变性

### 2.1.2 CNN的基本组件

| 组件 | 作用 | 参数特点 |
|-----|------|---------|
| 卷积层（Conv） | 特征提取 | 参数量 = K×K×C_in×C_out |
| 池化层（Pooling） | 降维、增强不变性 | 无参数 |
| 批归一化层（BN） | 加速训练、稳定收敛 | 2×C参数（γ, β） |
| 激活函数（ReLU等） | 引入非线性 | 无参数 |
| 全连接层（FC） | 分类/回归 | 参数量 = 输入维度×输出维度 |

## 2.2 卷积运算详解

### 2.2.1 标准卷积

标准卷积的计算过程：

```
输出尺寸 = (输入尺寸 - 卷积核尺寸 + 2×填充) / 步长 + 1
```

**计算量（FLOPs）**：
```
FLOPs = 2 × K² × C_in × C_out × H_out × W_out
```

**参数量**：
```
Params = K² × C_in × C_out
```

### 2.2.2 深度可分离卷积

深度可分离卷积将标准卷积分解为两步：

1. **Depthwise卷积**：每个输入通道单独卷积
   - 参数量：K² × C_in
   - 计算量：2 × K² × C_in × H × W

2. **Pointwise卷积**：1×1卷积融合通道信息
   - 参数量：C_in × C_out
   - 计算量：2 × C_in × C_out × H × W

**总计算量对比**：

| 卷积类型 | 计算量 | 相对标准卷积 |
|---------|-------|-------------|
| 标准卷积 | 2×K²×C_in×C_out×H×W | 1.0x |
| 深度可分离卷积 | 2×(K²+C_out)×C_in×H×W | 约 1/K² |

以3×3卷积为例，深度可分离卷积可减少约8-9倍计算量。

### 2.2.3 分组卷积

将输入通道和输出通道分成G组，每组独立卷积：

```
参数量 = K² × (C_in/G) × (C_out/G) × G = K² × C_in × C_out / G
```

特殊情况：
- G=1：标准卷积
- G=C_in：深度卷积（Depthwise Convolution）

## 2.3 经典CNN架构

### 2.3.1 架构演进时间线

```
LeNet(1998) → AlexNet(2012) → VGG(2014) → GoogLeNet(2014) 
                                         ↓
                              ResNet(2015) → DenseNet(2017)
                                         ↓
                              MobileNet(2017) → EfficientNet(2019)
```

### 2.3.2 主流架构对比

| 模型 | 参数量 | FLOPs | ImageNet Top-1 | 核心创新 |
|-----|-------|-------|---------------|---------|
| VGG-16 | 138M | 15.5G | 71.5% | 小卷积核堆叠 |
| ResNet-50 | 25.6M | 4.1G | 76.1% | 残差连接 |
| ResNet-152 | 60.2M | 11.6G | 78.3% | 深层残差 |
| MobileNetV2 | 3.4M | 300M | 72.0% | 倒置残差+线性瓶颈 |
| EfficientNet-B0 | 5.3M | 390M | 77.1% | 复合缩放 |

### 2.3.3 ResNet残差结构

残差连接解决了深层网络的退化问题：

```python
# 标准残差块
class BasicBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        
        # 下采样分支
        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)  # 残差连接
        return F.relu(out)
```

## 2.4 模型复杂度分析

### 2.4.1 参数量计算

| 层类型 | 参数量公式 | 示例（典型配置） |
|-------|-----------|----------------|
| 卷积层 | K²×C_in×C_out + C_out(BN) | 3×3×64×128 = 73,728 |
| 全连接层 | in_features × out_features | 512×1000 = 512,000 |
| BN层 | 2×C（γ, β） | 2×128 = 256 |
| 注意力(SE) | 2×C²/r | 2×128²/16 = 2,048 |

### 2.4.2 计算量分析

```python
from thop import profile
import torchvision.models as models

model = models.resnet50()
input = torch.randn(1, 3, 224, 224)
flops, params = profile(model, inputs=(input,))
print(f'FLOPs: {flops/1e9:.2f}G')
print(f'Params: {params/1e6:.2f}M')
# 输出: FLOPs: 4.12G, Params: 25.56M
```

### 2.4.3 内存占用估算

训练时内存占用估算：

```
总内存 ≈ 模型参数 + 梯度 + 优化器状态 + 激活值
       ≈ 2×P + 2×P + 4×P (Adam) + 激活值
       ≈ 8×P + 激活值
```

其中P为参数量（FP32）。

## 2.5 CNN与模型压缩的关系

理解CNN的计算原理是进行模型压缩的基础：

| 压缩技术 | 依赖的CNN知识 |
|---------|-------------|
| 通道剪枝 | 卷积通道维度、BN层γ参数 |
| 量化 | 数值表示、计算精度 |
| NAS | 搜索空间设计、架构评估 |
| 知识蒸馏 | 特征表示、注意力机制 |

---

> **本章小结**
> 
> 本章介绍了CNN的基础知识，包括卷积运算原理、经典架构演进、参数量与计算量分析。这些知识是理解后续模型压缩技术的必要前提。深度可分离卷积、分组卷积等高效计算方式本身也是一种"架构级压缩"。
