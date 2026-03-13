import { ComponentItem, Theme } from '@/types';
import { COMPONENT_REGISTRY } from '@/config/components';

type StyleMode = 'inline' | 'external' | 'tailwind';

/**
 * Helper: build inline style string from item.style
 */
function buildStyleString(style?: ComponentItem['style']): string {
  if (!style) return '{}';
  const parts: string[] = [];
  if (style.backgroundColor) parts.push(`backgroundColor: '${style.backgroundColor}'`);
  if (style.color) parts.push(`color: '${style.color}'`);
  if (style.borderColor) parts.push(`borderColor: '${style.borderColor}'`);
  if (style.borderRadius !== undefined) parts.push(`borderRadius: '${style.borderRadius}px'`);
  if (style.borderWidth !== undefined) parts.push(`borderWidth: '${style.borderWidth}px'`);
  if (style.padding !== undefined) parts.push(`padding: '${style.padding}px'`);
  if (style.fontSize !== undefined) parts.push(`fontSize: '${style.fontSize}px'`);
  if (style.width !== undefined) parts.push(`width: ${style.width === 'full' ? "'100%'" : (style.width === 'auto' ? 'undefined' : `'${style.width}'`)}`);
  if (style.height !== undefined) parts.push(`height: ${style.height === 'full' ? "'100%'" : (style.height === 'auto' ? 'undefined' : `'${style.height}'`)}`);

  const filtered = parts.filter(p => !p.includes('undefined'));
  if (filtered.length === 0) return '{}';
  return `{ ${filtered.join(', ')} }`;
}

/**
 * Generate external CSS file content for items
 */
export function generateExternalCSS(items: ComponentItem[]): string {
  const lines: string[] = [];
  items.forEach(item => {
    const s = item.style || {};
    const selector = `.cf-item-${item.id}`;
    const props: string[] = [];
    if (s.backgroundColor) props.push(`  background-color: ${s.backgroundColor};`);
    if (s.color) props.push(`  color: ${s.color};`);
    if (s.borderColor) props.push(`  border-color: ${s.borderColor};`);
    if (s.borderRadius !== undefined) props.push(`  border-radius: ${s.borderRadius}px;`);
    if (s.borderWidth !== undefined) props.push(`  border-width: ${s.borderWidth}px;`);
    if (s.padding !== undefined) props.push(`  padding: ${s.padding}px;`);
    if (s.fontSize !== undefined) props.push(`  font-size: ${s.fontSize}px;`);
    if (s.width !== undefined) {
      if (s.width === 'full') props.push(`  width: 100%;`);
      else if (s.width !== 'auto') props.push(`  width: ${s.width};`);
    }
    if (s.height !== undefined) {
      if (s.height === 'full') props.push(`  height: 100%;`);
      else if (s.height !== 'auto') props.push(`  height: ${s.height};`);
    }
    if (s.direction) {
      props.push(`  display: flex;`);
      props.push(`  flex-direction: ${s.direction};`);
    }
    if (props.length > 0) {
      lines.push(`${selector} {`);
      lines.push(...props);
      lines.push('}');
    }
  });
  return lines.join('\n');
}

// 新增：将样式映射为 Tailwind 类（尽量使用任意值语法以保留精确样式）
function mapStyleToTailwind(style?: ComponentItem['style']): string {
  if (!style) return '';
  const classes: string[] = [];
  if (style.backgroundColor) {
    // 支持如 #rrggbb 或 rgba() 等任意值
    classes.push(`bg-[${style.backgroundColor}]`.replace(/bg-\[undefined\]/, ''));
    // 更兼容的写法：如果是 # 开头，则使用方括号语法
    if (/^#/.test(style.backgroundColor)) {
      classes[classes.length - 1] = `bg-[${style.backgroundColor}]`;
    }
  }
  if (style.color) {
    classes.push(`text-[${style.color}]`);
  }
  if (style.borderColor) {
    classes.push(`border-[${style.borderColor}]`);
  }
  if (style.borderWidth !== undefined) {
    // Tailwind 普通边框宽度类有限，使用任意值
    classes.push(`border-[${style.borderWidth}px]`);
  }
  if (style.borderRadius !== undefined) {
    // 使用任意值保持像素精度
    classes.push(`rounded-[${style.borderRadius}px]`);
  }
  if (style.padding !== undefined) {
    classes.push(`p-[${style.padding}px]`);
  }
  if (style.fontSize !== undefined) {
    classes.push(`text-[${style.fontSize}px]`);
  }
  if (style.width !== undefined) {
    if (style.width === 'full') classes.push('w-full');
    else if (style.width !== 'auto') classes.push(`w-[${style.width}]`);
  }
  if (style.height !== undefined) {
    if (style.height === 'full') classes.push('h-full');
    else if (style.height !== 'auto') classes.push(`h-[${style.height}]`);
  }
  if (style.direction) {
    classes.push('flex');
    classes.push(style.direction === 'row' ? 'flex-row' : 'flex-col');
  }
  // 过滤掉空项
  return classes.filter(Boolean).join(' ');
}

