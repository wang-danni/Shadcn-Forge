import React from 'react';
import { useForgeStore } from '@/store/forgeStore';
import { COMPONENT_REGISTRY } from '@/config/components';
import { Trash2, Copy, GripVertical, MoveUp, MoveDown } from 'lucide-react';
import { Theme } from '@/types';

export const DesignView: React.FC = () => {
  const {
    canvasItems,
    activeComponentId,
    setActiveComponentId,
    removeComponent,
    duplicateComponent,
    moveComponent,
    theme,
    layout,
    isPreviewMode
  } = useForgeStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('forge-type');
    if (type) {
      useForgeStore.getState().addComponent(type);
    }
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

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full max-w-4xl mx-auto transition-all duration-300 ${
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
            color: theme.mutedForeground 
          }}
        >
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">拖拽组件到这里开始设计</p>
            <p className="text-xs opacity-60">或点击组件箱中的组件添加</p>
          </div>
        </div>
      ) : (
        canvasItems.map((item, index) => {
          const config = COMPONENT_REGISTRY[item.type];
          if (!config) return null;

          const isActive = activeComponentId === item.id;

          const componentTheme: Theme = {
            ...theme,
            background: item.style?.backgroundColor ?? theme.background,
            foreground: item.style?.color ?? theme.foreground,
            border: item.style?.borderColor ?? theme.border,
            radius: item.style?.borderRadius ?? theme.radius,
            borderWidth: item.style?.borderWidth ?? theme.borderWidth
          };

          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPreviewMode) {
                  setActiveComponentId(item.id);
                }
              }}
              className={`relative group transition-all ${
                layout.direction === 'row' ? 'flex-shrink-0' : 'w-full'
              }`}
              style={{
                outline: isActive && !isPreviewMode ? `2px solid ${theme.primary}` : 'none',
                outlineOffset: '4px',
                borderRadius: `${componentTheme.radius}px`
              }}
            >
              {/* 传递组件独立主题 */}
              {config.render(item.props, componentTheme, layout)}

              {/* 控制按钮 */}
              {!isPreviewMode && isActive && (
                <div
                  className="absolute -top-10 left-0 flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg z-10"
                  style={{
                    backgroundColor: theme.background,
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveComponent(item.id, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1.5 rounded hover:bg-opacity-10 disabled:opacity-30 transition-colors"
                    style={{ 
                      color: theme.foreground,
                      backgroundColor: 'transparent'
                    }}
                    title="上移"
                  >
                    <MoveUp size={14} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveComponent(item.id, 'down');
                    }}
                    disabled={index === canvasItems.length - 1}
                    className="p-1.5 rounded hover:bg-opacity-10 disabled:opacity-30 transition-colors"
                    style={{ 
                      color: theme.foreground,
                      backgroundColor: 'transparent'
                    }}
                    title="下移"
                  >
                    <MoveDown size={14} />
                  </button>

                  <div 
                    className="w-px h-4 mx-1" 
                    style={{ backgroundColor: theme.border }}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateComponent(item.id);
                    }}
                    className="p-1.5 rounded hover:bg-opacity-10 transition-colors"
                    style={{ 
                      color: theme.foreground,
                      backgroundColor: 'transparent'
                    }}
                    title="复制"
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeComponent(item.id);
                    }}
                    className="p-1.5 rounded hover:bg-red-500 hover:text-white transition-colors"
                    style={{ color: theme.foreground }}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="cursor-move p-1.5" style={{ color: theme.mutedForeground }}>
                    <GripVertical size={14} />
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};