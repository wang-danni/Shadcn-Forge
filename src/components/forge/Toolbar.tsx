import React, { useRef, useState } from 'react';
import { 
  MousePointer2, Terminal, Code2, Edit3, Play, 
  Undo2, Redo2, Sun, Moon, Upload, Download
} from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { TabButton } from '@/components/shared/TabButton';
import { AIPrompt } from '@/components/forge/AIPrompt';
import { ComponentItem } from '@/types';
import { generateProjectStructure } from '@/lib/codeGenerator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateId } from '@/lib/utils';
import { COMPONENT_REGISTRY } from '@/config/components';

interface ToolbarProps {
  activeTab: 'design' | 'inspect' | 'export';
  setActiveTab: (tab: 'design' | 'inspect' | 'export') => void;
}

interface ImportPreviewPayload {
  fileName: string;
  canvasItems: ComponentItem[];
  theme?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    layout, 
    theme,
    canvasItems,
    undo, 
    redo, 
    historyStep, 
    history,
    isPreviewMode,
    togglePreviewMode,
    loadFromSnapshot
  } = useForgeStore();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportPreviewPayload | null>(null);

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;


  const handleExportZip = async () => {
    try {
      const files = generateProjectStructure(canvasItems, theme, 'inline');
      const snapshot = {
        version: 1,
        exportedAt: new Date().toISOString(),
        theme,
        layout,
        canvasItems
      };

      const zip = new JSZip();
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content);
      });
      zip.file('snapshot.json', JSON.stringify(snapshot, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'shadcn-forge-export.zip');
    } catch (error) {
      console.error('Export zip failed', error);
      window.alert('导出 ZIP 失败，请重试。');
    }
  };

  const normalizeImportedItems = (rawItems: unknown): ComponentItem[] => {
    if (!Array.isArray(rawItems)) return [];

    const mapped = rawItems
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .filter((item) => typeof item.type === 'string' && !!COMPONENT_REGISTRY[item.type])
      .map((item) => {
        const type = item.type as string;
        const rawProps = typeof item.props === 'object' && item.props !== null ? item.props as Record<string, unknown> : structuredClone(COMPONENT_REGISTRY[type].defaultProps);
        const rawStyle = typeof item.style === 'object' && item.style !== null ? item.style as ComponentItem['style'] : undefined;

        return {
          id: typeof item.id === 'string' && item.id ? item.id : generateId(),
          type,
          parentId: typeof item.parentId === 'string' ? item.parentId : undefined,
          props: rawProps,
          style: rawStyle
        } as ComponentItem;
      });

    const ids = new Set(mapped.map((item) => item.id));
    return mapped.map((item) => ({
      ...item,
      parentId: item.parentId && ids.has(item.parentId) ? item.parentId : undefined
    }));
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;

      const canvasData = Array.isArray(payload)
        ? payload
        : (typeof payload === 'object' && payload !== null && Array.isArray((payload as { canvasItems?: unknown[] }).canvasItems)
            ? (payload as { canvasItems: unknown[] }).canvasItems
            : []);

      const normalizedItems = normalizeImportedItems(canvasData);

      if (normalizedItems.length === 0) {
        window.alert('JSON 中未找到可导入的组件数据。');
        return;
      }

      const themePatch = typeof payload === 'object' && payload !== null
        ? (payload as { theme?: Record<string, unknown> }).theme
        : undefined;
      const layoutPatch = typeof payload === 'object' && payload !== null
        ? (payload as { layout?: Record<string, unknown> }).layout
        : undefined;

      setPendingImport({
        fileName: file.name,
        canvasItems: normalizedItems,
        theme: themePatch,
        layout: layoutPatch
      });
    } catch (error) {
      console.error('Import json failed', error);
      window.alert('导入失败：请确认 JSON 格式正确。');
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;

    loadFromSnapshot({
      canvasItems: pendingImport.canvasItems,
      theme: pendingImport.theme,
      layout: pendingImport.layout
    });
    setPendingImport(null);
    setActiveTab('design');
    window.alert(`导入成功：${pendingImport.canvasItems.length} 个组件`);
  };

  const pendingCards = pendingImport?.canvasItems.filter((item) => item.type === 'Card').length ?? 0;
  const pendingTopLevel = pendingImport?.canvasItems.filter((item) => !item.parentId).length ?? 0;

  return (
    <>
      <div 
        className="h-14 border-b border-slate-200 dark:border-slate-800/60 px-6 flex items-center gap-6 backdrop-blur-xl relative" 
        style={{ 
          backgroundColor: layout.appBg + 'E6',
          zIndex: 90
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-inner">
          <TabButton 
            active={activeTab === 'design'} 
            onClick={() => setActiveTab('design')} 
            icon={<MousePointer2 size={14}/>} 
            label="画布模式" 
          />
          <TabButton 
            active={activeTab === 'inspect'} 
            onClick={() => setActiveTab('inspect')} 
            icon={<Terminal size={14}/>} 
            label="虚拟 DOM" 
          />
          <TabButton 
            active={activeTab === 'export'} 
            onClick={() => setActiveTab('export')} 
            icon={<Code2 size={14}/>} 
            label="导出代码" 
          />
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />

        {/* Middle: AI 智能构建按钮 */}
        <AIPrompt />

        {/* 弹性空间，将右侧控件推到最右边 */}
        <div className="flex-1" />

        {/* Right: Controls */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Preview Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
            <button 
              onClick={togglePreviewMode} 
              className={`p-1.5 rounded-md transition-all flex items-center gap-1.5 px-3 ${
                !isPreviewMode 
                  ? 'bg-white text-indigo-600 shadow' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Edit3 size={14}/> 
              <span className="text-xs font-bold hidden sm:inline">编辑</span>
            </button>
            <button 
              onClick={togglePreviewMode} 
              className={`p-1.5 rounded-md transition-all flex items-center gap-1.5 px-3 ${
                isPreviewMode 
                  ? 'bg-emerald-500 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Play size={14}/> 
              <span className="text-xs font-bold hidden sm:inline">预览</span>
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
            <button 
              onClick={undo} 
              disabled={!canUndo} 
              className="p-1.5 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <Undo2 size={14}/>
            </button>
            <button 
              onClick={redo} 
              disabled={!canRedo} 
              className="p-1.5 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <Redo2 size={14}/>
            </button>
          </div>

          {/* Viewport toggle removed for single-layout design */}

          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner hidden sm:flex">
            <button 
              onClick={toggleDarkMode} 
              className={`p-1.5 rounded-md transition-all ${
                !isDarkMode 
                  ? 'bg-white text-indigo-600 shadow' 
                  : 'text-slate-500'
              }`} 
              title="浅色模式"
            >
              <Sun size={14}/>
            </button>
            <button 
              onClick={toggleDarkMode} 
              className={`p-1.5 rounded-md transition-all ${
                isDarkMode 
                  ? 'bg-slate-700 text-white shadow' 
                  : 'text-slate-500'
              }`} 
              title="深色模式"
            >
              <Moon size={14}/>
            </button>
          </div>

          {/* Import/Export */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => importInputRef.current?.click()}
              className="p-1.5 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700"
              title="从 JSON 导入"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={handleExportZip}
              className="p-1.5 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700"
              title="导出 ZIP"
            >
              <Download size={14} />
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </div>
      </div>

      {/* Portal 挂载点 */}
      <div id="ai-prompt-portal" style={{ position: 'relative', zIndex: 10 }} />

      {pendingImport && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">确认导入 JSON</div>
            <div className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              文件：{pendingImport.fileName}
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">当前画布组件</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{canvasItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">导入后组件</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">{pendingImport.canvasItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">顶层组件</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{pendingTopLevel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">卡片组件</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{pendingCards}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">包含主题配置</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{pendingImport.theme ? '是' : '否'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">包含布局配置</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{pendingImport.layout ? '是' : '否'}</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] leading-5 text-amber-600 dark:text-amber-300">
              导入会覆盖当前画布并重置撤销历史。
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};