import React from 'react';
import { DesignView } from './DesignView';
import { InspectView } from './InspectView';
import { CodeExporter } from './CodeExporter';
import { useForgeStore } from '@/store/forgeStore';

interface CanvasProps {
  activeTab: 'design' | 'inspect' | 'export';
}

export const Canvas: React.FC<CanvasProps> = ({ activeTab }) => {
  const { layout, theme } = useForgeStore();

  const getBackdropStyle = () => {
    if (layout.backdrop === 'grid') {
      return {
        backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      };
    }
    if (layout.backdrop === 'dots') {
      return {
        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      };
    }
    return {};
  };

  // 统一容器样式
  const containerClass = "w-full h-full overflow-auto relative";

  return (
    <div className={containerClass} style={{ backgroundColor: layout.appBg }}>
      {/* 背景层 - 仅在 design 模式显示 */}
      {activeTab === 'design' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-20" 
          style={{ ...getBackdropStyle(), color: theme.mutedForeground }}
        />
      )}

      {/* 内容区 */}
      <div className="relative z-10 p-4 sm:p-8 flex justify-center items-start min-h-full">
        {activeTab === 'design' && <DesignView />}
        {activeTab === 'inspect' && <InspectView />}
        {activeTab === 'export' && <CodeExporter />}
      </div>
    </div>
  );
};