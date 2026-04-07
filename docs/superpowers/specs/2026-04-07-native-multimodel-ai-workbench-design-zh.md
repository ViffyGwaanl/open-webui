# 2026-04-07 原生多模型 AI 工作台设计文档

## 状态

本设计已在对话式设计评审中完成确认。待用户审阅本文档后，可进入 implementation planning 阶段。

## 背景

本设计用于回答：当前 `open-webui` 项目是否可以演进为一个满足以下条件的独立 iOS 应用，以及相应的工程实现路线应如何选择：

- 不依赖自建服务端部署
- 使用用户自行填写的 `API key + base URL`
- 支持 `OpenAI`、`Gemini`、`Claude`
- 支持面向 `txt`、`md`、`pdf` 的轻量本地 RAG
- 去掉频道与多人协作能力
- 将多模型对比回答作为核心能力之一

在对项目与参考仓库完成分析后，结论是：`open-webui` 不适合作为目标产品的直接改造基础。它应继续作为产品交互和能力设计参考，而目标产品应以新的原生移动端客户端方式实现。

## 决策摘要

目标产品将采用新的 `React Native + Expo` 原生客户端方案，并按发布级 `v1.0` 产品标准来设计，而不是最小可用原型。

产品的核心定位：

- 原生 AI 工作台
- 本地优先、单用户客户端
- 多模型对比是一级能力
- 支持本地文档导入与轻量本地 RAG
- 不要求用户部署自有后端

核心架构决策：

- 不直接移植 `open-webui` 的前端或后端
- 使用三个原生 provider adapter：`OpenAI`、`Gemini`、`Claude`
- 将聊天生成 provider 与 embedding provider 分离
- 将核心产品数据全部本地持久化
- 单模型 turn 与 compare-mode turn 统一使用同一套内部会话模型
- compare mode 默认共享同一份 retrieval context，以保证跨模型对比公平

平台策略：

- 使用一套共享的跨平台代码基线
- 架构必须对 iOS、iPadOS、Android 保持可移植性
- `v1.0` 的发布级验收必须在 iPhone 与 iPad 上达标
- Android 属于目标产品架构的一部分，但不能因为照顾 Android 而牺牲 Apple 平台首发质量

## 为什么不直接复用 Open WebUI

`open-webui` 本质上是一个浏览器优先加服务端优先的系统。它的前端依赖 SvelteKit 与浏览器运行时假设；它的后端则把路由、文件、检索、socket、频道、认证、工具、终端等能力集中在 FastAPI 生命周期中。这并不是独立原生客户端的正确基础。

此外，`open-webui` 当前的 direct-connections 能力也不是完整的原生 provider 层，而更像是嵌在服务端架构旁边的一条 OpenAI-compatible 直连路径。

因此设计结论是：

- `open-webui` 继续作为产品参考
- 实现从新的原生客户端开始

## 参考项目综合结论

### Cherry Studio

最值得借鉴的点：

- provider 配置与 model 元数据之间的清晰分层
- provider registry 与 normalization 机制
- API host 统一规范化处理
- 模型发现与归一化策略

不适合作为移动端基础的部分：

- Electron 的 main/preload/renderer 结构
- 大量依赖 IPC 的桌面运行时
- 桌面端 knowledge/RAG 与本地 API server 的耦合

### Cherry Studio App

最值得借鉴的点：

- `Expo React Native + SQLite + Drizzle`
- SQLite-backed 的 preference service
- provider service 与标准化 request builder
- 类型化的 streaming event
- iOS 与 Android 上的原生 PDF 文本提取

不适合照搬的部分：

- provider 矩阵过宽
- MCP 与 streamable transport 相关能力
- modern/legacy 双轨 AI 执行路径
- local knowledge/RAG 仍偏脚手架性质，不是完整产品能力

### PaperTok Reader

最值得借鉴的点：

- 轻量本地 RAG DB 结构
- 基于字符与自然边界的 chunking
- 本地索引加外部 embeddings
- hybrid retrieval：FTS 或 LIKE candidate，加向量重排，再做 MMR
- generation provider 与 embedding provider 明确分离

不适合照搬的部分：

- 强依赖 EPUB 与 reader bridge 的结构
- 面向阅读器产品的队列与工具系统
- 产品范围明显比本项目更重

## 产品目标