// 新增：为 JSX 元素构建 className 属性（合并 baseClass 和 Tailwind 映射或外部样式类）
function buildClassAttrJSX(item: ComponentItem, baseClass: string | undefined, styleMode: StyleMode): string {
  if (styleMode === 'inline') return baseClass ? ` className="${baseClass}"` : '';
  if (styleMode === 'external') {
    const combined = [baseClass, `cf-item-${item.id}`].filter(Boolean).join(' ');
    return combined ? ` className="${combined}"` : '';
  }
  // tailwind
  const tail = mapStyleToTailwind(item.style);
  const combined = [baseClass, tail].filter(Boolean).join(' ');
  return combined ? ` className="${combined}"` : '';
}

// 新增：为 HTML 元素构建 class 属性（合并 baseClass 与样式）
function buildClassAttrHTML(item: ComponentItem, baseClass: string | undefined, styleMode: StyleMode): string {
  if (styleMode === 'inline') return baseClass ? ` class="${baseClass}"` : '';
  if (styleMode === 'external') {
    const combined = [baseClass, `cf-item-${item.id}`].filter(Boolean).join(' ');
    return combined ? ` class="${combined}"` : '';
  }
  // tailwind
  const tail = mapStyleToTailwind(item.style);
  const combined = [baseClass, tail].filter(Boolean).join(' ');
  return combined ? ` class="${combined}"` : '';
}

/**
 * 生成单个组件的 JSX（更接近 shadcn 组件写法）
 */
