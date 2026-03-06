import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { fetchGemini } from '@/lib/gemini';
import { COMPONENT_REGISTRY } from '@/config/components';
import { generateId } from '@/lib/utils';
import { AIGeneratedComponent, AIComponentSchema, ComponentItem } from '@/types';

export const AIPrompt: React.FC = () => {
  const { layout, appendComponents } = useForgeStore();
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAIGenerate = async () => {
    if (!aiPromptText.trim()) return;
    
    setIsGenerating(true);
    setAiError(null);
    
    try {
      const schemaForLLM: AIComponentSchema[] = Object.keys(COMPONENT_REGISTRY).map(key => ({
        type: key,
        availableProps: Object.keys(COMPONENT_REGISTRY[key].defaultProps)
      }));
      
      const sysPrompt = `你是一个专业的无代码UI工程师。用户将描述他们想要的界面，你需要使用以下可用组件：\n${JSON.stringify(schemaForLLM)}。\n注意：Button文本放在'children'中，Card文本放在'title'和'description'中。不要使用不存在的组件。你的输出必须是严格的合法的JSON数组格式，仅包含组件对象，不包含其他Markdown标记。例如：[{"type": "Card", "props": {"title": "登录", "description": "请输入密码"}}]`;
      
      const jsonStr = await fetchGemini(aiPromptText, sysPrompt, "application/json");
      if (!jsonStr) throw new Error("空响应");
      
      const parsedItems: AIGeneratedComponent[] = JSON.parse(jsonStr);
      const validItems: ComponentItem[] = parsedItems
        .filter((item: AIGeneratedComponent) => COMPONENT_REGISTRY[item.type])
        .map((item: AIGeneratedComponent) => ({
          id: generateId(),
          type: item.type,
          props: { ...COMPONENT_REGISTRY[item.type].defaultProps, ...item.props }
        }));

      if (validItems.length > 0) {
        appendComponents(validItems);
        setAiPromptText('');
        setShowAiPrompt(false);
      } else {
        throw new Error("解析组件失败");
      }
    } catch (err) {
      console.error(err);
      setAiError("网络错误或返回格式异常，请重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  // AI 输入展开区（使用 Portal 渲染到外部）
  const inputArea = (
    <div 
      className={`w-full border-b border-slate-200 dark:border-slate-800/60 shadow-lg transition-all duration-300 overflow-hidden z-10 ${
        showAiPrompt ? 'h-16 opacity-100' : 'h-0 opacity-0 border-transparent'
      }`} 
      style={{ backgroundColor: layout.appBg }}
    >
      <div className="flex items-center h-full px-6 max-w-4xl mx-auto gap-4">
        <Sparkles size={20} className="text-purple-500 shrink-0" />
        <input 
          type="text" 
          value={aiPromptText}
          onChange={(e) => setAiPromptText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAIGenerate(); }}
          placeholder="描述想要生成的界面，例如：生成一个登录卡片，包含用户名输入框、密码输入框和登录按钮..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          disabled={isGenerating}
        />
        <button 
          onClick={handleAIGenerate}
          disabled={isGenerating || !aiPromptText.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2"
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {isGenerating ? '正在思考并构建...' : '生成 UI'}
        </button>
      </div>
      {aiError && (
        <div className="absolute bottom-1 right-6 text-[10px] text-red-500">
          {aiError}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* AI 智能构建按钮 */}
      <button 
        onClick={() => setShowAiPrompt(!showAiPrompt)}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md border ${
          showAiPrompt 
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700/50 ring-2 ring-purple-500/20' 
            : 'bg-white dark:bg-slate-800 text-purple-500 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700'
        }`}
      >
        <Wand2 size={14} className={isGenerating ? "animate-pulse" : ""} /> 
        <span className="hidden sm:inline">AI 智能构建</span>
      </button>

      {/* 使用 Portal 将输入区渲染到 body，但保持在组件内管理 */}
      {typeof window !== 'undefined' && createPortal(
        inputArea,
        document.getElementById('ai-prompt-portal') || document.body
      )}
    </>
  );
};