- 交付一个无需用户部署自有后端即可工作的独立原生客户端
- 保持实现架构是跨平台的，而不是仅面向 Apple 单平台
- 支持高质量的单模型聊天与多模型对比
- 允许用户配置 OpenAI、Gemini、Claude 的官方或自定义 endpoint
- 支持 `txt`、`md`、`pdf` 的本地导入、索引与检索
- 所有会话、compare run、文档、索引与设置均本地持久化
- 提供发布级的 iPhone 与 iPad 使用体验

## 非目标

- 频道
- 多人协作
- 云同步
- 要求用户部署自建后端
- v1.0 中的 MCP 与工具生态
- v1.0 中的 OCR
- 远程共享知识库
- 将分支重新合并回父线程

## v1.0 产品范围

包含：

- 单模型聊天
- compare mode
- 可选 judge summary
- 从任一对比分支继续对话
- `txt`、`md`、`pdf` 的本地文件导入
- 轻量本地 RAG
- 会话导出
- provider 配置中心
- 请求维度的指标与错误呈现
- 本地备份与恢复基础能力

不包含：

- 群组能力
- 协作编辑
- 内建外部工具执行
- 远程同步
- OCR 与扫描件 PDF 理解
- 服务端检索

## 总体架构

产品由六个主要层次组成：

1. `App Shell`
   导航、布局、主题、设备适配、线程列表、compare 工作台、文档库与设置。
2. `Domain Layer`
   线程、turn、compare run、branch response、judge run、document、retrieval context 等 canonical domain models。
3. `Provider Layer`
   OpenAI、Gemini、Claude 的原生 adapter。
4. `Chat Orchestration Layer`
   单模型执行、compare 执行、judge 执行、取消、重试与持久化更新。
5. `RAG Layer`
   文件接入、文本提取、chunking、embeddings、索引、检索与 prompt 注入。
6. `Persistence Layer`
   SQLite 持久化、密钥安全存储、文件持久化、导出与迁移支持。

## 核心领域模型

### Workspace

单用户本地工作区，包含：

- provider profiles
- model metadata cache
- threads
- compare presets
- imported documents
- local RAG index

### Thread

长期存在的对话容器。一个 thread 中既可以包含普通单模型 turn，也可以包含多模型 compare turn。

### Turn

一次用户输入事件。一个 turn 可以以两种方式执行：

- single-model run
- compare run

### CompareRun

Compare run 表示一次用户输入被并发发送给多个模型后的执行单元，保存以下信息：

- selected models
- shared retrieval context
- run state
- per-branch execution state
- aggregate timing and usage
- judge configuration

### BranchResponse

Compare run 内某个模型对应的一条独立结果。每个 branch 保存：

- provider profile
- model id
- streaming state
- raw answer
- usage
- latency
- error state
- continuation lineage

### JudgeRun

对已完成 branches 生成的可选模型比较总结。它不会替代原始回答。

### RetrievalContext

注入到某次 turn 中的 snippets、document references 与 metadata 的集合。在 compare mode 下，默认共享一份 retrieval context。

## 多模型交互模式

产品采用 `可分叉 compare workspace` 作为主要 compare mode。

它具备以下能力：

- 多模型并发执行
- branches 完成后可选生成 judge summary
- 可以从任一 branch 继续对话
- 原 compare run 会作为稳定工件被保留

分支继续规则：

- 用户在某个 branch 上选择 `Continue`
- 系统创建一个 child thread
- child thread 继承父线程从开头到源 compare turn 的历史，再加上所选 branch response
- sibling branches 不会被继承
- 原 compare turn 保持不变

这样可以避免上下文混淆，并形成确定性的 lineage。

## UI 与导航设计

### 主信息架构

- `Threads`
- `Library`
- `Settings`

### Thread Screen

Thread screen 是整个产品的主工作面。

一个 thread 中可以展示：

- 标准单模型回复
- compare-run cards
- child-thread lineage breadcrumbs

### Composer 模式

Composer 支持以下模式控制：

- `Single`
- `Compare`
- `RAG`
- `Judge`

Compare mode 展开后包含：

- target model selection
- compare preset selection
- shared retrieval context toggle
- judge toggle
- judge model selection
- advanced parameters

### Compare 展示方式

默认展示策略：

- 手机：顶部 tabs，一次显示一个 branch
- 平板：多列并排对比
- 所有设备：支持可选 stacked branch view

### Compare Card 内容

- compare run header
- judge summary section
- branch selector 或列布局
- branch status、model、provider、timing 与 usage
- branch actions：continue、retry、copy、export、favorite

