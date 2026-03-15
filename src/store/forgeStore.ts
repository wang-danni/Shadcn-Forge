import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ForgeStore, ComponentItem, PreviewViewport } from '@/types';
import { THEME_PRESETS } from '@/config/themes';
import { COMPONENT_REGISTRY } from '@/config/components';
import { generateId } from '@/lib/utils';

const INITIAL_ITEMS: ComponentItem[] = [];

const DEFAULT_THEME = {
  ...THEME_PRESETS.Default,
  background: '#ffffff',
  foreground: '#0f172a',
  primaryForeground: '#ffffff',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  muted: '#f1f5f9',
  radius: 8,
  borderWidth: 1
};

const DEFAULT_LAYOUT = {
  padding: 32,
  gap: 24,
  direction: 'column' as const,
  align: 'center' as const,
  backdrop: 'dots' as const,
  appBg: '#ffffff',
  workspaceBg: '#f1f5f9',
  radius: 16,
  borderWidth: 1
};

const cloneComponentItem = (item: ComponentItem): ComponentItem => ({
  ...item,
  props: structuredClone(item.props),
  style: item.style ? structuredClone(item.style) : undefined
});

const collectNestedIds = (items: ComponentItem[], rootIds: string[]) => {
  const ids = new Set(rootIds);
  const queue = [...rootIds];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    items.forEach((item) => {
      if (item.parentId === currentId && !ids.has(item.id)) {
        ids.add(item.id);
        queue.push(item.id);
      }
    });
  }

  return ids;
};

const filterTopLevelIds = (items: ComponentItem[], ids: string[]) => {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const idSet = new Set(ids);

  return ids.filter((id) => {
    let parentId = itemMap.get(id)?.parentId;

    while (parentId) {
      if (idSet.has(parentId)) {
        return false;
      }
      parentId = itemMap.get(parentId)?.parentId;
    }

    return true;
  });
};

const getPasteInsertIndex = (items: ComponentItem[], anchorIds: string[]) => {
  if (anchorIds.length === 0) {
    return items.length;
  }

  const anchorSet = collectNestedIds(items, anchorIds);
  let insertIndex = items.length;

  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (anchorSet.has(items[index].id)) {
      insertIndex = index + 1;
      break;
    }
  }

  return insertIndex;
};

