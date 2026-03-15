import React, { useState, useEffect } from 'react';
import { Toolbar } from '@/components/forge/Toolbar';
import { Sidebar } from '@/components/forge/Sidebar';
import { Canvas } from '@/components/forge/Canvas';
import { PropertyPanel } from '@/components/forge/PropertyPanel';
import { useForgeStore } from '@/store/forgeStore';

const App: React.FC = () => {
  const { isDarkMode, layout } = useForgeStore();
  const [activeTab, setActiveTab] = useState<'design' | 'inspect' | 'export'>('design');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── 全局键盘快捷键 ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户正在输入框/textarea 里，跳过
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const {
        activeComponentId,
        selectedComponentIds,
        removeComponent,
        removeSelectedComponents,
        copySelectedComponents,
        pasteClipboard,
        undo,
        redo,
        clearSelection
      } = useForgeStore.getState();

      // Delete / Backspace → 删除选中组件
      if ((e.key === 'Delete' || e.key === 'Backspace') && (activeComponentId || selectedComponentIds.length > 0)) {
        e.preventDefault();
        if (selectedComponentIds.length > 1) {
          removeSelectedComponents();
        } else if (activeComponentId) {
          removeComponent(activeComponentId);
        }
        return;
      }

      // Ctrl/Cmd + C → 复制选中组件到剪贴板
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && (activeComponentId || selectedComponentIds.length > 0)) {
        e.preventDefault();
        copySelectedComponents();
        return;
      }

      // Ctrl/Cmd + V → 粘贴剪贴板中的组件
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      // Ctrl/Cmd + Z → 撤销
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z  或  Ctrl/Cmd + Y → 重做
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Escape → 取消选中
      if (e.key === 'Escape' && (activeComponentId || selectedComponentIds.length > 0)) {
        e.preventDefault();
        clearSelection();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // ───────────────────────────────────────────────────────────────

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div 
        className="flex h-screen text-slate-800 dark:text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/30 transition-colors duration-300" 
        style={{ backgroundColor: layout.appBg }}
      >
        {/* 左侧边栏 */}
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)} />

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col relative overflow-hidden transition-colors duration-300">
          {/* 工具栏 */}
          <Toolbar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* 画布或代码导出 */}
          <Canvas activeTab={activeTab} />
          
          {/* 底部状态栏 */}
          <Footer />
        </main>

        {/* 右侧属性面板 */}
        <PropertyPanel />
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  const { layout, history, historyStep, canvasItems, clearCanvas } = useForgeStore();
  const canClear = canvasItems.length > 0;

  return (
    <footer 
      className="h-7 border-t border-slate-200 dark:border-slate-800/60 px-4 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest z-10 shrink-0" 
      style={{ backgroundColor: layout.appBg }}
    >
      <div className="flex gap-6">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          History: {historyStep}/{history.length - 1}
        </span>
        <span>Components: {canvasItems.length}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden md:flex items-center gap-3 text-slate-400 normal-case tracking-normal font-medium">
          <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono">Del</kbd>
          <span className="text-[9px]">删除</span>
          <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono">⌃C</kbd>
          <span className="text-[9px]">复制</span>
          <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono">⌃V</kbd>
          <span className="text-[9px]">粘贴</span>
          <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono">⌃Z</kbd>
          <span className="text-[9px]">撤销</span>
          <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono">Esc</kbd>
          <span className="text-[9px]">取消选中</span>
        </span>
        <button 
          onClick={() => {
            if (!canClear) return;
            if (window.confirm('确认要清空画布吗？此操作可通过撤销恢复。')) {
              clearCanvas();
            }
          }}
          disabled={!canClear}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-red-600 shadow-sm transition-colors hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
        >
          清空画布
        </button>
      </div>
    </footer>
  );
};

export default App;