### Shared Context 展示

开启 RAG 的 turn 会暴露一个 drawer 或 sheet，显示：

- matched files
- matched snippets
- source page 或 section
- injected context count
- 可排除某些 snippets 后重跑

## Provider 架构

### ProviderPreset

内置一方 presets：

- `OpenAI`
- `Gemini`
- `Claude`

每个 preset 包含：

- 官方默认 base URL
- docs links
- model discovery rules
- auth header rules
- endpoint semantics

### ProviderProfile

用户管理的一条 provider 配置，包含：

- `id`
- `presetType`
- `displayName`
- `baseUrl`
- `apiKeyRef`
- `extraHeaders`
- `enabled`
- `defaultChatRole`
- `defaultEmbeddingRole`
- timestamps

### ModelDescriptor

canonical model metadata，包含：

- provider profile reference
- model id 与 label
- capabilities
- context limits
- streaming support
- reasoning support
- tool support
- JSON mode support
- embedding flag

### Provider Adapters

只实现三个原生 adapters：

- `OpenAIAdapter`
- `GeminiAdapter`
- `ClaudeAdapter`

规则：

- 使用原生 OpenAI 请求语义
- 使用原生 Gemini 请求语义
- 使用原生 Anthropic 请求语义
- 只有当用户显式配置兼容网关时，才允许 compatibility mode

### Canonical Internal Types

- `CanonicalMessage`
- `CanonicalToolCall`
- `CanonicalUsage`
- `CanonicalStreamEvent`
- `CanonicalProviderError`

UI 与 orchestration 层只面向 canonical internal types 工作。

## 模型发现策略

- `OpenAI`：通过 OpenAI-style listing 动态拉取
- `Gemini`：走 Gemini-native model listing
- `Claude`：使用 curated static catalog，并允许手动输入 model id

所有结果都会归一化为同一套 `ModelDescriptor`。

## 密钥存储策略

Provider 元数据可以进入 SQLite，密钥本身不可以。

规则：

- SQLite 只存 `apiKeyRef`
- 安全系统存储保存真实密钥
- 默认导出不包含 secrets
- 日志永远不包含 secrets

## RAG 架构

### 支持的文件类型

- `txt`
- `md`
- `pdf`

### RAG 的明确边界

- 只做本地索引
- 只做本地检索
- embeddings 使用外部能力
- generation 使用外部能力
- v1.0 不做 OCR

### 文件存储策略

导入的源文件保存在应用托管的持久目录中，不放 cache。

### RAG 数据库策略

使用独立本地索引库，不把索引内部结构直接混入主聊天数据库。

### 推荐数据表

`documents`

- source metadata
- storage metadata
- file type
- checksum
- page count
- text length
- import status

`document_texts`

- normalized extracted text
- optional outline data

`document_chunks`

- chunk identity
- document reference
- offsets
- section title
- chunk text
- token estimate
- embedding blob
- embedding dimension
- embedding model id
- embedding provider reference

`document_chunks_fts`

- 用于关键词检索的 SQLite FTS virtual table

`index_jobs`

- document indexing task tracking

### 文本提取

- `txt`：直接读取文本并做编码规范化
- `md`：保留 heading structure，再派生 normalized plain text
- `pdf`：走原生文本提取，尽可能保留页码元数据
- v1.0 不做 OCR fallback

### Chunking

采用轻量结构感知 chunking：

- 优先按 heading 与 paragraph boundary 切分
- 其次在目标长度附近找自然边界
- 最后才退化为 sliding window

默认参数：

- `targetChars = 900`
- `maxChars = 1400`
- `minChars = 220`
- `overlapChars = 120`

### Embeddings

Embeddings 使用外部能力，并且与 generation 独立配置。

规则：

- chat provider 与 embedding provider 是两个概念
- embedding model 选择必须显式
- embedding 失败不能阻断普通聊天

### Retrieval

默认检索流水线：

1. FTS 或 LIKE candidate generation
2. query embedding
3. vector reranking
4. MMR deduplication
5. top-k snippet assembly
6. prompt injection

在 compare mode 下，所有 branches 默认共享同一份 retrieval context。

## 错误处理与恢复

### Provider 错误

错误必须被标准化并归类为可操作类别：

- auth
- quota
- timeout
- model unavailable
- malformed endpoint
- unsupported capability
- transient network

### Compare 失败行为

