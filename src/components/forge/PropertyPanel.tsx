import { useEffect, useState } from 'react';
import { SlidersHorizontal, Code2, X, Sparkles, Loader2, ChevronDown, Maximize2, Copy, Check } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { COMPONENT_REGISTRY } from '@/config/components';
import { fetchAI } from '@/lib/ai';
import { ComponentItem, PropSchema, AIGeneratedComponent, Theme, Layout } from '@/types';
import { generateId } from '@/lib/utils';
import { generateComponentJSXSnippet } from '@/lib/codeGenerator';

type LocalRewriteMode = 'copy' | 'structure' | 'both';

interface LocalRewriteCandidate {
  summary?: string;
  targetProps?: Record<string, unknown>;
  children?: AIGeneratedComponent[];
}

interface LocalRewritePayload {
  summary?: string;
  targetProps?: Record<string, unknown>;
  children?: AIGeneratedComponent[];
  candidates?: LocalRewriteCandidate[];
}

interface PropDiffEntry {
  key: string;
  before: unknown;
  after: unknown;
  changed: boolean;
}

const LOCAL_REWRITE_MODE_OPTIONS: Array<{ value: LocalRewriteMode; label: string }> = [
  { value: 'copy', label: '改文案' },
  { value: 'structure', label: '改结构' },
  { value: 'both', label: '都改' }
];

const buildSchemaForLLM = () =>
  Object.entries(COMPONENT_REGISTRY).map(([type, config]) => ({
    type,
    name: config.name,
    availableProps: Object.keys(config.defaultProps),
    propSchema: config.propSchema || {}
  }));

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

const sanitizePropsForType = (type: string, rawProps: Record<string, unknown> | undefined) => {
  const config = COMPONENT_REGISTRY[type];
  return Object.entries(config.defaultProps).reduce<Record<string, unknown>>((acc, [key, defaultValue]) => {
    acc[key] = sanitizePropValue(rawProps?.[key], defaultValue, config.propSchema?.[key]);
    return acc;
  }, {});
};

const sanitizeChildren = (children: AIGeneratedComponent[] | undefined, parentId: string): ComponentItem[] => {
  if (!children) return [];

  return children.flatMap((child) => {
    const config = COMPONENT_REGISTRY[child.type];
    if (!config) return [];

    return [{
      id: generateId(),
      type: child.type,
      parentId,
      props: sanitizePropsForType(child.type, child.props)
    }];
  });
};

const normalizeLocalRewriteCandidates = (payload: LocalRewritePayload): LocalRewriteCandidate[] => {
  if (Array.isArray(payload.candidates)) {
    return payload.candidates.slice(0, 2);
  }

  return [{
    summary: payload.summary,
    targetProps: payload.targetProps,
    children: payload.children
  }];
};

const formatRecentAISession = (
  entries: ReturnType<typeof useForgeStore.getState>['aiSessionLog'],
  limit: number = 5
) => {
  const recent = entries.slice(-limit);
  if (recent.length === 0) return '无历史对话。';

  return recent
    .map((entry, index) => `${index + 1}. [${entry.scope}] ${entry.prompt} -> ${entry.resultSummary}`)
    .join('\n');
};

const renderLocalCandidatePreview = (
  activeComponent: ComponentItem,
  candidate: LocalRewriteCandidate,
  theme: Theme,
  layout: Layout
) => {
  const config = COMPONENT_REGISTRY[activeComponent.type];
  if (!config) return null;

  const previewItem: ComponentItem = {
    ...activeComponent,
    props: sanitizePropsForType(activeComponent.type, candidate.targetProps)
  };

  const previewLayout: Layout = {
    ...layout,
    gap: 12,
    padding: 16
  };

  if (activeComponent.type === 'Card') {
    const childItems = sanitizeChildren(candidate.children, previewItem.id);
    const childNodes = childItems.map((child) => {
      const childConfig = COMPONENT_REGISTRY[child.type];
      if (!childConfig) return null;

      return (
        <div key={child.id} className="w-full">
          {childConfig.render(child.props, theme, previewLayout, child)}
        </div>
      );
    });

    return config.render(
      {
        ...previewItem.props,
        __children: childNodes
      },
      theme,
      previewLayout,
      previewItem
    );
  }

  return config.render(previewItem.props, theme, previewLayout, previewItem);
};

