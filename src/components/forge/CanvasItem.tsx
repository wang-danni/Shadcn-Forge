import React from 'react';
import { ArrowUp, ArrowDown, X, CopyPlus, GripVertical } from 'lucide-react';
import { useForgeStore } from '@/store/forgeStore';
import { COMPONENT_REGISTRY } from '@/config/components';
import { ComponentItem } from '@/types';
import { cn } from '@/lib/utils';

interface CanvasItemProps {
  item: ComponentItem;
  index: number;
  draggedId: string | null;
  dragOverId: string | null;
  setDraggedId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
}

export const CanvasItem: React.FC<CanvasItemProps> = ({
  item,
  index,
  draggedId,
  dragOverId,
  setDraggedId,
  setDragOverId
}) => {
  const {
    theme,
    layout,
    canvasItems,
    activeComponentId,
    isPreviewMode,
    setActiveComponentId,
    removeComponent,
    duplicateComponent,
    moveComponent,
    reorderComponent,
    insertComponentAt
  } = useForgeStore();

  const isActive = !isPreviewMode && activeComponentId === item.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.dataTransfer.setData('forge-item', item.id);
    // also set text/plain for broader compatibility
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(item.id);
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (draggedId !== item.id) setDragOverId(item.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.preventDefault();
    e.stopPropagation();

    const type = e.dataTransfer.getData('forge-type');
    const dId = e.dataTransfer.getData('forge-item');

    if (type) {
      insertComponentAt(type, item.id);
    } else if (dId) {
      reorderComponent(dId, item.id);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    setActiveComponentId(item.id);
  };

  return (
    <div
      data-canvas-item={item.id}
      draggable={!isPreviewMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={() => { if (!isPreviewMode) setDragOverId(null); }}
      onDrop={handleDrop}
      onDragEnd={() => {
        setDraggedId(null);
        setDragOverId(null);
      }}
      onClick={handleClick}
      className={cn(
        "relative group z-10 rounded-lg transition-all duration-300",
        !isPreviewMode && "hover:z-50 cursor-pointer",
        layout.direction === 'column' && "w-full",
        isActive && "ring-2 ring-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.15)]",
        !isPreviewMode && !isActive && "hover:ring-1 hover:ring-indigo-500/50",
        dragOverId === item.id && "opacity-40 ring-2 ring-indigo-500 scale-[0.98]",
        draggedId === item.id && "opacity-20 scale-95"
      )}
    >
      {/* 活动组件工具栏 */}
      {isActive && (
        <div className="absolute -top-10 right-0 flex gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl z-50 animate-in slide-in-from-bottom-2 fade-in">
          <div 
            title="拖动以排序" 
            className="p-1 text-slate-400 cursor-grab active:cursor-grabbing flex items-center justify-center"
          >
            <GripVertical size={14} />
          </div>
          <div className="w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveComponent(item.id, 'up');
            }}
            disabled={index === 0}
            className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
          >
            <ArrowUp size={14} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveComponent(item.id, 'down');
            }}
            disabled={index === canvasItems.length - 1}
            className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
          >
            <ArrowDown size={14} />
          </button>
          
          <div className="w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateComponent(item.id);
            }}
            className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
            title="克隆组件"
          >
            <CopyPlus size={14} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeComponent(item.id);
            }}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
            title="删除 (Delete/Backspace)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 渲染组件 */}
      <div className={isPreviewMode ? "" : "pointer-events-none"}>
        {COMPONENT_REGISTRY[item.type].render(item.props, theme, layout)}
      </div>
    </div>
  );
};