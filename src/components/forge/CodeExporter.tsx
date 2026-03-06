import React, { useState, useMemo } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { generateReactCode, generateHTMLCode } from '@/lib/codeGenerator';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/themes/prism-tomorrow.css';

export const CodeExporter: React.FC = () => {
  const { canvasItems, theme } = useForgeStore();
  const [codeType, setCodeType] = useState<'react' | 'html'>('react');
  const [copied, setCopied] = useState(false);

  // 生成代码
  const code = useMemo(() => {
    return codeType === 'react' 
      ? generateReactCode(canvasItems, theme)
      : generateHTMLCode(canvasItems, theme);
  }, [codeType, canvasItems, theme]);

  // 高亮代码
  const highlightedCode = useMemo(() => {
    try {
      return Prism.highlight(
        code,
        codeType === 'react' ? Prism.languages.tsx : Prism.languages.html,
        codeType === 'react' ? 'tsx' : 'html'
      );
    } catch (error) {
      console.error('代码高亮失败:', error);
      return code;
    }
  }, [code, codeType]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = codeType === 'react' ? 'Component.tsx' : 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setCodeType('react')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              codeType === 'react'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            React + TypeScript
          </button>
          <button
            onClick={() => setCodeType('html')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              codeType === 'html'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            HTML + Tailwind
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? '已复制' : '复制代码'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all shadow-sm"
          >
            <Download size={14} />
            下载文件
          </button>
        </div>
      </div>

      {/* 代码显示区域 */}
      <div className="overflow-auto max-h-[600px] custom-scrollbar">
        <pre className="p-6 text-xs leading-relaxed">
          <code
            className={`language-${codeType === 'react' ? 'tsx' : 'html'}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
};