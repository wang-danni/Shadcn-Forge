import { create } from 'zustand';
import { ForgeStore, ComponentItem } from '@/types';
import { THEME_PRESETS } from '@/config/themes';
import { COMPONENT_REGISTRY } from '@/config/components';
import { generateId } from '@/lib/utils';

const INITIAL_ITEMS: ComponentItem[] = [
  {
    id: generateId(),
    type: 'Alert',
    props: {
      title: '全局背景切换已恢复 ✨',
      description: '现在你可以通过"色彩与边界"面板,或者系统预设,完美改变整个项目的底色啦!',
      variant: 'default',
      width: 'full'
    }
  },
  {
    id: generateId(),
    type: 'Progress',
    props: {
      value: 100,
      label: '引擎修复进度',
      width: 'full'
    }
  },
  {
    id: generateId(),
    type: 'Button',
    props: {
      children: '开始构建项目',
      variant: 'default',
      size: 'default',
      width: 'auto'
    }
  }
];

export const useForgeStore = create<ForgeStore>((set, get) => ({
  isDarkMode: true,
  theme: {
    ...THEME_PRESETS.Default,
    background: '#09090b',
    foreground: '#f8fafc',
    primaryForeground: '#ffffff',
    mutedForeground: '#64748b',
    border: '#27272a',
    muted: '#18181b',
    radius: 8,
    borderWidth: 1
  },
  layout: {
    padding: 32,
    gap: 24,
    direction: 'column',
    align: 'center',
    backdrop: 'dots', 
    appBg: '#0c0a09',
    workspaceBg: '#050505',
    radius: 16,
    borderWidth: 1
  },
  canvasItems: INITIAL_ITEMS,
  activeComponentId: null,
  isPreviewMode: false,
  history: [INITIAL_ITEMS],
  historyStep: 0,

  _saveHistory: (newItems) => {
    const { history, historyStep } = get();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(JSON.parse(JSON.stringify(newItems)));
    return {
      canvasItems: newItems,
      history: newHistory,
      historyStep: newHistory.length - 1
    };
  },

  toggleDarkMode: () =>
    set((state) => {
      const isDark = !state.isDarkMode;
      return {
        isDarkMode: isDark,
        layout: {
          ...state.layout,
          appBg: isDark ? '#0c0a09' : '#ffffff',
          workspaceBg: isDark ? '#050505' : '#f1f5f9'
        },
        theme: {
          ...state.theme,
          background: isDark ? '#09090b' : '#ffffff',
          foreground: isDark ? '#f8fafc' : '#0f172a',
          border: isDark ? '#27272a' : '#e2e8f0',
          muted: isDark ? '#18181b' : '#f1f5f9'
        }
      };
    }),

  togglePreviewMode: () =>
    set((state) => ({
      isPreviewMode: !state.isPreviewMode,
      activeComponentId: null
    })),

  updateTheme: (updates) =>
    set((state) => ({
      theme: { ...state.theme, ...updates }
    })),

  applyPreset: (presetName) =>
    set((state) => {
      const preset = THEME_PRESETS[presetName];
      return {
        theme: { ...state.theme, ...preset },
        layout: {
          ...state.layout,
          appBg: preset.appBg || state.layout.appBg,
          workspaceBg: preset.workspaceBg || state.layout.workspaceBg
        },
        isDarkMode: preset.isDark ?? state.isDarkMode
      };
    }),

  updateLayout: (updates) =>
    set((state) => ({
      layout: { ...state.layout, ...updates }
    })),

  addComponent: (type) =>
    set((state) => {
      const newItem: ComponentItem = {
        id: generateId(),
        type,
        // 使用 structuredClone 深拷贝防止引用污染
        props: structuredClone(COMPONENT_REGISTRY[type].defaultProps)
      };
      const newItems = [...state.canvasItems, newItem];
      return {
        ...state._saveHistory(newItems),
        activeComponentId: newItem.id
      };
    }),
    
  updateComponentStyle: (id: string, styleUpdates: Partial<ComponentItem['style']>) =>
    set((state) => {
      const newItems = state.canvasItems.map((item) =>
        item.id === id
          ? {
              ...item,
              style: { ...item.style, ...styleUpdates }
            }
          : item
      );
      return state._saveHistory(newItems);
    }),

  appendComponents: (items) =>
    set((state) => {
      const newItems = [...state.canvasItems, ...items];
      return state._saveHistory(newItems);
    }),

  removeComponent: (id) =>
    set((state) => {
      const newItems = state.canvasItems.filter((item) => item.id !== id);
      return {
        ...state._saveHistory(newItems),
        activeComponentId: state.activeComponentId === id ? null : state.activeComponentId
      };
    }),

  duplicateComponent: (id) =>
    set((state) => {
      const itemToCopy = state.canvasItems.find((i) => i.id === id);
      if (!itemToCopy) return state;

      const newItem: ComponentItem = {
        ...itemToCopy,
        id: generateId(),
        // 深拷贝 props，防止原组件与副本修改互相影响
        props: structuredClone(itemToCopy.props)
      };

      const newItems = [...state.canvasItems];
      const index = state.canvasItems.findIndex((i) => i.id === id);
      newItems.splice(index + 1, 0, newItem);

      return {
        ...state._saveHistory(newItems),
        activeComponentId: newItem.id
      };
    }),

  reorderComponent: (draggedId, targetId) =>
    set((state) => {
      if (draggedId === targetId) return state;

      const items = [...state.canvasItems];
      const oldIndex = items.findIndex((i) => i.id === draggedId);
      
      //  找不到元素直接返回，防止 splice(-1) 删掉最后一条
      if (oldIndex === -1) return state;

      // 提取拖拽的元素
      const [movedItem] = items.splice(oldIndex, 1);
      
      // 删除 oldIndex 元素后，再去寻找新位置的索引，防止索引漂移
      const newIndex = items.findIndex((i) => i.id === targetId);
      if (newIndex === -1) return state;

      items.splice(newIndex, 0, movedItem);

      return state._saveHistory(items);
    }),

  insertComponentAt: (type, targetId) =>
    set((state) => {
      const newItem: ComponentItem = {
        id: generateId(),
        type,
        // 深拷贝 defaultProps
        props: structuredClone(COMPONENT_REGISTRY[type].defaultProps)
      };

      const items = [...state.canvasItems];
      if (targetId) {
        const index = items.findIndex((i) => i.id === targetId);
        // 拦截 -1
        if (index !== -1) {
          items.splice(index, 0, newItem);
        } else {
          items.push(newItem);
        }
      } else {
        items.push(newItem);
      }

      return {
        ...state._saveHistory(items),
        activeComponentId: newItem.id
      };
    }),

  moveComponent: (id, direction) =>
    set((state) => {
      const items = [...state.canvasItems];
      const index = items.findIndex((i) => i.id === id);

      // 拦截 -1，防止意外交换
      if (index === -1) return state;

      if (direction === 'up' && index > 0) {
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
      } else if (direction === 'down' && index < items.length - 1) {
        [items[index + 1], items[index]] = [items[index], items[index + 1]];
      } else {
        return state;
      }

      return state._saveHistory(items);
    }),

  updateComponentProp: (id: string, key: string, value: unknown) =>
    set((state) => {
      const newItems = state.canvasItems.map((item) =>
        item.id === id ? { ...item, props: { ...item.props, [key]: value } } : item
      );
      return state._saveHistory(newItems);
    }),

  undo: () =>
    set((state) => {
      if (state.historyStep > 0) {
        return {
          historyStep: state.historyStep - 1,
          canvasItems: state.history[state.historyStep - 1],
          // 撤销时重置选中状态，防止属性面板读取幽灵组件报错
          activeComponentId: null
        };
      }
      return state;
    }),

  redo: () =>
    set((state) => {
      if (state.historyStep < state.history.length - 1) {
        return {
          historyStep: state.historyStep + 1,
          canvasItems: state.history[state.historyStep + 1],
          // 重做时重置选中状态
          activeComponentId: null
        };
      }
      return state;
    }),

  setActiveComponentId: (id) => set({ activeComponentId: id }),

  clearCanvas: () =>
    set((state) => ({
      ...state._saveHistory([]),
      activeComponentId: null
    })),

  resetAll: () =>
    set({
      theme: {
        ...THEME_PRESETS.Default,
        background: '#09090b',
        foreground: '#f8fafc',
        primaryForeground: '#ffffff',
        mutedForeground: '#64748b',
        border: '#27272a',
        muted: '#18181b',
        radius: 8,
        borderWidth: 1
      },
      layout: {
        padding: 32,
        gap: 24,
        direction: 'column',
        align: 'center',
        backdrop: 'dots',
        appBg: '#0c0a09',
        workspaceBg: '#050505',
        radius: 16,
        borderWidth: 1
      },
      canvasItems: INITIAL_ITEMS,
      history: [INITIAL_ITEMS],
      historyStep: 0,
      activeComponentId: null,
      isPreviewMode: false,
      isDarkMode: true
    })
}));