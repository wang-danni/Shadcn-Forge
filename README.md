# Shadcn-Forge

一个面向设计与开发桥接的低代码画布编辑器，灵感来自 shadcn/ui 风格组件库。该项目提供可视化拖拽编辑、逐项样式定制、分组布局和多语言代码导出（React TSX/JSX、HTML + Tailwind、Vue SFC），便于快速从设计生成可复用的组件代码。

---

## 核心功能

- 可视化画布
  - 通过拖拽或单击将组件从侧边栏添加到画布
  - 支持画布内组件的拖拽重排（改变顺序）
  - 点击画布空白处取消选中，点击组件选中以便编辑
- 每项样式可视化编辑
  - 每个组件（Button、Badge、Input、Card、Switch、Checkbox、Progress、Alert、Avatar、Textarea 等）均可在侧边栏修改样式属性：背景色、文字色、边框颜色、圆角、边框宽度、内边距、字号、宽度等
  - 修改即时反映在画布中（真实渲染）
- 布局与组合
  - 每个组件支持设置方向（row / column）
  - 连续设置为 row 的组件会被组合渲染为同一行（flex-row）以支持水平按钮组等场景
- 导出代码（shadcn 风格）
  - 支持导出为：React + TypeScript (TSX)、React + JavaScript (JSX)、HTML + Tailwind、Vue 3 单文件组件（SFC）
  - 导出内容会将每个组件的内联样式包含进输出，便于复制到项目或进一步转换为 Tailwind 类
- 可访问性与 UX
  - 每个画布项根节点带有 `data-canvas-item` 以便做选择与交互逻辑
  - 组件在被选中时会有视觉提示（可选单外边框）

---

## 技术栈

- 框架与工具链
  - React 18 + TypeScript
  - Vite（开发服务器与构建）
  - pnpm（包管理，若你使用 npm/yarn 可相应切换命令）
- 样式
  - Tailwind CSS（设计系统与导出 HTML 时使用）
- 组件库与图标
  - shadcn/ui 风格组件（项目内在 `src/components/ui` 假定存在相应组件实现）
  - Radix 相关控件（Avatar、Switch、Progress 等，导出依赖可选）
  - lucide-react（图标）
- 项目结构（重要目录）
  - `src/components/forge/`：画布编辑器核心组件（Canvas、DesignView、Sidebar、Toolbar、CanvasItem、CodeExporter 等）
  - `src/config/components/`：组件配置与渲染逻辑（每个可拖拽组件的 render 实现）
  - `src/lib/codeGenerator.ts`：代码导出生成器（TSX/JSX/HTML/Vue）
  - `src/store/forgeStore.ts`：状态管理（画布项、选中、历史、主题等）
  - `src/types/`：类型定义（ComponentItem、ComponentConfig、Theme 等）

---

## 快速启动

1. 安装依赖（推荐使用 pnpm）：

   ```powershell
   pnpm install
   ```

2. 本地开发：

   ```powershell
   pnpm dev
   ```

  如果要使用 AI 生成功能，需要先在项目根目录创建 `.env` 文件：

  ```env
    AI_PROVIDER=qwen
    AI_API_KEY=你的_DashScope_API_Key
    AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
    AI_MODEL=qwen-flash
    VITE_AI_MODEL=qwen-flash
  VITE_AI_PROXY_TARGET=http://localhost:8787
  ```

  开发时需要同时启动前端和 AI 代理服务：

  ```powershell
  pnpm dev:api
  pnpm dev
  ```

3. 构建生产包：

   ```powershell
   pnpm build
   ```

4. 运行类型检查（可选）：

   ```powershell
   pnpm -w exec tsc --noEmit
   ```

---

## 使用说明（主流程）

1. 通过侧边栏拖拽或点击将组件添加到画布。
2. 在画布上移动组件以调整顺序；把组件放到其他组件之间以插入。
3. 选中组件后使用侧边栏编辑其属性与样式，修改会立即反映在画布。
4. 可为组件设置布局方向（row / column）。连续的 row 项目会合并在同一 flex 行中渲染。
5. 使用“导出”功能选择目标语言，复制或下载生成的代码。
6. 使用顶部“AI 智能构建”输入自然语言描述，例如“生成一个登录卡片，包含邮箱输入框、密码输入框和登录按钮”，系统会调用当前配置的 AI 提供商返回结构化组件数据并追加到当前画布。

---

## AI 生成功能说明

- AI 入口位于 [src/components/forge/AIPrompt.tsx](src/components/forge/AIPrompt.tsx)，按钮挂载在 [src/components/forge/Toolbar.tsx](src/components/forge/Toolbar.tsx)。
- 模型调用封装位于 [src/lib/ai.ts](src/lib/ai.ts)，前端默认请求本地 `/api/ai/generate` 代理接口。
- 后端代理位于 `server/index.mjs`，现已支持 `gemini`、`qwen`、`openai-compatible` 和 `deepseek` 四类提供商。
- 如果你要接通义千问，推荐直接配置 `AI_PROVIDER=qwen`、`AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`、`AI_MODEL=qwen-flash`。
- 如果你要接 DeepSeek，推荐直接配置 `AI_PROVIDER=deepseek`、`AI_BASE_URL=https://api.deepseek.com/v1`、`AI_MODEL=deepseek-chat`。
- AI 返回的不是源码，而是组件 JSON；前端会把这些结果转换成 `ComponentItem` 写入 Zustand store，再由画布和导出模块消费。
- 当前版本已经支持本地后端代理，浏览器不再直接暴露供应商密钥；如果要上线，建议继续在服务端补充鉴权、限流和日志。

---

## 导出说明

- React (TSX)
  - 生成的代码接近 shadcn/ui 写法，导入对应组件并将样式以内联 style 的形式写入
- React (JSX)
  - 与 TSX 类似，但移除 TypeScript 类型注解
- HTML + Tailwind
  - 生成完整 HTML 页面，引用 Tailwind CDN，并在内联样式或 CSS 变量中注入主题色
- Vue SFC
  - 生成基本的 Vue 3 单文件组件模板，包含导出的组件结构在 template 中

提示：当前导出使用内联样式，有需要我可以追加将内联样式映射为 Tailwind 类的转换器以便生成更加「shadcn 风格」的输出。

---

## 开发与贡献

- 代码风格遵循 TypeScript 严格模式；建议在开发前运行类型检查与 lint。
- 若要添加新的可拖拽组件：
  1. 在 `src/config/components/` 中新增组件描述（遵循已有 `ComponentConfig` 结构）。
  2. 在 `src/components/ui/` 中提供该组件的实现（或依赖外部库组件）。
  3. 更新 `src/lib/codeGenerator.ts` 中的导出逻辑以支持对应组件的代码片段（若需要）。

欢迎提交 issue 或 PR，描述你希望的行为或改进点。

---

## 已知问题与待办（部分）

- 导出结果目前以内联样式为主，尚未自动映射为 Tailwind 类（可按需实现）。
- 方向（direction）支持已实现，但尚未提供“清除方向（继承全局）”的 UI 控件。
- 目前没有生成可下载的工程 zip（可作为后续功能实现）。

---

## 许可证

MIT

---

如果需要，我可以：
- 将导出样式映射为 Tailwind 类并把输出改为更贴近 shadcn 官方样式；
- 增加导出为可下载项目 zip 的功能；
- 运行本地构建/检查并修复发现的问题（需要你允许我在终端运行 pnpm 命令）。