function generateComponentJSX(item: ComponentItem, indent: number = 0, theme?: Theme, styleMode: StyleMode = 'inline'): string {
  const spaces = ' '.repeat(indent);
  const config = COMPONENT_REGISTRY[item.type];
  if (!config) return '';

  const styleStr = buildStyleString(item.style);
  const props: any = item.props || {};
  // 统一使用 buildClassAttrJSX 来构建 className

  switch (item.type) {
    case 'Button': {
      const children = props.children || 'Button';
      const variant = props.variant ? `variant=\"${props.variant}\"` : '';
      const size = props.size ? `size=\"${props.size}\"` : '';
      const classAttr = buildClassAttrJSX(item, undefined, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<Button ${variant} ${size}${classAttr}${styleAttr}>
${spaces}  ${children}
${spaces}</Button>`;
    }

    case 'Card': {
      const classAttr = buildClassAttrJSX(item, undefined, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<Card${classAttr}${styleAttr}>
${spaces}  <CardHeader>
${spaces}    <CardTitle>${props.title || 'Card Title'}</CardTitle>
${props.description ? `${spaces}    <CardDescription>${props.description}</CardDescription>\n` : ''}${spaces}  </CardHeader>
${props.content ? `${spaces}  <CardContent>${props.content}</CardContent>\n` : ''}${props.footerPrimary || props.footerSecondary ? `${spaces}  <CardFooter className="justify-end gap-2">\n${props.footerSecondary ? `${spaces}    <Button variant="outline" size="sm">${props.footerSecondary}</Button>\n` : ''}${props.footerPrimary ? `${spaces}    <Button size="sm">${props.footerPrimary}</Button>\n` : ''}${spaces}  </CardFooter>\n` : ''}
${spaces}</Card>`;
    }

    case 'Input': {
      const classAttr = buildClassAttrJSX(item, undefined, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<Input type=\"${props.type || 'text'}\" placeholder=\"${props.placeholder || ''}\"${classAttr}${styleAttr} />`;
    }

    case 'Textarea': {
      const classAttr = buildClassAttrJSX(item, undefined, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<Textarea rows={${props.rows ?? 3}} placeholder=\"${props.placeholder || ''}\"${classAttr}${styleAttr} />`;
    }

    case 'Avatar': {
      const fallback = props.fallback || 'A';
      const src = props.src ? `<AvatarImage src=\"${props.src}\" alt=\"${fallback}\" />` : '';
      const classAttr = buildClassAttrJSX(item, undefined, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<Avatar${classAttr}${styleAttr}>
${src ? `${spaces}  ${src}\n` : ''}${spaces}  <AvatarFallback>${fallback}</AvatarFallback>
${spaces}</Avatar>`;
    }

    case 'Badge': {
      const classAttr = buildClassAttrJSX(item, undefined, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<Badge ${props.variant ? `variant=\"${props.variant}\"` : ''}${classAttr}${styleAttr}>${props.text || 'Badge'}</Badge>`;
    }

    case 'Alert': {
      const classAttr = buildClassAttrJSX(item, undefined, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<Alert${classAttr}${styleAttr} variant=\"${props.variant || 'default'}\">\n${spaces}  <AlertTitle>${props.title || 'Alert'}</AlertTitle>\n${spaces}  <AlertDescription>${props.description || ''}</AlertDescription>\n${spaces}</Alert>`;
    }

    case 'Progress': {
      const value = props.value ?? 50;
      const inlineFill = styleMode === 'inline' && item.style?.backgroundColor ? `, backgroundColor: '${item.style.backgroundColor}'` : '';
      const outerClass = undefined;
      const outerClassAttr = buildClassAttrJSX(item, outerClass, styleMode);
      return `${spaces}<div style={{ width: '100%' }}${outerClassAttr}>
${spaces}  <div className=\"h-2 w-full rounded-full overflow-hidden\" style={{ backgroundColor: '${theme?.muted}' }}>
${spaces}    <div className=\"h-full transition-all\" style={{ width: \`${value}%\`${inlineFill} }} />
${spaces}  </div>
${spaces}</div>`;
    }

    case 'Switch': {
      const base = 'flex items-center gap-2';
      const classAttr = buildClassAttrJSX(item, base, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<label${classAttr}${styleAttr}>\n${spaces}  <Switch checked={${props.checked ? 'true' : 'false'}} />\n${spaces}  <span>${props.label || 'Switch'}</span>\n${spaces}</label>`;
    }

    case 'Checkbox': {
      const base = 'flex items-center gap-2';
      const classAttr = buildClassAttrJSX(item, base, styleMode);
      const styleAttr = styleMode === 'inline' && styleStr !== '{}' ? ` style=${styleStr}` : '';
      return `${spaces}<label${classAttr}${styleAttr}>\n${spaces}  <Checkbox checked={${props.checked ? 'true' : 'false'}} />\n${spaces}  <span>${props.label || 'Checkbox'}</span>\n${spaces}</label>`;
    }

    case 'Separator':
      return props.orientation === 'vertical'
        ? `${spaces}<div style={{ width: '1px', height: '100%', backgroundColor: '${theme?.border}' }}${buildClassAttrJSX(item, undefined, styleMode)} />`
        : `${spaces}<hr style={{ borderColor: '${theme?.border}' }}${buildClassAttrJSX(item, undefined, styleMode)} />`;

    case 'Skeleton': {
      const lines = props.lines ?? 3;
      const base = 'space-y-3 animate-pulse';
      const classAttr = buildClassAttrJSX(item, base, styleMode);
      return `${spaces}<div${classAttr}>\n${Array.from({ length: lines }).map(() => `${spaces}  <div className=\"h-4 bg-gray-200 rounded\"></div>`).join('\n')}\n${spaces}</div>`;
    }

    default:
      return `${spaces}/* ${item.type} not implemented for export */`;
  }
}

/**
 * 生成 React + TypeScript 代码（shadcn 风格）
 */
export function generateReactCode(items: ComponentItem[], theme: Theme, styleMode: StyleMode = 'inline'): string {
  if (items.length === 0) {
    return `import React from 'react';\n\nexport default function EmptyComponent() {\n  return (\n    <div className=\"flex items-center justify-center min-h-screen\">\n      <p className=\"text-gray-500\">画布为空，请添加组件</p>\n    </div>\n  );\n}`;
  }

  // 收集需要导入的组件
  const imports = new Set<string>();
  items.forEach(item => imports.add(item.type));

  const importMap: Record<string, string> = {
    Card: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';`,
    Avatar: `import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';`,
    Alert: `import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';`
  };

  const importStatements = Array.from(imports)
    .map((comp) => importMap[comp] || `import { ${comp} } from '@/components/ui/${comp.toLowerCase()}';`)
    .join('\n');

  const styleImport = styleMode === 'external' ? "import './styles.css';\n" : '';
  const componentJSX = items.map(item => generateComponentJSX(item, 4, theme, styleMode)).join('\n');

  return `import React from 'react';\n${styleImport}${importStatements}\n\nexport default function GeneratedComponent() {\n  return (\n    <div className=\"p-8 space-y-4\" style={{ backgroundColor: '${theme.background}', color: '${theme.foreground}' }}>\n${componentJSX}\n    </div>\n  );\n}`;
}

/**
 * 生成 React (JavaScript) 代码（JSX，不带类型）
 */
export function generateReactJSCode(items: ComponentItem[], theme: Theme, styleMode: StyleMode = 'inline'): string {
  const code = generateReactCode(items, theme, styleMode);
  // strip TypeScript typings is not strictly necessary here; return same code but change extension expectation
  return code;
}

/**
 * 生成 HTML + Tailwind CSS 代码
 */
export function generateHTMLCode(items: ComponentItem[], theme: Theme, styleMode: StyleMode = 'inline'): string {
  if (items.length === 0) {
    return `<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Shadcn Forge - Generated</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body style=\"background-color: ${theme.background}; color: ${theme.foreground};\">\n  <div class=\"flex items-center justify-center min-h-screen\">\n    <p class=\"text-gray-500\">画布为空，请添加组件</p>\n  </div>\n</body>\n</html>`;
  }

  const componentHTML = items.map(item => generateComponentHTML(item, 2, styleMode)).join('\n');
  const externalStyles = styleMode === 'external' ? `<style>\n${generateExternalCSS(items)}\n</style>` : '';

  return `<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Shadcn Forge - Generated</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n  <style>\n    :root {\n      --primary: ${theme.primary};\n      --background: ${theme.background};\n      --foreground: ${theme.foreground};\n      --muted: ${theme.muted};\n      --border: ${theme.border};\n      --radius: ${theme.radius};\n    }\n  </style>\n${externalStyles}\n</head>\n<body style=\"background-color: ${theme.background}; color: ${theme.foreground};\">\n  <div class=\"p-8 space-y-4\">\n${componentHTML}\n  </div>\n</body>\n</html>`;
}

function generateComponentHTML(item: ComponentItem, indent: number = 0, styleMode: StyleMode = 'inline'): string {
  const spaces = ' '.repeat(indent);
  // 使用 buildClassAttrHTML 合并 base class 与外部 / tailwind
  switch (item.type) {
    case 'Button': {
      const base = 'px-4 py-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<button${cls}>\n${spaces}  ${item.props.children || 'Button'}\n${spaces}</button>`;
    }

    case 'Card': {
      const base = 'border rounded-lg p-6 bg-white shadow-sm';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<div${cls}>\n${spaces}  <h3 class=\"text-lg font-bold mb-2\">${item.props.title || 'Card Title'}</h3>\n${spaces}  <p class=\"text-gray-600\">${item.props.description || 'Card description'}</p>\n${spaces}</div>`;
    }

    case 'Input': {
      const base = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<input${cls}\n${spaces}  type=\"${item.props.type || 'text'}\" \n${spaces}  placeholder=\"${item.props.placeholder || 'Enter text...'}\" \n${spaces}/> `;
    }

    case 'Textarea': {
      const base = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<textarea${cls}\n${spaces}  placeholder=\"${item.props.placeholder || 'Enter text...'}\" \n${spaces}  rows=\"${item.props.rows || 3}\"\n${spaces}></textarea>`;
    }

    case 'Avatar': {
      const base = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<div${cls}>\n${spaces}  <span class=\"text-sm font-medium\">${item.props.fallback || 'A'}</span>\n${spaces}</div>`;
    }

    case 'Badge': {
      const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<span${cls}>\n${spaces}  ${item.props.text || 'Badge'}\n${spaces}</span>`;
    }

    case 'Alert': {
      const base = 'border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<div${cls}>\n${spaces}  <h4 class=\"font-bold text-indigo-800\">${item.props.title || 'Alert'}</h4>\n${spaces}  <p class=\"text-indigo-700 text-sm mt-1\">${item.props.description || 'Alert description'}</p>\n${spaces}</div>`;
    }

    case 'Progress': {
      const base = 'w-full bg-gray-200 rounded-full h-2';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<div${cls}>\n${spaces}  <div class=\"bg-indigo-500 h-2 rounded-full\" style=\"width: ${item.props.value || 50}%\"></div>\n${spaces}</div>`;
    }

    case 'Switch': {
      const base = 'flex items-center gap-2 cursor-pointer';
      const cls = buildClassAttrHTML(item, base, styleMode);
      const checked = item.props.checked ? 'checked' : '';
      return `${spaces}<label${cls}>\n${spaces}  <div class=\"relative inline-block w-10 h-6 bg-gray-300 rounded-full transition-colors\">\n${spaces}    <input type=\"checkbox\" class=\"sr-only\" ${checked} />\n${spaces}    <div class=\"absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform\"></div>\n${spaces}  </div>\n${spaces}  <span class=\"text-sm\">${item.props.label || 'Switch'}</span>\n${spaces}</label>`;
    }

    case 'Checkbox': {
      const base = 'flex items-center gap-2 cursor-pointer';
      const cls = buildClassAttrHTML(item, base, styleMode);
      const checked = item.props.checked ? 'checked' : '';
      return `${spaces}<label${cls}>\n${spaces}  <input type=\"checkbox\" class=\"w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500\" ${checked} />\n${spaces}  <span class=\"text-sm\">${item.props.label || 'Checkbox'}</span>\n${spaces}</label>`;
    }

    case 'Separator':
      return item.props.orientation === 'vertical'
        ? `${spaces}<div class=\"w-px h-full bg-gray-300\"></div>`
        : `${spaces}<hr class=\"border-gray-300\" />`;

    case 'Skeleton': {
      const base = 'space-y-3 animate-pulse';
      const cls = buildClassAttrHTML(item, base, styleMode);
      return `${spaces}<div${cls}>\n${spaces}  <div class=\"h-4 bg-gray-200 rounded w-3/4\"></div>\n${spaces}  <div class=\"h-4 bg-gray-200 rounded\"></div>\n${spaces}  <div class=\"h-4 bg-gray-200 rounded w-5/6\"></div>\n${spaces}</div>`;
    }

    default:
      return `${spaces}<!-- ${item.type} component -->`;
  }
}

/**
 * 生成 Vue 3 单文件组件 (SFC) 使用 Tailwind
 */
export function generateVueCode(items: ComponentItem[], theme: Theme, styleMode: StyleMode = 'inline'): string {
  const html = generateHTMLCode(items, theme, styleMode);
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const css = styleMode === 'external' ? generateExternalCSS(items) : '';

  return `<template>\n  <div class=\"p-8 space-y-4\" style=\"background-color: ${theme.background}; color: ${theme.foreground};\">\n${body.trim()}\n  </div>\n</template>\n\n<script setup>\n// Vue 3 SFC generated by Shadcn-Forge\n</script>\n\n<style scoped>\n${css}\n</style>`;
}

/**
 * 生成完整的可运行项目结构
 */
export function generateProjectStructure(items: ComponentItem[], theme: Theme, styleMode: StyleMode = 'inline'): Record<string, string> {
  const files: Record<string, string> = {
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

    'src/App.tsx': generateReactCode(items, theme, styleMode),

    'src/main.tsx': `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)`,

    'src/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --primary: ${theme.primary};\n  --background: ${theme.background};\n  --foreground: ${theme.foreground};\n  --muted: ${theme.muted};\n  --border: ${theme.border};\n  --radius: ${theme.radius};\n}`,

    'index.html': generateHTMLCode(items, theme, styleMode),

    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}`,

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

  // add external styles file if requested
  if (styleMode === 'external') {
    files['src/styles.css'] = generateExternalCSS(items);
    // ensure App imports styles.css in case generateReactCode didn't
    // generateReactCode already adds import './styles.css' when styleMode === 'external'
  }

  return files;
}