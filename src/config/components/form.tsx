import { ComponentConfig, ButtonProps, InputProps, TextareaProps, SwitchProps, CheckboxProps, Theme } from '@/types';
import { MousePointer2, Type, AlignLeft, ToggleLeft, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export const formComponents: Record<string, ComponentConfig> = {
  Button: {
    name: '按钮 (Button)',
    icon: <MousePointer2 size={14} />,
    category: 'Forms',
    defaultProps: {
      children: '执行操作',
      variant: 'default',
      size: 'default'
    },
    propSchema: {
      variant: {
        type: 'select',
        options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link']
      },
      size: { type: 'select', options: ['sm', 'default', 'lg'] }
    },
    render: (props, theme?: Theme) => {
      const buttonProps = props as unknown as ButtonProps;
      return (
        <Button 
          variant={buttonProps.variant} 
          size={buttonProps.size}
          style={{
            backgroundColor: buttonProps.variant === 'default' ? theme?.primary : 
                           buttonProps.variant === 'secondary' ? theme?.secondary :
                           buttonProps.variant === 'destructive' ? theme?.destructive : undefined,
            color: buttonProps.variant === 'default' ? (theme?.primaryForeground || '#ffffff') :
                   buttonProps.variant === 'secondary' ? theme?.secondaryForeground : 
                   buttonProps.variant === 'outline' || buttonProps.variant === 'ghost' ? theme?.foreground : undefined,
            borderRadius: theme ? `${theme.radius}px` : undefined,
            borderWidth: theme?.borderWidth ? `${theme.borderWidth}px` : undefined,
            borderColor: buttonProps.variant === 'outline' ? theme?.border : undefined
          }}
        >
          {buttonProps.children}
        </Button>
      );
    }
  },

  Input: {
    name: '输入框 (Input)',
    icon: <Type size={14} />,
    category: 'Forms',
    defaultProps: {
      placeholder: '请输入内容...',
      type: 'text'
    },
    propSchema: {
      type: {
        type: 'select',
        options: ['text', 'email', 'password', 'number', 'tel', 'url']
      }
    },
    render: (props, theme?: Theme) => {
      const inputProps = props as unknown as InputProps;
      return (
        <div className="w-full space-y-2">
          <Input
            type={inputProps.type}
            placeholder={inputProps.placeholder}
            className="w-full"
            style={{
              backgroundColor: theme?.background,
              borderColor: theme?.border,
              color: theme?.foreground,
              borderRadius: theme ? `${theme.radius}px` : undefined,
              borderWidth: theme?.borderWidth ? `${theme.borderWidth}px` : undefined,
            }}
          />
        </div>
      );
    }
  },

  Textarea: {
    name: '多行文本 (Textarea)',
    icon: <AlignLeft size={14} />,
    category: 'Forms',
    defaultProps: {
      placeholder: '输入详细描述...',
      rows: 3
    },
    propSchema: {
      rows: { type: 'number', min: 2, max: 10 }
    },
    render: (props, theme?: Theme) => {
      const textareaProps = props as unknown as TextareaProps;
      return (
        <div className="w-full space-y-2">
          <Textarea
            placeholder={textareaProps.placeholder}
            rows={textareaProps.rows}
            className="w-full"
            style={{
              backgroundColor: theme?.background,
              borderColor: theme?.border,
              color: theme?.foreground,
              borderRadius: theme ? `${theme.radius}px` : undefined,
              borderWidth: theme?.borderWidth ? `${theme.borderWidth}px` : undefined,
            }}
          />
        </div>
      );
    }
  },

  Switch: {
    name: '开关 (Switch)',
    icon: <ToggleLeft size={14} />,
    category: 'Forms',
    defaultProps: {
      label: '启用推送通知',
      checked: true
    },
    render: (props, theme?: Theme) => {
      const switchProps = props as unknown as SwitchProps;
      return (
        <div 
          className="flex items-center space-x-2 w-full p-3 border rounded-lg bg-card"
          style={{
            backgroundColor: theme?.background,
            borderColor: theme?.border,
            borderRadius: theme ? `${theme.radius}px` : undefined,
            borderWidth: theme?.borderWidth ? `${theme.borderWidth}px` : undefined,
          }}
        >
          <Switch 
            id="switch" 
            checked={switchProps.checked}
            style={{
              backgroundColor: switchProps.checked ? theme?.primary : theme?.muted
            }}
          />
          <Label 
            htmlFor="switch" 
            className="text-sm font-medium cursor-pointer"
            style={{ color: theme?.foreground }}
          >
            {switchProps.label}
          </Label>
        </div>
      );
    }
  },

  Checkbox: {
    name: '复选框 (Checkbox)',
    icon: <CheckSquare size={14} />,
    category: 'Forms',
    defaultProps: {
      label: '我同意服务条款',
      checked: true
    },
    render: (props, theme?: Theme) => {
      const checkboxProps = props as unknown as CheckboxProps;
      return (
        <div className="flex items-center space-x-2 w-full">
          <Checkbox 
            id="checkbox" 
            checked={checkboxProps.checked}
            style={{
              borderColor: theme?.border,
              backgroundColor: checkboxProps.checked ? theme?.primary : 'transparent'
            }}
          />
          <Label
            htmlFor="checkbox"
            className="text-sm font-medium leading-none cursor-pointer"
            style={{ color: theme?.foreground }}
          >
            {checkboxProps.label}
          </Label>
        </div>
      );
    }
  }
};