# Shadcn-Forge

Shadcn-Forge 是一个面向设计与开发的低代码画布编辑器，灵感源自 shadcn/ui 组件体系。它提供可视化拖拽、细粒度样式定制、布局组合与一键导出功能，可直接生成 React TSX/JSX、HTML + Tailwind、Vue SFC 等多种代码格式，帮助团队高效地把设计稿转化为可复用组件。

---

## ✨ 核心特性

### 1. 可视化画布编辑
- 侧边栏组件库（Button、Badge、Input、Card、Switch、Checkbox、Progress、Alert、Avatar、Textarea 等）可拖拽或点击添加到画布；
- 画布内支持拖动排序、嵌套布局、点击空白处取消选中；
- 选中组件后即刻在侧边栏中进行属性与样式调整，实时渲染反馈。

### 2. 样式与布局控制
- 提供背景色、文字色、边框、圆角、间距、字号、宽度等常用样式编辑面板；
- 支持行/列布局切换，相邻 row 组件自动合并成横向 flex 组；
- 可针对每个组件单独设置布局属性，满足复杂 UI 组合需求。

### 3. 多语言代码导出
- 一键导出：
  - React + TypeScript (TSX)
  - React + JavaScript (JSX)
  - 纯 HTML + Tailwind
  - Vue 3 单文件组件（SFC）
- 导出内容自动包含当前画布的样式/布局配置，可直接复制到项目中使用；
- 支持打包为 ZIP（含源码结构 + 画布快照），便于交付或备份。

### 4. AI 辅助生成（可选）
- 在 Toolbar 中输入自然语言描述（如“生成一个登录面板”），系统会调用配置好的 AI 模型生成组件 JSON；
- 支持 Gemini、通义千问（DashScope）、OpenAI 兼容接口、DeepSeek；
- 后端代理统一处理 API Key，不暴露到浏览器。

### 5. 可访问性与交互体验
- 组件根节点带 `data-canvas-item`，可用于选择/高亮；
- 选中状态提供视觉提示（轮廓/遮罩），方便定位；
- （当前版本已取消手机 / 平板 / 桌面切换，保持统一布局，后续如需可再开启响应式）。

---

## 🧱 技术栈

| 领域           | 说明                                                                 |
|----------------|----------------------------------------------------------------------|
| 前端框架       | React 18 + TypeScript、Vite                                          |
| 状态管理       | Zustand（见 `src/store/forgeStore.ts`）                              |
| 样式系统       | Tailwind CSS、部分内联样式（导出时会包含）                           |
| 组件与图标     | 自定义 shadcn 风格组件、Radix 控件、`lucide-react` 图标              |
| AI 代理        | Node.js 原生 HTTP Server (`server/index.mjs`)，可部署到 Vercel／自托管 |
| 打包与工具     | pnpm、ESBuild（由 Vite 驱动）                                        |

---

## 📁 目录结构速览

```
Shadcn-Forge/
├─ src/
│  ├─ components/
│  │  └─ forge/           # 画布、侧边栏、Toolbar、导出器等核心 UI
│  ├─ config/components/  # 可拖拽组件配置，定义 render、defaultProps
│  ├─ lib/
│  │  ├─ codeGenerator.ts # TSX/JSX/HTML/Vue 导出逻辑
│  │  └─ ai.ts            # 前端 AI 请求封装
│  ├─ store/forgeStore.ts # Zustand store：画布项、历史记录、主题、布局
│  └─ types/              # ComponentItem、Theme、Layout 等类型
├─ server/index.mjs       # AI 代理服务（Gemini/Qwen/OpenAI-Compatible/DeepSeek）
├─ scripts/               # 工具脚本（如 remove-responsive.mjs 等）
└─ README.md
```

---

## 🚀 快速开始

### 1. 安装依赖

```powershell
pnpm install
```

### 2. 本地开发

```powershell
pnpm dev:api   # 启动 AI 代理（可选，但如需 AI 功能必须开启）
pnpm dev       # 启动前端
```

若使用 AI 功能，请在根目录创建 `.env` 或 `.env.local`，示例：

