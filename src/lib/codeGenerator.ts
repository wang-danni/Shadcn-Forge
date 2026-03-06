import { ComponentItem, Theme } from '@/types';
import { COMPONENT_REGISTRY } from '@/config/components';

/**
 * 生成 React + TypeScript 代码
 */
export function generateReactCode(items: ComponentItem[], theme: Theme): string {
  if (items.length === 0) {
    return `import React from 'react';

export default function EmptyComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">画布为空，请添加组件</p>
    </div>
  );
}`;
  }

  // 收集需要导入的组件
  const imports = new Set<string>();
  items.forEach(item => {
    const componentName = item.type;
    imports.add(componentName);
  });

  // 生成导入语句
  const importStatements = Array.from(imports)
    .map(comp => `import { ${comp} } from '@/components/ui/${comp.toLowerCase()}';`)
    .join('\n');

  // 生成组件 JSX
  const componentJSX = items.map(item => generateComponentJSX(item, 2)).join('\n');

  return `import React from 'react';
${importStatements}

export default function GeneratedComponent() {
  return (
    <div className="p-8 space-y-4" style={{ backgroundColor: '${theme.background}', color: '${theme.foreground}' }}>
${componentJSX}
    </div>
  );
}`;
}

/**
 * 生成单个组件的 JSX
 */
function generateComponentJSX(item: ComponentItem, indent: number = 0): string {
  const spaces = ' '.repeat(indent);
  const config = COMPONENT_REGISTRY[item.type];
  
  if (!config) return '';

  const props = Object.entries(item.props)
    .filter(([key]) => key !== 'id')
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : '';
      } else if (typeof value === 'number') {
        return `${key}={${value}}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');

  const componentName = item.type;

  // 处理有 children 的组件
  if (item.props.children) {
    return `${spaces}<${componentName} ${props}>
${spaces}  {${JSON.stringify(item.props.children)}}
${spaces}</${componentName}>`;
  }

  // 自闭合组件
  return `${spaces}<${componentName} ${props} />`;
}

/**
 * 生成 HTML + Tailwind CSS 代码
 */
export function generateHTMLCode(items: ComponentItem[], theme: Theme): string {
  if (items.length === 0) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shadcn Forge - Generated</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="background-color: ${theme.background}; color: ${theme.foreground};">
  <div class="flex items-center justify-center min-h-screen">
    <p class="text-gray-500">画布为空，请添加组件</p>
  </div>
</body>
</html>`;
  }

  const componentHTML = items.map(item => generateComponentHTML(item, 2)).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shadcn Forge - Generated</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: ${theme.primary};
      --background: ${theme.background};
      --foreground: ${theme.foreground};
      --muted: ${theme.muted};
      --border: ${theme.border};
      --radius: ${theme.radius};
    }
  </style>
</head>
<body style="background-color: ${theme.background}; color: ${theme.foreground};">
  <div class="p-8 space-y-4">
${componentHTML}
  </div>
</body>
</html>`;
}

/**
 * 生成单个组件的 HTML
 */
function generateComponentHTML(item: ComponentItem, indent: number = 0): string {
  const spaces = ' '.repeat(indent);
  const config = COMPONENT_REGISTRY[item.type];
  
  if (!config) return '';

  switch (item.type) {
    case 'Button':
      return `${spaces}<button class="px-4 py-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
${spaces}  ${item.props.children || 'Button'}
${spaces}</button>`;

    case 'Card':
      return `${spaces}<div class="border rounded-lg p-6 bg-white shadow-sm">
${spaces}  <h3 class="text-lg font-bold mb-2">${item.props.title || 'Card Title'}</h3>
${spaces}  <p class="text-gray-600">${item.props.description || 'Card description'}</p>
${spaces}</div>`;

    case 'Input':
      return `${spaces}<input 
${spaces}  type="${item.props.type || 'text'}" 
${spaces}  placeholder="${item.props.placeholder || 'Enter text...'}" 
${spaces}  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
${spaces}/>`;

    case 'Textarea':
      return `${spaces}<textarea 
