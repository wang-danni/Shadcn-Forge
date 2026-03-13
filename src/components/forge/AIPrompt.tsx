import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { fetchAI } from '@/lib/ai';
import { COMPONENT_REGISTRY } from '@/config/components';
import { generateId } from '@/lib/utils';
import { AIGeneratedComponent, ComponentItem, PropSchema } from '@/types';

type RegistryEntry = typeof COMPONENT_REGISTRY[string];

interface LLMComponentSchema {
  type: string;
  name: string;
  category: string;
  availableProps: string[];
  propSchema: Record<string, PropSchema>;
}

type AIGenerationLanguage = 'zh-CN' | 'en-US';

const LANGUAGE_OPTIONS: Array<{
  value: AIGenerationLanguage;
  label: string;
  promptLabel: string;
  example: string;
}> = [
  {
    value: 'zh-CN',
    label: '中文',
    promptLabel: '简体中文',
    example: '[{"type":"Badge","props":{"text":"欢迎回来","variant":"secondary"}},{"type":"Card","props":{"title":"登录到工作台","description":"输入账号信息后继续"}},{"type":"Input","props":{"placeholder":"邮箱地址","type":"email"}},{"type":"Input","props":{"placeholder":"密码","type":"password"}},{"type":"Checkbox","props":{"label":"记住我","checked":true}},{"type":"Button","props":{"children":"立即登录","variant":"default","size":"default"}},{"type":"Separator","props":{"orientation":"horizontal"}},{"type":"Button","props":{"children":"使用短信验证码登录","variant":"outline","size":"default"}}]'
  },
  {
    value: 'en-US',
    label: 'English',
    promptLabel: 'English',
    example: '[{"type":"Badge","props":{"text":"Welcome back","variant":"secondary"}},{"type":"Card","props":{"title":"Sign in to your workspace","description":"Enter your account details to continue"}},{"type":"Input","props":{"placeholder":"Email address","type":"email"}},{"type":"Input","props":{"placeholder":"Password","type":"password"}},{"type":"Checkbox","props":{"label":"Remember me","checked":true}},{"type":"Button","props":{"children":"Sign in now","variant":"default","size":"default"}},{"type":"Separator","props":{"orientation":"horizontal"}},{"type":"Button","props":{"children":"Use magic code instead","variant":"outline","size":"default"}}]'
  }
];

const inferComponentBudget = (prompt: string) => {
  const normalizedPrompt = prompt.trim().toLowerCase();

  const complexKeywords = [
    '登录',
    '注册',
    '表单',
    '后台',
    '仪表盘',
    'dashboard',
    'login',
    'sign in',
    'sign-in',
    'signup',
    'sign up',
    'form',
    'checkout'
  ];

  const richKeywords = ['多一点', '丰富', '完整', '更多', 'detailed', 'detailed ui', 'richer', 'more components'];

  const wantsComplexLayout = complexKeywords.some((keyword) => normalizedPrompt.includes(keyword));
  const wantsRicherOutput = richKeywords.some((keyword) => normalizedPrompt.includes(keyword));

  if (wantsComplexLayout && wantsRicherOutput) {
    return { min: 10, max: 14, hardLimit: 16 };
  }

  if (wantsComplexLayout) {
    return { min: 8, max: 12, hardLimit: 14 };
  }

  if (wantsRicherOutput) {
    return { min: 7, max: 11, hardLimit: 14 };
  }

  return { min: 6, max: 10, hardLimit: 12 };
};

const extractJsonPayload = (raw: string): string => {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const arrayStart = withoutFence.indexOf('[');
  const arrayEnd = withoutFence.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return withoutFence.slice(arrayStart, arrayEnd + 1);
  }

  const objectStart = withoutFence.indexOf('{');
  const objectEnd = withoutFence.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return withoutFence.slice(objectStart, objectEnd + 1);
  }

  return withoutFence;
};

const parseBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

const sanitizePropValue = (value: unknown, fallback: unknown, schema?: PropSchema): unknown => {
  if (value === undefined || value === null) return fallback;

  if (schema?.type === 'number') {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return fallback;
    if (schema.min !== undefined && num < schema.min) return schema.min;
    if (schema.max !== undefined && num > schema.max) return schema.max;
    return num;
  }

  if (schema?.type === 'boolean') {
    return parseBoolean(value, typeof fallback === 'boolean' ? fallback : false);
  }

  if (schema?.type === 'select') {
    if (schema.options?.includes(value as never)) return value;
    return fallback;
  }

  if (schema?.type === 'string') {
    return typeof value === 'string' ? value : String(value);
  }

  if (typeof fallback === 'number') {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  if (typeof fallback === 'boolean') {
    return parseBoolean(value, fallback);
  }

  if (typeof fallback === 'string') {
    return typeof value === 'string' ? value : String(value);
  }

  return value;
};

const normalizeGeneratedComponents = (raw: string): AIGeneratedComponent[] => {
  const payload = extractJsonPayload(raw);
  const parsed = JSON.parse(payload) as AIGeneratedComponent[] | { components?: AIGeneratedComponent[] };

  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.components)) return parsed.components;

  throw new Error('AI 返回的 JSON 结构不符合要求');
};