```env
AI_PROVIDER=qwen
AI_API_KEY=你的_DashScope_API_Key
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-flash
VITE_AI_MODEL=qwen-flash
VITE_AI_PROXY_TARGET=http://localhost:8787
```

### 3. 构建生产包

```powershell
pnpm build
```

### 4. 类型检查（可选）

```powershell
pnpm -w exec tsc --noEmit
```

---

## 🧠 AI 代理与前端调用流程

1. **前端入口**：`src/components/forge/AIPrompt.tsx`（按钮挂载于 `Toolbar.tsx`）；
2. **前端请求封装**：`src/lib/ai.ts` 默认调用 `/api/ai/generate`；
3. **后端代理**：`server/index.mjs`  
   - 自动加载 `.env`；
   - 推断 Provider（Gemini / Qwen / DeepSeek / OpenAI-Compatible）；
   - 构造请求体并转发，解析结果文本；
   - Windows 环境在 fetch 超时时 fallback 到 PowerShell 请求；
4. **部署到 Vercel**：使用 `api/ai/generate.js`（已与前端路径保持一致）。

> 建议线上环境统一走服务端代理，避免在浏览器暴露 API Key。生产环境可额外接入鉴权、限流和日志。

---

## 🧾 使用指南

1. 打开编辑器（默认 `Design` 标签），从侧边栏选择组件添加到画布；
2. 点击画布任意组件，在右侧面板修改属性/样式，实时预览；
3. 使用顶部 Toolbar：
   - **Undo/Redo**：撤销/重做；
   - **预览模式**：隐藏辅助线，只看真实渲染；
   - **暗色模式**：切换 UI 主题；
   - **导入 JSON**：载入已有画布快照；
   - **导出 ZIP**：生成项目结构和 `snapshot.json`；
   - **AI Prompt**：输入描述生成组件（需要配置 AI）；
4. 切换到 `Inspect` 或 `Export` 标签查看结构、复制代码；
5. 导出完成后，可在本地或线上项目中直接使用生成的组件。

---

## 📤 导出说明

| 模式          | 说明                                                                                           |
|---------------|------------------------------------------------------------------------------------------------|
| React (TSX)   | 保留类型信息、使用 shadcn 风格组件 + 内联样式                                                  |
| React (JSX)   | 去除类型注解，其余与 TSX 版一致                                                                |
| HTML + Tailwind | 生成完整 HTML，引用 Tailwind CDN，内联样式和变量一并写入                                     |
| Vue 3 SFC     | 生成基础 `<template>` + `<script setup>`，可直接引入到 Vue 工程                                |
| ZIP 导出      | 基于 `generateProjectStructure` 的目录布局 + `snapshot.json`，便于交付或二次开发               |

> 当前导出以内联样式为主。如需自动映射到 Tailwind 类，可进一步扩展 `codeGenerator.ts`。

---

## 🛠️ 开发与贡献

1. **新增组件**：
   - 在 `src/config/components/` 编写对应 `ComponentConfig`；
   - 在 `src/components/ui/` 或第三方库中提供实际渲染实现；
   - 根据需要更新 `codeGenerator.ts` 输出模板；
2. **状态扩展**：在 `forgeStore.ts` 中添加字段与 action，并在相关组件中消费；
3. **样式策略**：当前版本默认单一布局（已移除手机/平板/桌面切换和响应式类）；需要响应式时可自行恢复；
4. **提交 PR / Issue**：欢迎描述你的需求或优化建议。

---

## ⚠️ 已知问题 & TODO

- 导出内容以 inline style 为主，尚未自动转换为 Tailwind 类；
- 方向（direction）控制缺少“清除”按钮，暂需手动设置；
- 复杂响应式布局暂未支持（按需求可重新启用断点逻辑）；
- 后端代理暂未添加鉴权、速率限制等生产级防护。

---

## 📄 许可证

MIT License

---

如需：
- 恢复响应式断点 / 自适应布局；
- 增加 Tailwind 类导出；
- 扩展更多组件或导出格式；
请随时在 Issue / PR 中告知，或直接描述我来帮你改。// filepath: d:\Code\Shadcn-Forge\README.md
# Shadcn-Forge