${spaces}  placeholder="${item.props.placeholder || 'Enter text...'}" 
${spaces}  rows="${item.props.rows || 3}"
${spaces}  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
${spaces}></textarea>`;

    case 'Avatar':
      return `${spaces}<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
${spaces}  <span class="text-sm font-medium">${item.props.fallback || 'A'}</span>
${spaces}</div>`;

    case 'Badge':
      return `${spaces}<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
${spaces}  ${item.props.text || 'Badge'}
${spaces}</span>`;

    case 'Alert':
      return `${spaces}<div class="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded">
${spaces}  <h4 class="font-bold text-indigo-800">${item.props.title || 'Alert'}</h4>
${spaces}  <p class="text-indigo-700 text-sm mt-1">${item.props.description || 'Alert description'}</p>
${spaces}</div>`;

    case 'Progress':
      return `${spaces}<div class="w-full bg-gray-200 rounded-full h-2">
${spaces}  <div class="bg-indigo-500 h-2 rounded-full" style="width: ${item.props.value || 50}%"></div>
${spaces}</div>`;

    case 'Switch':
      return `${spaces}<label class="flex items-center gap-2 cursor-pointer">
${spaces}  <div class="relative inline-block w-10 h-6 bg-gray-300 rounded-full transition-colors">
${spaces}    <input type="checkbox" class="sr-only" ${item.props.checked ? 'checked' : ''} />
${spaces}    <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
${spaces}  </div>
${spaces}  <span class="text-sm">${item.props.label || 'Switch'}</span>
${spaces}</label>`;

    case 'Checkbox':
      return `${spaces}<label class="flex items-center gap-2 cursor-pointer">
${spaces}  <input type="checkbox" class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" ${item.props.checked ? 'checked' : ''} />
${spaces}  <span class="text-sm">${item.props.label || 'Checkbox'}</span>
${spaces}</label>`;

    case 'Separator':
      return item.props.orientation === 'vertical'
        ? `${spaces}<div class="w-px h-full bg-gray-300"></div>`
        : `${spaces}<hr class="border-gray-300" />`;

    case 'Skeleton':
      return `${spaces}<div class="space-y-3 animate-pulse">
${spaces}  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
${spaces}  <div class="h-4 bg-gray-200 rounded"></div>
${spaces}  <div class="h-4 bg-gray-200 rounded w-5/6"></div>
${spaces}</div>`;

    default:
      return `${spaces}<!-- ${item.type} component -->`;
  }
}

/**
 * 生成单个组件的代码片段（用于快速预览）
 */
export function generateComponentSnippet(item: ComponentItem): string {
  return generateComponentJSX(item, 0);
}

/**
 * 生成完整的可运行项目结构
 */
export function generateProjectStructure(items: ComponentItem[], theme: Theme): Record<string, string> {
  return {
    'package.json': JSON.stringify({
      name: 'shadcn-forge-export',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@radix-ui/react-avatar': '^1.0.4',
        '@radix-ui/react-progress': '^1.0.3',
        '@radix-ui/react-switch': '^1.0.3',
        '@radix-ui/react-checkbox': '^1.0.4',
        '@radix-ui/react-separator': '^1.0.3',
        'lucide-react': '^0.294.0',
        'class-variance-authority': '^0.7.0',
        clsx: '^2.0.0',
        'tailwind-merge': '^2.0.0'
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        autoprefixer: '^10.4.16',
        postcss: '^8.4.32',
        tailwindcss: '^3.3.6',
        typescript: '^5.3.0',
        vite: '^5.0.0'
      }
    }, null, 2),
    
    'src/App.tsx': generateReactCode(items, theme),
    
    'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
    
    'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${theme.primary};
  --background: ${theme.background};
  --foreground: ${theme.foreground};
  --muted: ${theme.muted};
  --border: ${theme.border};
  --radius: ${theme.radius};
}`,
    
    'index.html': generateHTMLCode(items, theme),
    
    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }]
    }, null, 2)
  };
}