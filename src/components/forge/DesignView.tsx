import React, { useMemo, useState } from 'react';
import { useForgeStore } from '@/store/forgeStore';
import { COMPONENT_REGISTRY } from '@/config/components';
import { Trash2, Copy, GripVertical, MoveUp, MoveDown, Sparkles, Plus } from 'lucide-react';
import { Theme, Layout } from '@/types';

interface ContextMenuState {
  x: number;
  y: number;
  itemId: string;
}

export const DesignView: React.FC = () => {
  const {
    canvasItems,
    activeComponentId,
    selectedComponentIds,
    setActiveComponentId,
    setSelectedComponentIds,
    toggleSelectedComponentId,
    clearSelection,
    removeSelectedComponents,
    removeComponent,
    duplicateComponent,
    moveComponent,
    reorderComponent,
    updateComponentParent,
    insertComponentAt,
    addComponentToCard,
    addComponent,
    theme,
    layout,
    isPreviewMode
  } = useForgeStore();

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('before');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const topLevelItems = canvasItems.filter((item) => !item.parentId);
  const cardItems = useMemo(
    () => canvasItems.filter((item) => item.type === 'Card'),
    [canvasItems]
  );

  const contextTarget = contextMenu
    ? canvasItems.find((item) => item.id === contextMenu.itemId) ?? null
    : null;

  const getCardChildren = (cardId: string) =>
    canvasItems.filter((item) => item.parentId === cardId);

  // Internal drag handlers for reordering
  const handleItemDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    // set both a custom type and text/plain for broader compatibility
    e.dataTransfer.setData('forge-drag-id', id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setActiveComponentId(id);
  };

  const handleItemDragOver = (e: React.DragEvent, id: string, direction: Layout['direction']) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const nextPosition = direction === 'row'
      ? (e.clientX < rect.left + rect.width / 2 ? 'before' : 'after')
      : (e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');

    setDragOverId(id);
    setDropPosition(nextPosition);
  };

  const handleItemDrop = (e: React.DragEvent, targetId: string) => {
    e.stopPropagation();
    e.preventDefault();

    const plainData = e.dataTransfer.getData('text/plain');
    const fallbackType = plainData.startsWith('forge-type:') ? plainData.replace('forge-type:', '') : '';
    const componentType = e.dataTransfer.getData('forge-type') || fallbackType;
    const draggedIdRaw = e.dataTransfer.getData('forge-drag-id') || plainData;
    const draggedId = draggedIdRaw.startsWith('forge-type:') ? '' : draggedIdRaw;

    const targetItem = canvasItems.find((item) => item.id === targetId);
    const targetCardId = targetItem?.type === 'Card' ? targetItem.id : targetItem?.parentId;

    if (componentType) {
      if (targetCardId) {
        addComponentToCard(componentType, targetCardId);
      } else {
        insertComponentAt(componentType, targetId, dropPosition);
      }
    } else if (draggedId && draggedId !== targetId) {
      if (targetCardId && draggedId !== targetCardId) {
        updateComponentParent(draggedId, targetCardId);
      } else if (!targetCardId) {
        updateComponentParent(draggedId, undefined);
      }
      reorderComponent(draggedId, targetId, dropPosition);
    }

    setDragOverId(null);
  };

  const handleItemDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleItemSelect = (itemId: string, shiftKey: boolean) => {
    if (shiftKey) {
      toggleSelectedComponentId(itemId);
      return;
    }

    setSelectedComponentIds([itemId]);
    setActiveComponentId(itemId);
  };

  const handleDeleteAction = (itemId: string) => {
    if (selectedComponentIds.length > 1 && selectedComponentIds.includes(itemId)) {
      removeSelectedComponents();
      return;
    }

    removeComponent(itemId);
  };

  // canvas-level drag handlers (添加侧边栏组件到画布)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const plainData = e.dataTransfer.getData('text/plain');
    const fallbackType = plainData.startsWith('forge-type:') ? plainData.replace('forge-type:', '') : '';
    const type = e.dataTransfer.getData('forge-type') || fallbackType;
    const draggedIdRaw = e.dataTransfer.getData('forge-drag-id') || plainData;
    const draggedId = draggedIdRaw.startsWith('forge-type:') ? '' : draggedIdRaw;
    if (type) {
      useForgeStore.getState().addComponent(type);
    } else if (draggedId) {
      updateComponentParent(draggedId, undefined);
    }
    setDragOverId(null);
  };

  // 计算对齐方式
  const getAlignClass = () => {
    switch (layout.align) {
      case 'start':
        return 'items-start';
      case 'center':
        return 'items-center';
      case 'end':
        return 'items-end';
      default:
        return 'items-center';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    setContextMenu(null);
    const target = e.target as HTMLElement | null;
    let el = target;
    let insideItem = false;
    while (el && el !== e.currentTarget) {
      if (el.hasAttribute && el.hasAttribute('data-canvas-item')) {
        insideItem = true;
        break;
      }
      el = el.parentElement;
    }
    if (!insideItem) {
      clearSelection();
    }
  };

  const openContextMenu = (event: React.MouseEvent, itemId: string) => {
    if (isPreviewMode) return;
    event.preventDefault();
    event.stopPropagation();

    if (!selectedComponentIds.includes(itemId)) {
      setSelectedComponentIds([itemId]);
      setActiveComponentId(itemId);
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      itemId
    });
  };

  const getItemAlignmentStyle = (
    alignSelf: Layout['align'] | 'stretch' | undefined,
    direction: Layout['direction']
  ) => {
    if (direction === 'row') {
      switch (alignSelf) {
        case 'center':
          return { marginLeft: 'auto', marginRight: 'auto' };
        case 'end':
          return { marginLeft: 'auto' };
        case 'stretch':
          return { flex: '1 1 0%' };
        default:
          return {};
      }
    }

    switch (alignSelf) {
      case 'start':
        return { alignSelf: 'flex-start' as const };
      case 'center':
        return { alignSelf: 'center' as const };
      case 'end':
        return { alignSelf: 'flex-end' as const };
      case 'stretch':
        return { alignSelf: 'stretch' as const };
      default:
        return {};
    }
  };

  const getItemFrameStyle = (item: typeof canvasItems[number], itemLayout: Layout) => {
    const width = item.style?.width;
    const height = item.style?.height;
    const alignStyle = getItemAlignmentStyle(item.style?.alignSelf, itemLayout.direction);
    const horizontalOffset = item.style?.horizontalOffset ?? 0;

    if (itemLayout.direction === 'row') {
      return {
        ...alignStyle,
        width: width && width !== 'auto' && width !== 'full' ? width : undefined,
        height: height && height !== 'auto' && height !== 'full' ? height : undefined,
        flex: width === 'full' ? '1 1 0%' : (alignStyle as { flex?: string }).flex,
        marginLeft:
          horizontalOffset > 0 && width !== 'full'
            ? `clamp(0px, ${horizontalOffset}%, 320px)`
            : (alignStyle as { marginLeft?: string }).marginLeft,
        marginRight: (alignStyle as { marginRight?: string }).marginRight
      };
    }

    return {
      ...alignStyle,
      width: width === 'full' ? '100%' : width && width !== 'auto' ? width : undefined,
      height: height === 'full' ? '100%' : height && height !== 'auto' ? height : undefined
    };
  };

  // 通用节点渲染函数，卡片内和画布顶层共用同一套逻辑
  const renderItemNodes = (items: typeof canvasItems, containerDirection: Layout['direction']): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemDir = (item.style?.direction as Layout['direction']) ?? containerDirection;

      if (itemDir === 'row') {
        // 收集连续 row 方向的组件分组
        const group: typeof canvasItems = [item];
        let j = i + 1;
        while (j < items.length && ((items[j].style?.direction as Layout['direction']) ?? containerDirection) === 'row') {
          group.push(items[j]);
          j++;
        }

        nodes.push(
          <div key={`group-${i}-${group.map(g => g.id).join('-')}`} className="flex w-full" style={{ gap: `${layout.gap}px` }}>
            {group.map((gi) => {
              const config = COMPONENT_REGISTRY[gi.type];
              if (!config) return null;

              const isSelected = selectedComponentIds.includes(gi.id);
              const isActive = activeComponentId === gi.id;
              const componentTheme: Theme = {
                ...theme,
                background: gi.style?.backgroundColor ?? theme.background,
                foreground: gi.style?.color ?? theme.foreground,
                border: gi.style?.borderColor ?? theme.border,
                radius: gi.style?.borderRadius ?? theme.radius,
                borderWidth: gi.style?.borderWidth ?? theme.borderWidth
              };

              const itemLayout = { ...layout, direction: (gi.style?.direction as Layout['direction']) ?? 'row' };
              const childNodes = gi.type === 'Card'
                ? renderItemNodes(getCardChildren(gi.id), gi.style?.childrenDirection ?? 'column')
                : [];

              return (
                <div
                  key={gi.id}
                  data-canvas-item={gi.id}
                  draggable={!isPreviewMode}
                  onDragStart={(e) => handleItemDragStart(e, gi.id)}
                  onDragOver={(e) => handleItemDragOver(e, gi.id, itemLayout.direction)}
                  onDrop={(e) => handleItemDrop(e, gi.id)}
                  onDragEnd={handleItemDragEnd}
                  onDragLeave={() => setDragOverId((prev) => (prev === gi.id ? null : prev))}
                  onContextMenu={(event) => openContextMenu(event, gi.id)}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!isPreviewMode) handleItemSelect(gi.id, e.shiftKey);
                  }}
                  className="relative group transition-colors flex-shrink-0"
                  style={{
                    outline: (isSelected || isActive) && !isPreviewMode ? `2px solid ${theme.primary}` : 'none',
                    outlineOffset: '4px',
                    borderRadius: `${componentTheme.radius}px`,
                    boxSizing: 'border-box',
                    ...getItemFrameStyle(gi, itemLayout)
                  }}
                >
                  {!isPreviewMode && dragOverId === gi.id && (
                    <div
                      className="absolute inset-x-0 z-40 h-0.5 bg-indigo-500"
                      style={dropPosition === 'before' ? { top: '-6px' } : { bottom: '-6px' }}
                    />
                  )}

                  {config.render(
                    gi.type === 'Card'
                      ? { ...gi.props, __childrenDirection: gi.style?.childrenDirection ?? 'column', __children: childNodes }
                      : gi.props,
                    componentTheme,
                    itemLayout,
                    gi
                  )}

                  {!isPreviewMode && isActive && (
                    <div
                      className="absolute -top-10 left-0 flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg z-10"
                      style={{ backgroundColor: theme.background, border: `1px solid ${theme.border}` }}
                    >
                      <button onClick={(e) => { e.stopPropagation(); moveComponent(gi.id, 'up'); }} className="p-1.5 rounded"><MoveUp size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveComponent(gi.id, 'down'); }} className="p-1.5 rounded"><MoveDown size={14} /></button>
                      <div className="w-px h-4 mx-1" style={{ backgroundColor: theme.border }} />
                      <button onClick={(e) => { e.stopPropagation(); duplicateComponent(gi.id); }} className="p-1.5 rounded"><Copy size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAction(gi.id); }} className="p-1.5 rounded"><Trash2 size={14} /></button>
                      <div className="cursor-move p-1.5" style={{ color: theme.mutedForeground }}><GripVertical size={14} /></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

        i = j - 1;
      } else {
        // 单组件（column 或默认）
        const config = COMPONENT_REGISTRY[item.type];
        if (!config) continue;

        const isSelected = selectedComponentIds.includes(item.id);
        const isActive = activeComponentId === item.id;
        const componentTheme: Theme = {
          ...theme,
          background: item.style?.backgroundColor ?? theme.background,
          foreground: item.style?.color ?? theme.foreground,
          border: item.style?.borderColor ?? theme.border,
          radius: item.style?.borderRadius ?? theme.radius,
          borderWidth: item.style?.borderWidth ?? theme.borderWidth
        };

        const itemLayout = { ...layout, direction: (item.style?.direction as Layout['direction']) ?? 'column' };
        const childNodes = item.type === 'Card'
          ? renderItemNodes(getCardChildren(item.id), item.style?.childrenDirection ?? 'column')
          : [];

        nodes.push(
          <div
            key={item.id}
            data-canvas-item={item.id}
            draggable={!isPreviewMode}
            onDragStart={(e) => handleItemDragStart(e, item.id)}
            onDragOver={(e) => handleItemDragOver(e, item.id, itemLayout.direction)}
            onDrop={(e) => handleItemDrop(e, item.id)}
            onDragEnd={handleItemDragEnd}
            onDragLeave={() => setDragOverId((prev) => (prev === item.id ? null : prev))}
            onContextMenu={(event) => openContextMenu(event, item.id)}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (!isPreviewMode) handleItemSelect(item.id, e.shiftKey);
            }}
            className={`relative group transition-colors ${itemLayout.direction === 'row' ? 'flex-shrink-0' : 'w-full'}`}
            style={{
              outline: (isSelected || isActive) && !isPreviewMode ? `2px solid ${theme.primary}` : 'none',
              outlineOffset: '4px',
              borderRadius: `${componentTheme.radius}px`,
              ...getItemFrameStyle(item, itemLayout)
            }}
          >
            {!isPreviewMode && dragOverId === item.id && (
              <div
                className="absolute inset-x-0 z-40 h-0.5 bg-indigo-500"
                style={dropPosition === 'before' ? { top: '-6px' } : { bottom: '-6px' }}
              />
            )}

            {config.render(
              item.type === 'Card'
                ? { ...item.props, __childrenDirection: item.style?.childrenDirection ?? 'column', __children: childNodes }
                : item.props,
              componentTheme,
              itemLayout,
              item
            )}

            {!isPreviewMode && isActive && (
              <div
                className="absolute -top-10 left-0 flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg z-10"
                style={{ backgroundColor: theme.background, border: `1px solid ${theme.border}` }}
              >
                <button onClick={(e) => { e.stopPropagation(); moveComponent(item.id, 'up'); }} className="p-1.5 rounded"><MoveUp size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); moveComponent(item.id, 'down'); }} className="p-1.5 rounded"><MoveDown size={14} /></button>
                <div className="w-px h-4 mx-1" style={{ backgroundColor: theme.border }} />
                <button onClick={(e) => { e.stopPropagation(); duplicateComponent(item.id); }} className="p-1.5 rounded"><Copy size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteAction(item.id); }} className="p-1.5 rounded"><Trash2 size={14} /></button>
                <div className="cursor-move p-1.5" style={{ color: theme.mutedForeground }}><GripVertical size={14} /></div>
              </div>
            )}
          </div>
        );
      }
    }
    return nodes;
  };

  const renderNodes = () => renderItemNodes(topLevelItems, layout.direction);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      className={`w-full max-w-4xl mx-auto transition-colors duration-300 ${
        layout.direction === 'row' ? 'flex flex-row' : 'flex flex-col'
      } ${getAlignClass()}`}
      style={{
        gap: `${layout.gap}px`,
        padding: `${layout.padding}px`,
        minHeight: '400px'
      }}
    >
      {canvasItems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl transition-colors"
          style={{ 
            borderColor: theme.border,
            color: theme.mutedForeground,
            backgroundColor: theme.background
          }}
        >
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.muted }}>
              <Sparkles size={20} style={{ color: theme.foreground }} />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold" style={{ color: theme.foreground }}>从空白画布开始搭建</p>
              <p className="text-sm opacity-80">拖拽左侧组件到这里，或者先添加一个基础块，再继续像搭 shadcn/ui 一样逐步组合。</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Card', 'Input', 'Button'].map((type) => {
                const config = COMPONENT_REGISTRY[type];
                if (!config) return null;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addComponent(type)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:border-indigo-400 hover:text-indigo-600"
                    style={{ borderColor: theme.border, color: theme.foreground }}
                  >
                    <Plus size={12} />
                    {config.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs opacity-60">也可以直接用顶部 AI 智能构建，输入“登录卡片”或“注册表单”。</p>
          </div>
        </div>
      ) : (
        renderNodes()
      )}

      {!isPreviewMode && contextMenu && contextTarget && (
        <div
          className="fixed z-[90] min-w-[180px] rounded-xl border border-slate-200 bg-white p-1 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          style={{ left: contextMenu.x + 8, top: contextMenu.y + 8 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              duplicateComponent(contextTarget.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            克隆组件
          </button>
          <button
            type="button"
            onClick={() => {
              handleDeleteAction(contextTarget.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            {selectedComponentIds.length > 1 && selectedComponentIds.includes(contextTarget.id)
              ? `删除所选 ${selectedComponentIds.length} 项`
              : '删除组件'}
          </button>
          <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => {
              moveComponent(contextTarget.id, 'up');
              setContextMenu(null);
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            上移
          </button>
          <button
            type="button"
            onClick={() => {
              moveComponent(contextTarget.id, 'down');
              setContextMenu(null);
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            下移
          </button>
          <button
            type="button"
            onClick={() => {
              updateComponentParent(contextTarget.id, undefined);
              setContextMenu(null);
            }}
            className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            移到顶层
          </button>
          {cardItems.filter((card) => card.id !== contextTarget.id).slice(0, 4).map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                updateComponentParent(contextTarget.id, card.id);
                setContextMenu(null);
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              移到卡片：{String(card.props.title || 'Card')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};