Shadcn-Forge 是一个面向设计与开发的低代码画布编辑器，灵感源自 shadcn/ui 组件体系。它提供可视化拖拽、细粒度样式定制、布局组合与一键导出功能，可直接生成 React TSX/JSX、HTML + Tailwind、Vue SFC 等多种代码格式，帮助团队高效地把设计稿转化为可复用组件。

---

## ✨ 核心特性

### 1. 可视化画布编辑
- 侧边栏组件库（Button、Badge、Input、Card、Switch、Checkbox、Progress、Alert、Avatar、Textarea 等）可拖拽或点击添加到画布；
- 画布内支持拖动排序、嵌套布局、点击空白处取消选中；
- 选中组件后即刻在侧边栏中进行属性与样式调整，实时渲染反馈。

### 2. 样式与布局控制
- 提供背景色、文字色、边框、圆角、间距、字号、宽度等常用样式编辑面板；
- 支持行/列布局切换，相邻 row 组件自动合并成横向 flex 组；
- 可针对每个组件单独设置布局属性，满足复杂 UI 组合需求。

### 3. 多语言代码导出
- 一键导出：
  - React + TypeScript (TSX)
  - React + JavaScript (JSX)
  - 纯 HTML + Tailwind
  - Vue 3 单文件组件（SFC）
- 导出内容自动包含当前画布的样式/布局配置，可直接复制到项目中使用；
- 支持打包为 ZIP（含源码结构 + 画布快照），便于交付或备份。

### 4. AI 辅助生成（可选）
- 在 Toolbar 中输入自然语言描述（如“生成一个登录面板”），系统会调用配置好的 AI 模型生成组件 JSON；
- 支持 Gemini、通义千问（DashScope）、OpenAI 兼容接口、DeepSeek；
- 后端代理统一处理 API Key，不暴露到浏览器。

### 5. 可访问性与交互体验
- 组件根节点带 `data-canvas-item`，可用于选择/高亮；
- 选中状态提供视觉提示（轮廓/遮罩），方便定位；
- （当前版本已取消手机 / 平板 / 桌面切换，保持统一布局，后续如需可再开启响应式）。

---

## 🧱 技术栈

| 领域           | 说明                                                                 |
|----------------|----------------------------------------------------------------------|
| 前端框架       | React 18 + TypeScript、Vite                                          |
| 状态管理       | Zustand（见 `src/store/forgeStore.ts`）                              |
| 样式系统       | Tailwind CSS、部分内联样式（导出时会包含）                           |
| 组件与图标     | 自定义 shadcn 风格组件、Radix 控件、`lucide-react` 图标              |
| AI 代理        | Node.js 原生 HTTP Server (`server/index.mjs`)，可部署到 Vercel／自托管 |
| 打包与工具     | pnpm、ESBuild（由 Vite 驱动）                                        |

---

## 📁 目录结构速览

```
Shadcn-Forge/
├─ src/
│  ├─ components/
│  │  └─ forge/           # 画布、侧边栏、Toolbar、导出器等核心 UI
│  ├─ config/components/  # 可拖拽组件配置，定义 render、defaultProps
│  ├─ lib/
│  │  ├─ codeGenerator.ts # TSX/JSX/HTML/Vue 导出逻辑
│  │  └─ ai.ts            # 前端 AI 请求封装
│  ├─ store/forgeStore.ts # Zustand store：画布项、历史记录、主题、布局
│  └─ types/              # ComponentItem、Theme、Layout 等类型
├─ server/index.mjs       # AI 代理服务（Gemini/Qwen/OpenAI-Compatible/DeepSeek）
├─ scripts/               # 工具脚本（如 remove-responsive.mjs 等）
└─ README.md
```

---

## 🚀 快速开始

### 1. 安装依赖

```powershell
pnpm install
```

### 2. 本地开发

```powershell
pnpm dev:api   # 启动 AI 代理（可选，但如需 AI 功能必须开启）
pnpm dev       # 启动前端
```

若使用 AI 功能，请在根目录创建 `.env` 或 `.env.local`，示例：

