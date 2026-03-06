import { useState } from 'react';
import { SlidersHorizontal, Code2, X, Sparkles, Loader2 } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { COMPONENT_REGISTRY } from '@/config/components';
import { fetchGemini } from '@/lib/gemini';

export const PropertyPanel: React.FC = () => {
  const {
    layout,
    canvasItems,
    activeComponentId,
    setActiveComponentId,
    updateComponentProp
  } = useForgeStore();

  const [rewritingKey, setRewritingKey] = useState<string | null>(null);

  const activeComponent = canvasItems.find((item) => item.id === activeComponentId);

  if (!activeComponent) return null;

  const handleAIRewrite = async (id: string, propKey: string, currentValue: unknown) => {
    if (!currentValue || typeof currentValue !== 'string') return;
    setRewritingKey(propKey);
    try {
      const sysPrompt =
        '你是一个资深的UX文案专家。请将用户提供的UI文案重写得更加专业、自然、简练，适合用于现代Web应用。直接返回修改后的文本，不要带有任何引号或多余解释。';
      const newText = await fetchGemini(currentValue, sysPrompt, 'text/plain');
      if (newText) updateComponentProp(id, propKey, newText.trim());
    } catch (err) {
      console.error('Rewrite failed', err);
    } finally {
      setRewritingKey(null);
    }
  };

  return (
    <aside
      className="w-[320px] border-l border-slate-200 dark:border-slate-800/60 flex flex-col z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] transition-all animate-in slide-in-from-right-8 flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
      style={{ backgroundColor: layout.appBg }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
          <SlidersHorizontal size={16} />
          {COMPONENT_REGISTRY[activeComponent.type].name}
        </div>
        <button
          onClick={() => setActiveComponentId(null)}
          className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-md"
        >
          <X size={16} />
        </button>
      </div>

      {/* Props Editor */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          <Code2 size={12} />
          Props 编辑器
        </div>

        <div className="space-y-5">
          {Object.entries(activeComponent.props).map(([propKey, propValue]) => {
            const schema = COMPONENT_REGISTRY[activeComponent.type].propSchema?.[propKey];
            const valueType = typeof propValue;
            const isString = valueType === 'string' && propKey !== 'id' && propKey !== 'fallback';
            const isRewriting = rewritingKey === propKey;

            // Select input
            if (schema && schema.type === 'select' && schema.options) {
              return (
                <div key={propKey} className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {propKey}
                  </label>
                  <select
                    value={String(propValue)}
                    onChange={(e) =>
                      updateComponentProp(activeComponent.id, propKey, e.target.value)
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    {schema.options.map((opt) => (
                      <option key={String(opt)} value={String(opt)}>
                        {String(opt)}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            // Boolean toggle
            if (valueType === 'boolean') {
              return (
                <div key={propKey} className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {propKey}
                  </label>
                  <button
                    onClick={() =>
                      updateComponentProp(activeComponent.id, propKey, !propValue)
                    }
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      propValue
                        ? 'bg-indigo-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        propValue ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            }

            // Number slider
            if (valueType === 'number') {
              return (
                <div key={propKey} className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize flex justify-between">
                    {propKey}
                    <span className="text-indigo-500 font-mono">{String(propValue)}</span>
                  </label>
                  <input
                    type="range"
                    min={schema?.min || 0}
                    max={schema?.max || 100}
                    value={propValue as number}
                    onChange={(e) =>
                      updateComponentProp(
                        activeComponent.id,
                        propKey,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              );
            }

            // String input with AI rewrite
            if (valueType === 'string') {
              const stringValue = propValue as string;
              return (
                <div key={propKey} className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {propKey}
                    </label>
                    {isString && (
                      <button
                        onClick={() =>
                          handleAIRewrite(activeComponent.id, propKey, propValue)
                        }
                        disabled={isRewriting || !stringValue}
                        className="text-[10px] flex items-center gap-1 text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                        title="使用 AI 润色文案"
                      >
                        {isRewriting ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Sparkles size={10} />
                        )}
                        重写
                      </button>
                    )}
                  </div>
                  {stringValue.length > 20 || propKey === 'description' ? (
                    <textarea
                      value={stringValue}
                      onChange={(e) =>
                        updateComponentProp(activeComponent.id, propKey, e.target.value)
                      }
                      disabled={isRewriting}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 min-h-[80px] resize-y disabled:opacity-50"
                    />
                  ) : (
                    <input
                      type="text"
                      value={stringValue}
                      onChange={(e) =>
                        updateComponentProp(activeComponent.id, propKey, e.target.value)
                      }
                      disabled={isRewriting}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  )}
                </div>
              );
            }

            // Fallback for other types
            return (
              <div key={propKey} className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                  {propKey}
                </label>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {String(propValue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};