export const useForgeStore = create<ForgeStore>()(persist((set, get) => ({
  isDarkMode: false,
  theme: DEFAULT_THEME,
  layout: DEFAULT_LAYOUT,
  canvasItems: INITIAL_ITEMS,
  clipboardItems: [],
  activeComponentId: null,
  selectedComponentIds: [],
  isPreviewMode: false,
  previewViewport: 'desktop' as PreviewViewport,
  history: [INITIAL_ITEMS],
  historyStep: 0,
  aiSessionLog: [],

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
      activeComponentId: null,
      selectedComponentIds: []
    })),

  setPreviewViewport: (viewport) => set({ previewViewport: viewport }),

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
        activeComponentId: newItem.id,
        selectedComponentIds: [newItem.id]
      };
    }),

  addComponentToCard: (type, cardId) =>
    set((state) => {
      const cardExists = state.canvasItems.some((item) => item.id === cardId && item.type === 'Card');
      if (!cardExists) return state;

      const newItem: ComponentItem = {
        id: generateId(),
        type,
        parentId: cardId,
        props: structuredClone(COMPONENT_REGISTRY[type].defaultProps)
      };

      const items = [...state.canvasItems];
      const cardIndex = items.findIndex((item) => item.id === cardId);
      let insertIndex = cardIndex + 1;

      while (insertIndex < items.length && items[insertIndex].parentId === cardId) {
        insertIndex += 1;
      }

      items.splice(insertIndex, 0, newItem);

      return {
        ...state._saveHistory(items),
        activeComponentId: newItem.id,
        selectedComponentIds: [newItem.id]
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

  updateComponentParent: (id, parentId) =>
    set((state) => {
      if (id === parentId) return state;

      const newItems = state.canvasItems.map((item) =>
        item.id === id ? { ...item, parentId } : item
      );

      return state._saveHistory(newItems);
    }),

  removeComponent: (id) =>
    set((state) => {
      const descendantIds = new Set<string>();
      const queue = [id];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        descendantIds.add(currentId);

        state.canvasItems.forEach((item) => {
          if (item.parentId === currentId && !descendantIds.has(item.id)) {
            queue.push(item.id);
          }
        });
      }

      const newItems = state.canvasItems.filter((item) => !descendantIds.has(item.id));
      return {
        ...state._saveHistory(newItems),
        activeComponentId:
          state.activeComponentId && descendantIds.has(state.activeComponentId)
            ? null
            : state.activeComponentId,
        selectedComponentIds: state.selectedComponentIds.filter((selectedId) => !descendantIds.has(selectedId))
      };
    }),

  duplicateComponent: (id) =>
    set((state) => {
      const itemToCopy = state.canvasItems.find((i) => i.id === id);
      if (!itemToCopy) return state;

      const newItem: ComponentItem = {
        ...cloneComponentItem(itemToCopy),
        id: generateId()
      };

      const newItems = [...state.canvasItems];
      const index = state.canvasItems.findIndex((i) => i.id === id);
      newItems.splice(index + 1, 0, newItem);

      return {
        ...state._saveHistory(newItems),
        activeComponentId: newItem.id,
        selectedComponentIds: [newItem.id]
      };
    }),

  copySelectedComponents: () =>
    set((state) => {
      const sourceIds = state.selectedComponentIds.length > 0
        ? state.selectedComponentIds
        : state.activeComponentId
          ? [state.activeComponentId]
          : [];

      if (sourceIds.length === 0) {
        return state;
      }

      const topLevelIds = filterTopLevelIds(state.canvasItems, sourceIds);
      const idsToCopy = collectNestedIds(state.canvasItems, topLevelIds);

      return {
        clipboardItems: state.canvasItems
          .filter((item) => idsToCopy.has(item.id))
          .map((item) => cloneComponentItem(item))
      };
    }),

  pasteClipboard: () =>
    set((state) => {
      if (state.clipboardItems.length === 0) {
        return state;
      }

      const existingIds = new Set(state.canvasItems.map((item) => item.id));
      const idMap = new Map(state.clipboardItems.map((item) => [item.id, generateId()]));
      const pastedTopLevelIds: string[] = [];

      const pastedItems = state.clipboardItems.map((item) => {
        const remappedParentId = item.parentId
          ? (idMap.get(item.parentId) ?? (existingIds.has(item.parentId) ? item.parentId : undefined))
          : undefined;
        const nextItem: ComponentItem = {
          ...cloneComponentItem(item),
          id: idMap.get(item.id)!,
          parentId: remappedParentId
        };

        if (!remappedParentId || !idMap.has(item.parentId ?? '')) {
          pastedTopLevelIds.push(nextItem.id);
        }

        return nextItem;
      });

      const anchorIds = state.selectedComponentIds.length > 0
        ? filterTopLevelIds(state.canvasItems, state.selectedComponentIds)
        : state.activeComponentId
          ? [state.activeComponentId]
          : [];
      const insertIndex = getPasteInsertIndex(state.canvasItems, anchorIds);
      const newItems = [...state.canvasItems];
      newItems.splice(insertIndex, 0, ...pastedItems);

      return {
        ...state._saveHistory(newItems),
        activeComponentId: pastedTopLevelIds[pastedTopLevelIds.length - 1] ?? pastedItems[pastedItems.length - 1]?.id ?? null,
        selectedComponentIds: pastedTopLevelIds.length > 0 ? pastedTopLevelIds : pastedItems.map((item) => item.id)
      };
    }),

  reorderComponent: (draggedId, targetId, position = 'before') =>
    set((state) => {
      if (draggedId === targetId) return state;

      const items = [...state.canvasItems];
      const oldIndex = items.findIndex((i) => i.id === draggedId);
      // 找不到元素直接返回，防止 splice(-1) 删掉最后一条
      if (oldIndex === -1) return state;

      // 提取拖拽的元素
      const [movedItem] = items.splice(oldIndex, 1);

      // 删除 oldIndex 元素后，再去寻找新位置的索引，防止索引漂移
      const newIndex = items.findIndex((i) => i.id === targetId);
      if (newIndex === -1) {
        // 如果目标不存在，则放到末尾
        items.push(movedItem);
        return state._saveHistory(items);
      }

      if (position === 'after') {
        items.splice(newIndex + 1, 0, movedItem);
      } else {
        items.splice(newIndex, 0, movedItem);
      }

      return state._saveHistory(items);
    }),

  insertComponentAt: (type, targetId, position = 'before') =>
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
          items.splice(position === 'after' ? index + 1 : index, 0, newItem);
        } else {
          items.push(newItem);
        }
      } else {
        items.push(newItem);
      }

      return {
        ...state._saveHistory(items),
        activeComponentId: newItem.id,
        selectedComponentIds: [newItem.id]
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

  replaceComponentProps: (id, props) =>
    set((state) => {
      const newItems = state.canvasItems.map((item) =>
        item.id === id ? { ...item, props: structuredClone(props) } : item
      );
      return state._saveHistory(newItems);
    }),

  replaceCardChildren: (cardId, cardProps, children) =>
    set((state) => {
      const cardIndex = state.canvasItems.findIndex((item) => item.id === cardId && item.type === 'Card');
      if (cardIndex === -1) return state;

      const descendantIds = new Set<string>();
      const queue = [cardId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        state.canvasItems.forEach((item) => {
          if (item.parentId === currentId && !descendantIds.has(item.id)) {
            descendantIds.add(item.id);
            queue.push(item.id);
          }
        });
      }

      const nextChildren = children.map((child) => ({
        ...child,
        parentId: cardId
      }));

      const retainedItems = state.canvasItems
        .filter((item) => !descendantIds.has(item.id))
        .map((item) => (item.id === cardId ? { ...item, props: structuredClone(cardProps) } : item));

      const retainedCardIndex = retainedItems.findIndex((item) => item.id === cardId);
      retainedItems.splice(retainedCardIndex + 1, 0, ...nextChildren);

      return {
        ...state._saveHistory(retainedItems),
        activeComponentId: cardId,
        selectedComponentIds: [cardId]
      };
    }),

  appendAISessionEntry: (entry) =>
    set((state) => ({
      aiSessionLog: [...state.aiSessionLog, { ...entry, timestamp: Date.now() }].slice(-12)
    })),

  clearAISessionLog: () => set({ aiSessionLog: [] }),

  undo: () =>
    set((state) => {
      if (state.historyStep > 0) {
        return {
          historyStep: state.historyStep - 1,
          canvasItems: state.history[state.historyStep - 1],
          // 撤销时重置选中状态，防止属性面板读取幽灵组件报错
          activeComponentId: null,
          selectedComponentIds: []
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
          activeComponentId: null,
          selectedComponentIds: []
        };
      }
      return state;
    }),

  setActiveComponentId: (id) =>
    set({
      activeComponentId: id,
      selectedComponentIds: id ? [id] : []
    }),

  setSelectedComponentIds: (ids) =>
    set((state) => ({
      selectedComponentIds: ids,
      activeComponentId: ids.length > 0 ? state.activeComponentId && ids.includes(state.activeComponentId) ? state.activeComponentId : ids[ids.length - 1] : null
    })),

  toggleSelectedComponentId: (id) =>
    set((state) => {
      const exists = state.selectedComponentIds.includes(id);
      const nextIds = exists
        ? state.selectedComponentIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedComponentIds, id];

      return {
        selectedComponentIds: nextIds,
        activeComponentId: nextIds.length > 0 ? (exists ? nextIds[nextIds.length - 1] : id) : null
      };
    }),

  clearSelection: () => set({ activeComponentId: null, selectedComponentIds: [] }),

  removeSelectedComponents: () =>
    set((state) => {
      const selectedIds = state.selectedComponentIds;
      if (selectedIds.length === 0) return state;

      const descendantIds = new Set<string>();
      const queue = [...selectedIds];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        descendantIds.add(currentId);

        state.canvasItems.forEach((item) => {
          if (item.parentId === currentId && !descendantIds.has(item.id)) {
            queue.push(item.id);
          }
        });
      }

      const newItems = state.canvasItems.filter((item) => !descendantIds.has(item.id));
      return {
        ...state._saveHistory(newItems),
        activeComponentId: null,
        selectedComponentIds: []
      };
    }),

  loadFromSnapshot: (payload) =>
    set((state) => {
      const restoredItems = Array.isArray(payload.canvasItems) ? payload.canvasItems : [];

      return {
        canvasItems: restoredItems,
        history: [JSON.parse(JSON.stringify(restoredItems))],
        historyStep: 0,
        activeComponentId: null,
        selectedComponentIds: [],
        theme: payload.theme ? { ...state.theme, ...payload.theme } : state.theme,
        layout: payload.layout ? { ...state.layout, ...payload.layout } : state.layout
      };
    }),

  clearCanvas: () =>
    set((state) => ({
      ...state._saveHistory([]),
      activeComponentId: null,
      selectedComponentIds: []
    })),

  resetAll: () =>
    set({
      theme: DEFAULT_THEME,
      layout: DEFAULT_LAYOUT,
      canvasItems: INITIAL_ITEMS,
      clipboardItems: [],
      history: [INITIAL_ITEMS],
      historyStep: 0,
      aiSessionLog: [],
      activeComponentId: null,
      selectedComponentIds: [],
      isPreviewMode: false,
      isDarkMode: false
    })
}), {
  name: 'forge-store',
  partialize: (state) => ({
    isDarkMode: state.isDarkMode,
    theme: state.theme,
    layout: state.layout,
    canvasItems: state.canvasItems,
    aiSessionLog: state.aiSessionLog
  }),
  merge: (persistedState, currentState) => {
    const persisted = persistedState as Partial<ForgeStore>;
    const restoredCanvasItems = persisted.canvasItems ?? currentState.canvasItems;

    return {
      ...currentState,
      ...persisted,
      canvasItems: restoredCanvasItems,
      clipboardItems: [],
      history: [JSON.parse(JSON.stringify(restoredCanvasItems))],
      historyStep: 0,
      activeComponentId: null,
      selectedComponentIds: [],
      isPreviewMode: false,
      previewViewport: 'desktop' as PreviewViewport
    } as ForgeStore;
  }
}));