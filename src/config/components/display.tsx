import { ComponentConfig, CardProps, AvatarProps, BadgeProps, SeparatorProps, Theme, ComponentItem, TabsProps, DialogProps, DropdownMenuProps, TableProps } from '@/types';
import { Box, User, Tag, Minus, Rows3, Table2, PanelTop, MenuSquare } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdownmenu';
import { Table } from '@/components/ui/table';

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

const splitByComma = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const parseTableRows = (rows: string) =>
  rows
    .split('|')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => splitByComma(row));

export const displayComponents: Record<string, ComponentConfig> = {
  Card: {
    name: '卡片 (Card)',
    icon: <Box size={14} />,
    category: 'Display',
    defaultProps: {
      title: '数据报告',
      description: '基于您的使用情况生成的智能摘要。',
      content: '这里可以放补充信息、表单说明或简短摘要。',
      footerPrimary: '继续',
      footerSecondary: '取消'
    },
    propSchema: {
      title: { type: 'string' },
      description: { type: 'string' },
      content: { type: 'string' },
      footerPrimary: { type: 'string' },
      footerSecondary: { type: 'string' }
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const cardProps = props as unknown as CardProps;
      const styleFromItem = item?.style || {};
      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? theme?.background,
        borderColor: styleFromItem.borderColor ?? theme?.border,
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined),
        borderWidth: styleFromItem.borderWidth !== undefined ? `${styleFromItem.borderWidth}px` : (theme?.borderWidth ? `${theme.borderWidth}px` : undefined),
        padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined,
        color: styleFromItem.color ?? undefined,
        ...withDimensionStyles(item)
      };
       return (
         <Card 
          className="w-full"
          style={mergedStyle}
         >
          <CardHeader>
            <CardTitle style={{ color: theme?.foreground }}>
              {cardProps.title}
            </CardTitle>
            {cardProps.description && (
              <CardDescription style={{ color: theme?.mutedForeground }}>
                {cardProps.description}
              </CardDescription>
            )}
          </CardHeader>
          {cardProps.content && (
            <CardContent style={{ color: styleFromItem.color ?? theme?.foreground }}>
              <p className="text-sm leading-6">{cardProps.content}</p>
            </CardContent>
          )}
          {(cardProps.footerPrimary || cardProps.footerSecondary) && (
            <CardFooter className="gap-2 justify-end">
              {cardProps.footerSecondary ? (
                <Button variant="outline" size="sm">{cardProps.footerSecondary}</Button>
              ) : null}
              {cardProps.footerPrimary ? (
                <Button size="sm">{cardProps.footerPrimary}</Button>
              ) : null}
            </CardFooter>
          )}
        </Card>
      );
    }
  },

  Avatar: {
    name: '头像 (Avatar)',
    icon: <User size={14} />,
    category: 'Display',
    defaultProps: {
      fallback: 'SF',
      src: '',
      size: 'default'
    },
    propSchema: {
      size: { type: 'select', options: ['sm', 'default', 'lg'] }
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const avatarProps = props as unknown as AvatarProps;
      const sizeClasses: Record<AvatarProps['size'], string> = {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12'
      };
      
      const styleFromItem = item?.style || {};
      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? theme?.primary,
        color: (styleFromItem.color ?? (theme?.primaryForeground || '#ffffff')),
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : undefined,
        width: sizeClasses[avatarProps.size].split(' ')[1],
        height: sizeClasses[avatarProps.size].split(' ')[0]
      };

      return (
        <Avatar className={sizeClasses[avatarProps.size]} style={{ backgroundColor: mergedStyle.backgroundColor }}>
          {avatarProps.src && <AvatarImage src={avatarProps.src} alt={avatarProps.fallback} />}
          <AvatarFallback 
            style={{ color: mergedStyle.color }}
          >
            {avatarProps.fallback}
          </AvatarFallback>
        </Avatar>
      );
    }
  },

  Badge: {
    name: '徽章 (Badge)',
    icon: <Tag size={14} />,
    category: 'Display',
    defaultProps: {
      text: 'New Feature',
      variant: 'default'
    },
    propSchema: {
      variant: {
        type: 'select',
        options: ['default', 'secondary', 'destructive', 'outline']
      }
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const badgeProps = props as unknown as BadgeProps;
      const styleFromItem = item?.style || {};
      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? (badgeProps.variant === 'default' ? theme?.primary : undefined),
        color: styleFromItem.color ?? (badgeProps.variant === 'default' ? (theme?.primaryForeground || '#ffffff') : theme?.foreground),
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined),
        borderColor: styleFromItem.borderColor ?? (badgeProps.variant === 'outline' ? theme?.border : undefined),
        borderWidth: styleFromItem.borderWidth !== undefined ? `${styleFromItem.borderWidth}px` : undefined,
        padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined,
        fontSize: styleFromItem.fontSize !== undefined ? `${styleFromItem.fontSize}px` : undefined,
        ...withDimensionStyles(item)
      };
       return (
        <Badge 
          variant={badgeProps.variant}
          style={mergedStyle}
        >
          {badgeProps.text}
        </Badge>
       );
     }
   },

  Separator: {
    name: '分割线 (Separator)',
    icon: <Minus size={14} />,
    category: 'Display',
    defaultProps: {
      orientation: 'horizontal'
    },
    propSchema: {
      orientation: { type: 'select', options: ['horizontal', 'vertical'] }
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const separatorProps = props as unknown as SeparatorProps;
      return (
        <div className="w-full py-4" style={withDimensionStyles(item)}>
          <Separator 
            orientation={separatorProps.orientation}
            style={{ backgroundColor: theme?.border }}
          />
        </div>
      );
    }
  },

  Tabs: {
    name: '标签页 (Tabs)',
    icon: <Rows3 size={14} />,
    category: 'Display',
    defaultProps: {
      tabs: '概览,分析,成员',
      defaultTab: '概览',
      content: '这里展示当前标签页的内容。'
    },
    render: (props, _theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const tabsProps = props as unknown as TabsProps;
      return (
        <div style={withDimensionStyles(item)} className="w-full">
          <Tabs
            tabs={splitByComma(tabsProps.tabs)}
            defaultTab={tabsProps.defaultTab}
            content={tabsProps.content}
            className="w-full"
          />
        </div>
      );
    }
  },

  Table: {
    name: '表格 (Table)',
    icon: <Table2 size={14} />,
    category: 'Display',
    defaultProps: {
      columns: '姓名,角色,状态',
      rows: 'Luna,Admin,Active|Milo,Editor,Invited|Ava,Viewer,Offline'
    },
    render: (props, _theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const tableProps = props as unknown as TableProps;
      return (
        <div style={withDimensionStyles(item)} className="w-full">
          <Table columns={splitByComma(tableProps.columns)} rows={parseTableRows(tableProps.rows)} className="w-full" />
        </div>
      );
    }
  },

  Dialog: {
    name: '弹窗 (Dialog)',
    icon: <PanelTop size={14} />,
    category: 'Display',
    defaultProps: {
      triggerText: '打开弹窗',
      title: '确认操作',
      description: '这个弹窗用于预览更接近 shadcn 的交互结构。',
      confirmText: '确认'
    },
    render: (props, _theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const dialogProps = props as unknown as DialogProps;
      return (
        <div style={withDimensionStyles(item)}>
          <Dialog {...dialogProps} />
        </div>
      );
    }
  },

  DropdownMenu: {
    name: '下拉菜单 (Dropdown)',
    icon: <MenuSquare size={14} />,
    category: 'Display',
    defaultProps: {
      triggerText: '更多操作',
      items: '编辑,复制,归档,删除'
    },
    render: (props, _theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const dropdownProps = props as unknown as DropdownMenuProps;
      return (
        <div style={withDimensionStyles(item)}>
          <DropdownMenu triggerText={dropdownProps.triggerText} items={splitByComma(dropdownProps.items)} />
        </div>
      );
    }
  }
};