- 单个 failing branch 不会让整个 compare run 失败
- 支持 branch-level retry
- 支持 compare-run-level rerun
- judge 可以在部分 branches 成功的情况下执行

### 持久化恢复

应用重启后：

- incomplete compare runs 会收敛为可恢复的一致状态
- indexing jobs 会收敛为安全的 resumable 或 failed 状态
- thread lineage 保持完整

## 质量目标

### 功能质量

- compare mode 必须是正式稳定能力
- branch continuation 必须是 production-supported
- local RAG 必须在所有支持文件类型上可用

### 可靠性

- 单个 branch 失败不能拖死整次 compare run
- crash 或 kill 之后不能出现断裂 lineage
- 索引任务中断后不能破坏索引元数据

### 性能

- 4 路 compare streaming 时 UI 仍保持流畅
- 大线程与长消息历史仍然可用
- indexing 不会完全冻结前台体验

### 产品完成度

- iPhone 与 iPad 都是明确目标平台
- provider 配置对非专家用户也可理解
- compare mode 在手机上必须可用，而不是只适合平板

## 测试策略

### 单元测试

覆盖：

- provider payload transforms
- capability gating
- compare state machine
- chunking
- retrieval ranking 与 MMR
- lineage construction
- error normalization

### 集成测试

覆盖：

- compose 到 compare-run persistence
- RAG retrieval 到 prompt injection
- branch continuation 到 child-thread creation
- secure key lookup
- file import 到 extract 到 chunk 到 embed 到 index

### UI 测试

覆盖：

- single send
- compare send
- branch switching
- judge rendering
- branch continuation
- file import
- RAG evidence review
- error handling flows

### 发布前人工 QA

必须覆盖的设备：

- small iPhone
- large iPhone
- iPad portrait
- iPad landscape

必须覆盖的场景：

- 首次 provider 配置
- 单模型聊天
- 三模型 compare
- compare 加 judge
- compare 加 RAG
- 从 branch 继续对话
- PDF 导入与索引
- kill 进程再恢复
- offline 与 timeout 处理

## 安全与隐私要求

- API keys 不能明文存 SQLite
- 默认导出不包含 secrets
- 日志不包含 secrets 和敏感原始 payload
- 导入文件默认仅保存在本地，只有在显式使用 embeddings 或 generation 时，相关片段才会发送给外部 provider
- 产品文档必须明确说明：开启 RAG 后，被索引命中的 snippets 可能会发送给外部模型 provider

## App Review 与发布约束

App Review 不能假设审核员拥有自己的 AI provider key。

发布计划必须包含以下两者之一：

- 一条 review-safe 的 demo provider 路径
- 或者明确的 reviewer setup notes 与测试凭据

这属于 release blocker，而不是 post-launch issue。

## 交付阶段

这不是 MVP 的拆分，而是发布级产品的施工顺序。

### Phase 1: Platform Core

- app shell
- local DBs
- secure storage
- provider center
- single-model chat
- canonical stream events
- thread persistence

### Phase 2: Compare Core

- compare run orchestration
- branch responses
- judge runs
- compare UI
- branch continuation
- compare presets
- export

### Phase 3: Local RAG

- file import
- text extraction
- chunking
- embedding pipeline
- local index DB
- hybrid retrieval
- shared retrieval context injection
- library UI

### Phase 4: Polish and Release

- iPad optimization
- performance work
- recovery hardening
- QA automation
- backup and restore
- review material preparation
- release regression

## 被否决的替代方案

### 直接改造 Open WebUI

否决原因：它在结构上是浏览器加服务端中心化系统，拆除成本高于从头建立正确的客户端架构。

### Flutter-first 实现

不作为主路线。技术上可行，但最有价值的参考实现主要来自 React Native 体系，provider 与 streaming 相关工程经验也更直接可迁移。

### 先做聊天产品，后补 compare mode

否决原因：compare mode 会实质性改变 domain model、orchestration、persistence 与 UI。后挂会导致大量返工。

## 最终产品定位

这个产品是一个 `local-first native multimodel AI workbench`。

它不是：

- `open-webui` 的移动端壳
- 一个服务端中心化 AI 面板
- 一个群组协作产品
- 一个最小原型

它是：

- 原生单用户 AI 客户端
- 多模型对比工作台
- 可分叉的对话环境
- 本地文档与检索工作台

## 实施准备度

在用户审阅并确认本文档后，本设计即可进入 implementation-planning 阶段。