```env
AI_PROVIDER=qwen
AI_API_KEY=你的_DashScope_API_Key
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-flash
VITE_AI_MODEL=qwen-flash
VITE_AI_PROXY_TARGET=http://localhost:8787
```

### 3. 构建生产包

```powershell
pnpm build
```

### 4. 类型检查（可选）

```powershell
pnpm -w exec tsc --noEmit
```

---

## 🧠 AI 代理与前端调用流程

1. **前端入口**：`src/components/forge/AIPrompt.tsx`（按钮挂载于 `Toolbar.tsx`）；
2. **前端请求封装**：`src/lib/ai.ts` 默认调用 `/api/ai/generate`；
3. **后端代理**：`server/index.mjs`  
   - 自动加载 `.env`；
   - 推断 Provider（Gemini / Qwen / DeepSeek / OpenAI-Compatible）；
   - 构造请求体并转发，解析结果文本；
   - Windows 环境在 fetch 超时时 fallback 到 PowerShell 请求；
4. **部署到 Vercel**：使用 `api/ai/generate.js`（已与前端路径保持一致）。

> 建议线上环境统一走服务端代理，避免在浏览器暴露 API Key。生产环境可额外接入鉴权、限流和日志。

---

## 🧾 使用指南

1. 打开编辑器（默认 `Design` 标签），从侧边栏选择组件添加到画布；
2. 点击画布任意组件，在右侧面板修改属性/样式，实时预览；
3. 使用顶部 Toolbar：
   - **Undo/Redo**：撤销/重做；
   - **预览模式**：隐藏辅助线，只看真实渲染；
   - **暗色模式**：切换 UI 主题；
   - **导入 JSON**：载入已有画布快照；
   - **导出 ZIP**：生成项目结构和 `snapshot.json`；
   - **AI Prompt**：输入描述生成组件（需要配置 AI）；
4. 切换到 `Inspect` 或 `Export` 标签查看结构、复制代码；
5. 导出完成后，可在本地或线上项目中直接使用生成的组件。

---

## 📤 导出说明

| 模式          | 说明                                                                                           |
|---------------|------------------------------------------------------------------------------------------------|
| React (TSX)   | 保留类型信息、使用 shadcn 风格组件 + 内联样式                                                  |
| React (JSX)   | 去除类型注解，其余与 TSX 版一致                                                                |
| HTML + Tailwind | 生成完整 HTML，引用 Tailwind CDN，内联样式和变量一并写入                                     |
| Vue 3 SFC     | 生成基础 `<template>` + `<script setup>`，可直接引入到 Vue 工程                                |
| ZIP 导出      | 基于 `generateProjectStructure` 的目录布局 + `snapshot.json`，便于交付或二次开发               |

> 当前导出以内联样式为主。如需自动映射到 Tailwind 类，可进一步扩展 `codeGenerator.ts`。

---

## 🛠️ 开发与贡献

1. **新增组件**：
   - 在 `src/config/components/` 编写对应 `ComponentConfig`；
   - 在 `src/components/ui/` 或第三方库中提供实际渲染实现；
   - 根据需要更新 `codeGenerator.ts` 输出模板；
2. **状态扩展**：在 `forgeStore.ts` 中添加字段与 action，并在相关组件中消费；
3. **样式策略**：当前版本默认单一布局（已移除手机/平板/桌面切换和响应式类）；需要响应式时可自行恢复；
4. **提交 PR / Issue**：欢迎描述你的需求或优化建议。

---

## ⚠️ 已知问题 & TODO

- 导出内容以 inline style 为主，尚未自动转换为 Tailwind 类；
- 方向（direction）控制缺少“清除”按钮，暂需手动设置；
- 复杂响应式布局暂未支持（按需求可重新启用断点逻辑）；
- 后端代理暂未添加鉴权、速率限制等生产级防护。

---

## 📄 许可证

MIT License

---

如需：
- 恢复响应式断点 / 自适应布局；
- 增加 Tailwind 类导出；
- 扩展更多组件或导出格式；
请随时在 Issue / PR 中告知，或直接描述我来帮你改。