const sanitizeGeneratedItem = (item: AIGeneratedComponent): ComponentItem | null => {
  const config: RegistryEntry | undefined = COMPONENT_REGISTRY[item.type];
  if (!config) return null;

  const rawProps = item.props && typeof item.props === 'object' ? item.props : {};
  const nextProps = Object.entries(config.defaultProps).reduce<Record<string, unknown>>((acc, [key, defaultValue]) => {
    acc[key] = sanitizePropValue(
      (rawProps as Record<string, unknown>)[key],
      defaultValue,
      config.propSchema?.[key]
    );
    return acc;
  }, {});

  return {
    id: generateId(),
    type: item.type,
    props: nextProps
  };
};

const buildSchemaForLLM = (): LLMComponentSchema[] =>
  Object.entries(COMPONENT_REGISTRY).map(([type, config]) => ({
    type,
    name: config.name,
    category: config.category,
    availableProps: Object.keys(config.defaultProps),
    propSchema: config.propSchema || {}
  }));

const getUserFacingError = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return '未配置 AI 提供商的 API Key。请检查 .env 中的 AI_API_KEY 或对应平台的密钥配置。';
    }
    if (error.message.includes('免费额度已用尽') || error.message.includes('quota')) {
      return error.message;
    }
    if (error.message.includes('JSON')) {
      return 'AI 返回的数据格式不正确，请重试。';
    }
    return error.message;
  }

  return '网络错误或返回格式异常，请重试。';
};

export const AIPrompt: React.FC = () => {
  const { layout, appendComponents } = useForgeStore();
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');
  const [generationLanguage, setGenerationLanguage] = useState<AIGenerationLanguage>('zh-CN');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAIGenerate = async () => {
    if (!aiPromptText.trim()) return;
    
    setIsGenerating(true);
    setAiError(null);
    
    try {
      const schemaForLLM = buildSchemaForLLM();
      const languageConfig = LANGUAGE_OPTIONS.find((option) => option.value === generationLanguage) || LANGUAGE_OPTIONS[0];
      const componentBudget = inferComponentBudget(aiPromptText);
      const sysPrompt = [
        '你是一个专业的无代码 UI 工程师。',
        '你的任务是根据用户描述，生成一个由现有组件组成的界面草图。',
        `所有面向最终用户的文案必须使用 ${languageConfig.promptLabel}，除非用户明确要求其他语言。`,
        '你只能使用下面 schema 中存在的组件 type，并且 props 只能使用 availableProps 或 propSchema 中定义的字段。',
        '输出必须是严格合法的 JSON 数组，不要返回 Markdown、注释、解释或代码块。',
        '每个数组元素格式必须是 {"type": string, "props": object}。',
        `本次优先生成更完整的界面，不要只输出最小可用结构。目标组件数量为 ${componentBudget.min} 到 ${componentBudget.max} 个。`,
        '如果是登录、注册、表单、结算、后台等界面，优先补齐标题、说明、输入项、状态项、分隔元素和次级操作。',
        '除非用户明确要求极简，否则尽量让结构更丰富一些。',
        '字段约束：Button 文本放到 children；Card 文本放到 title 和 description；Badge 文本放到 text；Alert 文本放到 title 和 description。',
        `当前可用组件 schema：${JSON.stringify(schemaForLLM)}`,
        `示例输出：${languageConfig.example}`
      ].join('\n');
      
      const jsonStr = await fetchAI(aiPromptText, sysPrompt, "application/json");
      if (!jsonStr) throw new Error("空响应");
      
      const parsedItems = normalizeGeneratedComponents(jsonStr).slice(0, componentBudget.hardLimit);
      const validItems = parsedItems
        .map(sanitizeGeneratedItem)
        .filter((item): item is ComponentItem => item !== null);

      if (validItems.length > 0) {
        appendComponents(validItems);
        setAiPromptText('');
        setShowAiPrompt(false);
      } else {
        throw new Error('AI 没有生成可用组件，请换个更具体的描述重试。');
      }
    } catch (err) {
      console.error(err);
      setAiError(getUserFacingError(err));
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
        <div className="flex shrink-0 rounded-full border border-slate-200 bg-white/80 p-1 dark:border-slate-700 dark:bg-slate-900/80">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGenerationLanguage(option.value)}
              disabled={isGenerating}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                generationLanguage === option.value
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
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
        <div className="absolute bottom-1 right-6 max-w-[60%] text-right text-[10px] text-red-500">
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