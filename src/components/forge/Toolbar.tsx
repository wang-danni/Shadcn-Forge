import React from 'react';
import { 
  MousePointer2, Terminal, Code2, Edit3, Play, 
  Undo2, Redo2, Sun, Moon 
} from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { TabButton } from '@/components/shared/TabButton';
import { AIPrompt } from '@/components/forge/AIPrompt';

interface ToolbarProps {
  activeTab: 'design' | 'inspect' | 'export';
  setActiveTab: (tab: 'design' | 'inspect' | 'export') => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    layout, 
    undo, 
    redo, 
    historyStep, 
    history,
    isPreviewMode,
    togglePreviewMode
  } = useForgeStore();

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  

  return (
    <>
      <div 
        className="h-14 border-b border-slate-200 dark:border-slate-800/60 px-6 flex items-center gap-6 backdrop-blur-xl relative" 
        style={{ 
          backgroundColor: layout.appBg + 'E6',
          zIndex: 30
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

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />

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
        </div>
      </div>

      {/* Portal 挂载点 */}
      <div id="ai-prompt-portal" style={{ position: 'relative', zIndex: 10 }} />
    </>
  );
};