import { ComponentConfig, AlertProps, ProgressProps, SkeletonProps, Theme, ComponentItem} from '@/types';
import { Bell, Activity, SquareDashed } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
// import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const withDimensionStyles = (item?: ComponentItem) => ({
  width:
    item?.style?.width === 'full'
      ? '100%'
      : item?.style?.width === 'auto' || !item?.style?.width
        ? undefined
        : item.style.width,
  height:
    item?.style?.height === 'full'
      ? '100%'
      : item?.style?.height === 'auto' || !item?.style?.height
        ? undefined
        : item.style.height
});

export const feedbackComponents: Record<string, ComponentConfig> = {
  Alert: {
    name: '提示 (Alert)',
    icon: <Bell size={14} />,
    category: 'Feedback',
    defaultProps: {
      title: '系统提示',
      description: '您有一个新的消息待处理。',
      variant: 'default'
    },
    propSchema: {
      variant: { type: 'select', options: ['default', 'destructive'] }
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const alertProps = props as unknown as AlertProps;
      const styleFromItem = item?.style || {};
      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? theme?.background,
        borderColor: styleFromItem.borderColor ?? (alertProps.variant === 'destructive' ? theme?.destructive : theme?.border),
        color: styleFromItem.color ?? theme?.foreground,
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined),
        borderWidth: styleFromItem.borderWidth !== undefined ? `${styleFromItem.borderWidth}px` : (theme?.borderWidth ? `${theme.borderWidth}px` : undefined),
        padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined,
        ...withDimensionStyles(item)
      };
      return (
        <Alert 
          variant={alertProps.variant} 
          className="w-full"
          style={mergedStyle}
        >
          <AlertTitle style={{ color: styleFromItem.color ?? theme?.foreground }}>
            {alertProps.title}
          </AlertTitle>
          <AlertDescription style={{ color: theme?.mutedForeground }}>
            {alertProps.description}
          </AlertDescription>
        </Alert>
      );
    }
  },

  Progress: {
    name: '进度条 (Progress)',
    icon: <Activity size={14} />,
    category: 'Feedback',
    defaultProps: {
      value: 65,
      label: '系统负载'
    },
    propSchema: {
      value: { type: 'number', min: 0, max: 100 }
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const progressProps = props as unknown as ProgressProps;
      const styleFromItem = item?.style || {};
      // Only change the filled bar color based on item.style.backgroundColor; keep track and labels using theme
      const fillColor = styleFromItem.backgroundColor ?? theme?.primary;
      return (
        <div className="w-full space-y-2" style={withDimensionStyles(item)}>
          {progressProps.label && (
            <div className="flex justify-between text-sm">
              <span className="font-medium" style={{ color: theme?.foreground }}>
                {progressProps.label}
              </span>
              <span className="text-muted-foreground" style={{ color: theme?.mutedForeground }}>
                {progressProps.value}%
              </span>
            </div>
          )}
          <div 
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ 
              backgroundColor: theme?.muted,
              borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined)
            }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${progressProps.value}%`,
                backgroundColor: fillColor 
              }}
            />
          </div>
        </div>
      );
    }
  },

  Skeleton: {
    name: '骨架屏 (Skeleton)',
    icon: <SquareDashed size={14} />,
    category: 'Feedback',
    defaultProps: {
      lines: 3
    },
    propSchema: {
      lines: { type: 'number', min: 1, max: 5 }
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const skeletonProps = props as unknown as SkeletonProps;
      const styleFromItem = item?.style || {};
      const bg = styleFromItem.backgroundColor ?? theme?.muted;
      const radius = styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined);
      return (
        <div className="w-full space-y-3" style={withDimensionStyles(item)}>
          <div className="flex items-center space-x-4">
            <Skeleton 
              className="h-12 w-12 rounded-full" 
              style={{ backgroundColor: bg, borderRadius: radius }}
            />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" style={{ backgroundColor: bg, borderRadius: radius }} />
              <Skeleton className="h-4 w-1/4" style={{ backgroundColor: bg, borderRadius: radius }} />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: skeletonProps.lines }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" style={{ backgroundColor: bg, borderRadius: radius }} />
            ))}
          </div>
        </div>
      );
    }
  }
};