const renderComponentPreview = (
  component: ComponentItem,
  theme: Theme,
  layout: Layout,
  children?: ComponentItem[]
) => {
  const config = COMPONENT_REGISTRY[component.type];
  if (!config) return null;

  const previewLayout: Layout = {
    ...layout,
    gap: 12,
    padding: 16
  };

  if (component.type === 'Card') {
    const childNodes = (children ?? []).map((child) => {
      const childConfig = COMPONENT_REGISTRY[child.type];
      if (!childConfig) return null;

      return (
        <div key={child.id} className="w-full">
          {childConfig.render(child.props, theme, previewLayout, child)}
        </div>
      );
    });

    return config.render(
      {
        ...component.props,
        __children: childNodes
      },
      theme,
      previewLayout,
      component
    );
  }

  return config.render(component.props, theme, previewLayout, component);
};

const PREVIEW_SCALE = 0.62;

const formatDiffValue = (value: unknown): string => {
  if (value === undefined) return '未设置';
  if (value === null) return 'null';
  if (typeof value === 'string') return value || '空字符串';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 80 ? `${serialized.slice(0, 80)}...` : serialized;
  } catch {
    return String(value);
  }
};

const getPropDiffEntries = (activeComponent: ComponentItem, candidate: LocalRewriteCandidate): PropDiffEntry[] => {
  const nextProps = sanitizePropsForType(activeComponent.type, candidate.targetProps);
  const keys = Array.from(new Set([...Object.keys(activeComponent.props), ...Object.keys(nextProps)]));

  return keys
    .map((key) => ({
      key,
      before: activeComponent.props[key],
      after: nextProps[key],
      changed: activeComponent.props[key] !== nextProps[key]
    }))
    .sort((a, b) => Number(b.changed) - Number(a.changed));
};

const getCardStructureDiff = (currentChildren: ComponentItem[], candidateChildren?: AIGeneratedComponent[]) => {
  if (!candidateChildren) {
    return {
      changed: false,
      lines: ['未调整子组件结构']
    };
  }

  const currentTypes = currentChildren.map((child) => child.type);
  const nextTypes = candidateChildren.map((child) => child.type);
  const lines: string[] = [];

  if (currentTypes.length !== nextTypes.length) {
    lines.push(`数量：${currentTypes.length} → ${nextTypes.length}`);
  }

  const currentTypeSet = new Set(currentTypes);
  const nextTypeSet = new Set(nextTypes);

  const addedTypes = Array.from(nextTypeSet).filter((type) => !currentTypeSet.has(type));
  const removedTypes = Array.from(currentTypeSet).filter((type) => !nextTypeSet.has(type));

  if (addedTypes.length > 0) {
    lines.push(`新增类型：${addedTypes.join('、')}`);
  }

  if (removedTypes.length > 0) {
    lines.push(`移除类型：${removedTypes.join('、')}`);
  }

  if (lines.length === 0) {
    lines.push('结构无明显变化（可能仅调整了 props）');
  }

  return {
    changed: lines.some((line) => !line.includes('无明显变化') && !line.includes('未调整')),
    lines
  };
};

const getCandidateDiffSummary = (
  activeComponent: ComponentItem,
  candidate: LocalRewriteCandidate,
  currentChildCount: number = 0
): string[] => {
  const nextProps = sanitizePropsForType(activeComponent.type, candidate.targetProps);
  const changedKeys = Object.keys(nextProps).filter((key) => activeComponent.props[key] !== nextProps[key]);
  const summary: string[] = [];

  if (changedKeys.length > 0) {
    summary.push(`调整 props：${changedKeys.slice(0, 4).join('、')}${changedKeys.length > 4 ? ' 等' : ''}`);
  }

  if (activeComponent.type === 'Card') {
    const nextChildCount = candidate.children?.length ?? 0;

    if (candidate.children && nextChildCount !== currentChildCount) {
      summary.push(`重构子组件：${nextChildCount} 个`);
    }

    if (candidate.children && nextChildCount > 0) {
      const childTypes = candidate.children.slice(0, 4).map((child) => child.type).join('、');
      summary.push(`新增结构：${childTypes}${nextChildCount > 4 ? ' 等' : ''}`);
    }
  }

  if (summary.length === 0) {
    summary.push('主要优化了文案语气和信息表达。');
  }

  return summary.slice(0, 3);
};

