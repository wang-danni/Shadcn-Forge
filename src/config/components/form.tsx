import { ComponentConfig, ButtonProps, InputProps, TextareaProps, SwitchProps, CheckboxProps, Theme, ComponentItem, SelectProps } from '@/types';
import { MousePointer2, Type, AlignLeft, ToggleLeft, CheckSquare, ChevronDownSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

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
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const buttonProps = props as unknown as ButtonProps;
      const styleFromItem = item?.style || {};
      const bgFromVariant = buttonProps.variant === 'default' ? theme?.primary : 
                           buttonProps.variant === 'secondary' ? theme?.secondary :
                           buttonProps.variant === 'destructive' ? theme?.destructive : undefined;
      const colorFromVariant = buttonProps.variant === 'default' ? (theme?.primaryForeground || '#ffffff') :
                              buttonProps.variant === 'secondary' ? theme?.secondaryForeground :
                              buttonProps.variant === 'outline' || buttonProps.variant === 'ghost' ? theme?.foreground : undefined;

      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? bgFromVariant,
        color: styleFromItem.color ?? colorFromVariant,
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined),
        borderWidth: styleFromItem.borderWidth !== undefined ? `${styleFromItem.borderWidth}px` : (theme?.borderWidth ? `${theme.borderWidth}px` : undefined),
        borderColor: styleFromItem.borderColor ?? (buttonProps.variant === 'outline' ? theme?.border : undefined),
        padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined,
        fontSize: styleFromItem.fontSize !== undefined ? `${styleFromItem.fontSize}px` : undefined,
        ...withDimensionStyles(item)
      };
       return (
         <Button 
           variant={buttonProps.variant} 
           size={buttonProps.size}
           style={mergedStyle}
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
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const inputProps = props as unknown as InputProps;
      const styleFromItem = item?.style || {};
      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? theme?.background,
        borderColor: styleFromItem.borderColor ?? theme?.border,
        color: styleFromItem.color ?? theme?.foreground,
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined),
        borderWidth: styleFromItem.borderWidth !== undefined ? `${styleFromItem.borderWidth}px` : (theme?.borderWidth ? `${theme.borderWidth}px` : undefined),
        padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined,
        fontSize: styleFromItem.fontSize !== undefined ? `${styleFromItem.fontSize}px` : undefined,
        ...withDimensionStyles(item)
      };
      return (
        <div className="w-full space-y-2">
          <Input
            type={inputProps.type}
            placeholder={inputProps.placeholder}
            className="w-full"
            style={mergedStyle}
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
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const textareaProps = props as unknown as TextareaProps;
      const styleFromItem = item?.style || {};
      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? theme?.background,
        borderColor: styleFromItem.borderColor ?? theme?.border,
        color: styleFromItem.color ?? theme?.foreground,
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined),
        borderWidth: styleFromItem.borderWidth !== undefined ? `${styleFromItem.borderWidth}px` : (theme?.borderWidth ? `${theme.borderWidth}px` : undefined),
        padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined,
        fontSize: styleFromItem.fontSize !== undefined ? `${styleFromItem.fontSize}px` : undefined,
        ...withDimensionStyles(item)
      };
      return (
        <div className="w-full space-y-2">
          <Textarea
            placeholder={textareaProps.placeholder}
            rows={textareaProps.rows}
            className="w-full"
            style={mergedStyle}
          />
        </div>
      );
    }
  },

  Select: {
    name: '选择器 (Select)',
    icon: <ChevronDownSquare size={14} />,
    category: 'Forms',
    defaultProps: {
      placeholder: '选择一个选项',
      options: '个人版,团队版,企业版'
    },
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const selectProps = props as unknown as SelectProps;
      const styleFromItem = item?.style || {};
      const mergedStyle: any = {
        backgroundColor: styleFromItem.backgroundColor ?? theme?.background,
        borderColor: styleFromItem.borderColor ?? theme?.border,
        color: styleFromItem.color ?? theme?.foreground,
        borderRadius: styleFromItem.borderRadius !== undefined ? `${styleFromItem.borderRadius}px` : (theme ? `${theme.radius}px` : undefined),
        borderWidth: styleFromItem.borderWidth !== undefined ? `${styleFromItem.borderWidth}px` : (theme?.borderWidth ? `${theme.borderWidth}px` : undefined),
        padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined,
        fontSize: styleFromItem.fontSize !== undefined ? `${styleFromItem.fontSize}px` : undefined,
        ...withDimensionStyles(item)
      };

      return <Select placeholder={selectProps.placeholder} options={splitByComma(selectProps.options)} style={mergedStyle} />;
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
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const switchProps = props as unknown as SwitchProps;
      const styleFromItem = item?.style || {};
      // render Switch and Label inline without outer container; only change checked color and label color
      return (
        <>
          <Switch
            id="switch"
            checked={switchProps.checked}
            style={{
              backgroundColor: switchProps.checked ? (styleFromItem.backgroundColor ?? theme?.primary) : undefined
            }}
          />
          <Label
            htmlFor="switch"
            className="text-sm font-medium cursor-pointer"
            style={{ color: styleFromItem.color ?? theme?.foreground, marginLeft: '8px' }}
          >
            {switchProps.label}
          </Label>
        </>
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
    render: (props, theme?: Theme, _layout?: any, item?: ComponentItem) => {
      const checkboxProps = props as unknown as CheckboxProps;
      const styleFromItem = item?.style || {};
      return (
        <div className="flex items-center space-x-2 w-full" style={{ padding: styleFromItem.padding !== undefined ? `${styleFromItem.padding}px` : undefined }}>
          <Checkbox 
            id="checkbox" 
            checked={checkboxProps.checked}
            style={{
              borderColor: styleFromItem.borderColor ?? theme?.border,
              backgroundColor: checkboxProps.checked ? (styleFromItem.backgroundColor ?? theme?.primary) : 'transparent'
            }}
          />
          <Label
            htmlFor="checkbox"
            className="text-sm font-medium leading-none cursor-pointer"
            style={{ color: styleFromItem.color ?? theme?.foreground, fontSize: styleFromItem.fontSize !== undefined ? `${styleFromItem.fontSize}px` : undefined }}
          >
            {checkboxProps.label}
          </Label>
        </div>
      );
    }
  }
 };