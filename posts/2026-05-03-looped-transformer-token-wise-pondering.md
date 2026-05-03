---
title: 从 Looped Transformer 到 Token-Wise Pondering
date: 2026-05-03
tags: Research, Pretraining, Pondering
---

Looped Transformer 给了我一个很自然的研究入口：如果模型可以在同一组参数上循环计算，那么额外计算不必被平均地花在每个 token 上。

我目前更关心的问题是：模型能不能在预训练阶段学会决定哪些 token 值得多思考、哪些 token 可以更早停止。这个方向把 architecture、optimization 和 inference efficiency 放在同一张桌子上讨论。

## 当前关键词

- token-wise adaptive depth
- latent Chain-of-Thought pretraining
- differentiable masking
- gated halting and KV reuse
- train-inference consistency

## 一句话目标

让下一代预训练架构不仅更大，而是更会分配计算。