export const PropertyPanel: React.FC = () => {
  const {
    layout,
    canvasItems,
    activeComponentId,
    setActiveComponentId,
    updateComponentProp,
    replaceComponentProps,
    replaceCardChildren,
    theme,
    aiSessionLog,
    appendAISessionEntry
  } = useForgeStore();

  const [rewritingKey, setRewritingKey] = useState<string | null>(null);
  const [localAiPrompt, setLocalAiPrompt] = useState('');
  const [localAiLoading, setLocalAiLoading] = useState(false);
  const [localAiError, setLocalAiError] = useState<string | null>(null);
  const [localAiExpanded, setLocalAiExpanded] = useState(false);
  const [localAiMode, setLocalAiMode] = useState<LocalRewriteMode>('both');
  const [localAiCandidates, setLocalAiCandidates] = useState<LocalRewriteCandidate[]>([]);
  const [focusedCandidateIndex, setFocusedCandidateIndex] = useState<number | null>(null);
  const [previewCandidateIndex, setPreviewCandidateIndex] = useState<number | null>(null);
  const [previewCompareMode, setPreviewCompareMode] = useState(false);
  const [candidateFollowupPrompt, setCandidateFollowupPrompt] = useState('');
  const [candidateFollowupLoading, setCandidateFollowupLoading] = useState(false);
  const [candidateFollowupError, setCandidateFollowupError] = useState<string | null>(null);
  const [copiedJSX, setCopiedJSX] = useState(false);

  const activeComponent = canvasItems.find((item) => item.id === activeComponentId);

  useEffect(() => {
    setLocalAiPrompt('');
    setLocalAiError(null);
    setLocalAiCandidates([]);
    setLocalAiExpanded(false);
    setLocalAiMode('both');
    setFocusedCandidateIndex(null);
    setPreviewCandidateIndex(null);
    setPreviewCompareMode(false);
    setCandidateFollowupPrompt('');
    setCandidateFollowupError(null);
  }, [activeComponentId]);

  useEffect(() => {
    setPreviewCompareMode(false);
    setCandidateFollowupPrompt('');
    setCandidateFollowupError(null);
  }, [previewCandidateIndex]);

  if (!activeComponent) return null;

  const currentCardChildren = canvasItems.filter((item) => item.parentId === activeComponent.id);
  const previewCandidate = previewCandidateIndex !== null ? localAiCandidates[previewCandidateIndex] : null;
  const propDiffEntries = previewCandidate ? getPropDiffEntries(activeComponent, previewCandidate) : [];
  const changedPropCount = propDiffEntries.filter((entry) => entry.changed).length;
  const cardStructureDiff =
    activeComponent.type === 'Card' && previewCandidate
      ? getCardStructureDiff(currentCardChildren, previewCandidate.children)
      : null;

  const applyLocalCandidate = (candidate: LocalRewriteCandidate) => {
    const targetProps = sanitizePropsForType(activeComponent.type, candidate.targetProps);

    if (activeComponent.type === 'Card') {
      if (candidate.children) {
        const nextChildren = sanitizeChildren(candidate.children, activeComponent.id);
        replaceCardChildren(activeComponent.id, targetProps, nextChildren);
      } else {
        replaceComponentProps(activeComponent.id, targetProps);
      }
    } else {
      replaceComponentProps(activeComponent.id, targetProps);
    }

    setLocalAiCandidates([]);
    setLocalAiPrompt('');
    setFocusedCandidateIndex(null);
    setPreviewCandidateIndex(null);
  };

  const handleCopyComponentJSX = async () => {
    try {
      const snippet = generateComponentJSXSnippet(activeComponent, theme);
      await navigator.clipboard.writeText(snippet);
      setCopiedJSX(true);
      setTimeout(() => setCopiedJSX(false), 1500);
    } catch (error) {
      console.error('Copy JSX failed', error);
      setCopiedJSX(false);
    }
  };

  const handleLocalAIRewrite = async () => {
    if (!localAiPrompt.trim()) return;

    setLocalAiLoading(true);
    setLocalAiError(null);
    setLocalAiCandidates([]);

    try {
      const schemaForLLM = buildSchemaForLLM();
      const componentSchema = COMPONENT_REGISTRY[activeComponent.type];
      const promptMode = activeComponent.type === 'Card' ? 'card' : 'component';
      const aiSessionContext = formatRecentAISession(aiSessionLog);
      const modeInstruction =
        localAiMode === 'copy'
          ? '本次只优化文案与语义表达，尽量保持当前结构不变。除非必要，不要调整 children。'
          : localAiMode === 'structure'
            ? '本次重点优化结构与层级，可以调整 variant、size、字段组合；若当前是 Card，可改写 children 结构，但文案保持简洁。'
            : '本次同时优化文案与结构，允许调整 props 和 children，使结果更完整。';
      const sysPrompt = [
        '你是一个专业的 UI 局部改写助手。',
        '你只重写当前选中的单个组件或卡片，不要生成整页。',
        '你必须生成 2 个不同方向但都合理的候选方案。',
        `当前主题色：primary=${theme.primary}, secondary=${theme.secondary}, background=${theme.background}, foreground=${theme.foreground}。`,
        `当前选中组件类型：${activeComponent.type}。`,
        `当前组件默认 props schema：${JSON.stringify({
          type: activeComponent.type,
          availableProps: Object.keys(componentSchema.defaultProps),
          propSchema: componentSchema.propSchema || {}
        })}`,
        promptMode === 'card'
          ? '输出必须是严格 JSON 对象，格式为 {"candidates": [{"summary": string, "targetProps": object, "children": [{"type": string, "props": object}]?}, {...}] }。children 表示卡片内的新子组件。'
          : '输出必须是严格 JSON 对象，格式为 {"candidates": [{"summary": string, "targetProps": object}, {...}] }。不要包含 children。',
        `最近会话上下文（用于保持连续意图）：\n${aiSessionContext}`,
        '每个 summary 必须是一句短说明，用来区分两个候选方案。',
        modeInstruction,
        '如果用户没有要求修改某些属性，可以保持语义上合理即可。',
        '文案要更专业、统一、简洁，按钮和说明文字要有主次层级。',
        `所有可用组件 schema：${JSON.stringify(schemaForLLM)}`
      ].join('\n');

      const raw = await fetchAI(localAiPrompt, sysPrompt, 'application/json');
      const parsed = JSON.parse(raw) as LocalRewritePayload;

      const candidates = normalizeLocalRewriteCandidates(parsed)
        .map((candidate) => ({
          summary: candidate.summary,
          targetProps: sanitizePropsForType(activeComponent.type, candidate.targetProps),
          children: candidate.children
        }))
        .filter((candidate) => Object.keys(candidate.targetProps || {}).length > 0)
        .slice(0, 2);

      if (candidates.length === 0) {
        throw new Error('AI 没有生成可用候选方案，请换个更具体的描述重试。');
      }

      setLocalAiCandidates(candidates);
      appendAISessionEntry({
        scope: 'local',
        prompt: localAiPrompt,
        resultSummary: `生成 ${candidates.length} 个局部候选`,
        componentType: activeComponent.type
      });
    } catch (error) {
      console.error('Local AI rewrite failed', error);
      setLocalAiError(error instanceof Error ? error.message : '局部 AI 重构失败，请重试');
    } finally {
      setLocalAiLoading(false);
    }
  };

  const handleFollowupRefine = async () => {
    if (previewCandidateIndex === null || !candidateFollowupPrompt.trim()) return;

    const baseCandidate = localAiCandidates[previewCandidateIndex];
    if (!baseCandidate) return;

    setCandidateFollowupLoading(true);
    setCandidateFollowupError(null);

    try {
      const componentSchema = COMPONENT_REGISTRY[activeComponent.type];
      const promptMode = activeComponent.type === 'Card' ? 'card' : 'component';
      const aiSessionContext = formatRecentAISession(aiSessionLog);
      const sysPrompt = [
        '你是一个专业的 UI 局部改写助手。',
        '你的任务是基于现有候选方案做一次微调，而不是重新生成完全无关的新方案。',
        `当前选中组件类型：${activeComponent.type}。`,
        `当前主题色：primary=${theme.primary}, secondary=${theme.secondary}, background=${theme.background}, foreground=${theme.foreground}。`,
        `当前组件默认 props schema：${JSON.stringify({
          type: activeComponent.type,
          availableProps: Object.keys(componentSchema.defaultProps),
          propSchema: componentSchema.propSchema || {}
        })}`,
        `最近会话上下文（用于保持连续意图）：\n${aiSessionContext}`,
        `基准候选方案：${JSON.stringify(baseCandidate)}`,
        promptMode === 'card'
          ? '输出必须是严格 JSON 对象，格式为 {"summary": string, "targetProps": object, "children": [{"type": string, "props": object}]? }。'
          : '输出必须是严格 JSON 对象，格式为 {"summary": string, "targetProps": object }。不要包含 children。',
        '只返回 JSON，不要解释。'
      ].join('\n');

      const raw = await fetchAI(candidateFollowupPrompt, sysPrompt, 'application/json');
      const parsed = JSON.parse(raw) as LocalRewritePayload;
      const nextCandidateRaw = normalizeLocalRewriteCandidates(parsed)[0] ?? parsed;

      const nextCandidate: LocalRewriteCandidate = {
        summary: nextCandidateRaw.summary,
        targetProps: sanitizePropsForType(activeComponent.type, nextCandidateRaw.targetProps),
        children: nextCandidateRaw.children
      };

      setLocalAiCandidates((prev) =>
        prev.map((candidate, index) => (index === previewCandidateIndex ? nextCandidate : candidate))
      );
      setFocusedCandidateIndex(previewCandidateIndex);
      appendAISessionEntry({
        scope: 'local',
        prompt: candidateFollowupPrompt,
        resultSummary: `优化候选方案 ${previewCandidateIndex + 1}`,
        componentType: activeComponent.type
      });
      setCandidateFollowupPrompt('');
    } catch (error) {
      console.error('Candidate follow-up refine failed', error);
      setCandidateFollowupError(error instanceof Error ? error.message : '继续优化失败，请重试');
    } finally {
      setCandidateFollowupLoading(false);
    }
  };

  const handleAIRewrite = async (id: string, propKey: string, currentValue: unknown) => {
    if (!currentValue || typeof currentValue !== 'string') return;
    setRewritingKey(propKey);
    try {
      const sysPrompt =
        '你是一个资深的UX文案专家。请将用户提供的UI文案重写得更加专业、自然、简练，适合用于现代Web应用。直接返回修改后的文本，不要带有任何引号或多余解释。';
      const newText = await fetchAI(currentValue, sysPrompt, 'text/plain');
      if (newText) updateComponentProp(id, propKey, newText.trim());
    } catch (err) {
      console.error('Rewrite failed', err);
    } finally {
      setRewritingKey(null);
    }
  };

  return (
    <aside
      className="relative w-[320px] border-l border-slate-200 dark:border-slate-800/60 flex flex-col z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] transition-all animate-in slide-in-from-right-8 flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
      style={{ backgroundColor: layout.appBg }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
          <SlidersHorizontal size={16} />
          {COMPONENT_REGISTRY[activeComponent.type].name}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyComponentJSX}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
            title="复制当前组件 JSX"
          >
            {copiedJSX ? <Check size={12} /> : <Copy size={12} />}
            {copiedJSX ? '已复制' : '复制 JSX'}
          </button>
          <button
            onClick={() => setActiveComponentId(null)}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-md"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Props Editor */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 custom-scrollbar">
        <div className="rounded-xl border border-purple-200 bg-purple-50/70 dark:border-purple-900/40 dark:bg-purple-950/20">
          <button
            type="button"
            onClick={() => setLocalAiExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-300">
                <Sparkles size={12} />
                {activeComponent.type === 'Card' ? 'AI 局部重构卡片' : 'AI 局部重构组件'}
              </div>
              <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {localAiExpanded
                  ? (activeComponent.type === 'Card' ? '会重写卡片 props，并替换卡片内子组件。' : '会重写当前组件 props，不影响其他组件。')
                  : '展开后可对当前选中区域做局部 AI 改写。'}
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`shrink-0 text-purple-500 transition-transform ${localAiExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {localAiExpanded && (
            <div className="space-y-3 border-t border-purple-200/70 px-5 pb-5 pt-4 dark:border-purple-900/30">
              <div className="flex gap-2 rounded-xl bg-white/70 p-1 dark:bg-slate-900/60">
                {LOCAL_REWRITE_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLocalAiMode(option.value)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ${
                      localAiMode === option.value
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <textarea
                value={localAiPrompt}
                onChange={(e) => setLocalAiPrompt(e.target.value)}
                disabled={localAiLoading}
                placeholder={activeComponent.type === 'Card' ? '例如：把这个卡片改成登录卡片，包含邮箱、密码和主次按钮' : '例如：把这个按钮改成更专业的确认按钮'}
                className="min-h-[84px] w-full resize-y rounded-md border border-purple-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-purple-500 dark:border-purple-900/40 dark:bg-slate-900 dark:text-slate-200"
              />
              <button
                onClick={handleLocalAIRewrite}
                disabled={localAiLoading || !localAiPrompt.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              >
                {localAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {localAiLoading ? '生成候选中...' : '生成 2 个方案'}
              </button>
              {localAiError && <div className="text-[10px] text-red-500">{localAiError}</div>}
              {localAiCandidates.length > 0 && (
                <div className="space-y-3 pt-1">
                  {localAiCandidates.map((candidate, index) => (
                    <div
                      key={`${candidate.summary || 'candidate'}-${index}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setFocusedCandidateIndex(index);
                        setPreviewCandidateIndex(index);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setFocusedCandidateIndex(index);
                          setPreviewCandidateIndex(index);
                        }
                      }}
                      className={`group block w-full cursor-pointer rounded-2xl border bg-white/80 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/70 ${
                        focusedCandidateIndex === index
                          ? 'border-purple-500 ring-2 ring-purple-500/20 dark:border-purple-400'
                          : 'border-purple-200 hover:border-purple-400 dark:border-purple-900/40'
                      }`}
                    >
                      <div className="space-y-3">
                        <div
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 transition-colors group-hover:border-purple-300 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900"
                          style={{ height: '172px' }}
                        >
                          <div
                            className="h-full overflow-hidden p-3"
                            style={{ backgroundColor: theme.workspaceBg ?? theme.muted }}
                          >
                            <div
                              className="pointer-events-none"
                              style={{
                                transform: `scale(${PREVIEW_SCALE})`,
                                transformOrigin: 'top left',
                                width: `${100 / PREVIEW_SCALE}%`
                              }}
                            >
                              {renderLocalCandidatePreview(activeComponent, candidate, theme, layout)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500">
                                方案 {index + 1}
                              </div>
                              <div className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                                <Maximize2 size={10} />
                                预览
                              </div>
                            </div>
                            <div className="mt-1 text-xs font-medium leading-5 text-slate-700 dark:text-slate-200">
                              {candidate.summary || '局部重构候选方案'}
                            </div>
                            <div className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                              props {Object.keys(candidate.targetProps || {}).length} 项
                              {activeComponent.type === 'Card' && candidate.children ? `，子组件 ${candidate.children.length} 个` : ''}
                            </div>
                            <div className="mt-2 space-y-1">
                              {getCandidateDiffSummary(activeComponent, candidate, currentCardChildren.length).map((line) => (
                                <div key={line} className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                  {line}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              applyLocalCandidate(candidate);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                applyLocalCandidate(candidate);
                              }
                            }}
                            className="shrink-0 cursor-pointer rounded-xl bg-purple-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-purple-700"
                          >
                            应用
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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

      {previewCandidate && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[70] flex items-start justify-center bg-slate-950/45 p-4 pt-6 backdrop-blur-sm" onClick={() => setPreviewCandidateIndex(null)}>
          <div
            className="flex max-h-[calc(100vh-5.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500">
                  方案 {(previewCandidateIndex ?? 0) + 1}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {previewCandidate.summary || '局部重构候选方案'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCandidateIndex(null)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCompareMode(false)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    !previewCompareMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  方案预览
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCompareMode(true)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    previewCompareMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  对比当前
                </button>
              </div>

              <div
                className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900"
                style={{ backgroundColor: theme.workspaceBg ?? theme.muted }}
              >
                {previewCompareMode ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">变更点</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        props 变化 {changedPropCount}
                      </span>
                      {activeComponent.type === 'Card' && cardStructureDiff && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            cardStructureDiff.changed
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                          }`}
                        >
                          {cardStructureDiff.changed ? '结构已调整' : '结构基本不变'}
                        </span>
                      )}
                    </div>

                    {activeComponent.type === 'Card' && cardStructureDiff && (
                      <div className="space-y-1 rounded-2xl border border-purple-200 bg-purple-50/60 p-3 dark:border-purple-900/40 dark:bg-purple-900/20">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500">结构对比</div>
                        {cardStructureDiff.lines.map((line) => (
                          <div key={line} className="text-xs leading-5 text-slate-600 dark:text-slate-300">{line}</div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/40 dark:bg-slate-950">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">当前</div>
                      {renderComponentPreview(activeComponent, theme, layout, currentCardChildren)}
                      <div className="mt-3 space-y-1">
                        {propDiffEntries.slice(0, 8).map((entry) => (
                          <div
                            key={`current-${entry.key}`}
                            className={`grid grid-cols-[90px_1fr] items-start gap-2 rounded-lg px-2 py-1.5 text-[10px] ${
                              entry.changed
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'
                                : 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                            }`}
                          >
                            <div className="truncate font-semibold">{entry.key}</div>
                            <div className="truncate">{formatDiffValue(entry.before)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-purple-200 bg-white p-4 dark:border-purple-900/40 dark:bg-slate-950">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-purple-500">方案</div>
                      {renderLocalCandidatePreview(activeComponent, previewCandidate, theme, layout)}
                      <div className="mt-3 space-y-1">
                        {propDiffEntries.slice(0, 8).map((entry) => (
                          <div
                            key={`candidate-${entry.key}`}
                            className={`grid grid-cols-[90px_1fr] items-start gap-2 rounded-lg px-2 py-1.5 text-[10px] ${
                              entry.changed
                                ? 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
                                : 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                            }`}
                          >
                            <div className="truncate font-semibold">{entry.key}</div>
                            <div className="truncate">{formatDiffValue(entry.after)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>
                ) : (
                  renderLocalCandidatePreview(activeComponent, previewCandidate, theme, layout)
                )}
              </div>
              <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  变化摘要
                </div>
                {getCandidateDiffSummary(activeComponent, previewCandidate, currentCardChildren.length).map((line) => (
                  <div key={line} className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 rounded-2xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-900/40 dark:bg-purple-900/20">
                <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500">
                  继续优化这个方案
                </div>
                <textarea
                  value={candidateFollowupPrompt}
                  onChange={(event) => setCandidateFollowupPrompt(event.target.value)}
                  disabled={candidateFollowupLoading}
                  placeholder="例如：这个方案再简洁一点，按钮文案更短"
                  className="min-h-[72px] w-full resize-y rounded-md border border-purple-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-purple-500 dark:border-purple-900/40 dark:bg-slate-900 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleFollowupRefine}
                  disabled={candidateFollowupLoading || !candidateFollowupPrompt.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                >
                  {candidateFollowupLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {candidateFollowupLoading ? '优化中...' : '继续优化'}
                </button>
                {candidateFollowupError && (
                  <div className="text-[10px] text-red-500">{candidateFollowupError}</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                props {Object.keys(previewCandidate.targetProps || {}).length} 项
                {activeComponent.type === 'Card' && previewCandidate.children ? `，子组件 ${previewCandidate.children.length} 个` : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCandidateIndex(null)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={() => applyLocalCandidate(previewCandidate)}
                  className="rounded-xl bg-purple-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-purple-700"
                >
                  应用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};