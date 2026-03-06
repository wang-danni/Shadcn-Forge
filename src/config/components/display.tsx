import { ComponentConfig, CardProps, AvatarProps, BadgeProps, SeparatorProps, Theme } from '@/types';
import { Box, User, Tag, Minus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const displayComponents: Record<string, ComponentConfig> = {
  Card: {
    name: '卡片 (Card)',
    icon: <Box size={14} />,
    category: 'Display',
    defaultProps: {
      title: '数据报告',
      description: '基于您的使用情况生成的智能摘要。'
    },
    render: (props, theme?: Theme) => {
      const cardProps = props as unknown as CardProps;
      return (
        <Card 
          className="w-full"
          style={{
            backgroundColor: theme?.background,
            borderColor: theme?.border,
            borderRadius: theme ? `${theme.radius}px` : undefined,
            borderWidth: theme?.borderWidth ? `${theme.borderWidth}px` : undefined,
          }}
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
    render: (props, theme?: Theme) => {
      const avatarProps = props as unknown as AvatarProps;
      const sizeClasses: Record<AvatarProps['size'], string> = {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12'
      };
      
      return (
        <Avatar className={sizeClasses[avatarProps.size]}>
          {avatarProps.src && <AvatarImage src={avatarProps.src} alt={avatarProps.fallback} />}
          <AvatarFallback 
            style={{ 
              backgroundColor: theme?.primary,
              color: theme?.primaryForeground || '#ffffff'
            }}
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
    render: (props, theme?: Theme) => {
      const badgeProps = props as unknown as BadgeProps;
      return (
        <Badge 
          variant={badgeProps.variant}
          style={{
            backgroundColor: badgeProps.variant === 'default' ? theme?.primary : undefined,
            color: badgeProps.variant === 'default' ? (theme?.primaryForeground || '#ffffff') : theme?.foreground,
            borderRadius: theme ? `${theme.radius}px` : undefined,
            borderColor: badgeProps.variant === 'outline' ? theme?.border : undefined
          }}
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
    render: (props, theme?: Theme) => {
      const separatorProps = props as unknown as SeparatorProps;
      return (
        <div className="w-full py-4">
          <Separator 
            orientation={separatorProps.orientation}
            style={{ backgroundColor: theme?.border }}
          />
        </div>
      );
    }
  }
};