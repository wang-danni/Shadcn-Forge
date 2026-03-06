export interface Theme {
  primary: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  radius: number;
  destructive: string;
  secondary: string;
  secondaryForeground: string;
  primaryForeground?: string;
  mutedForeground?: string;
  borderWidth?: number;
  shadow?: string;
  appBg?: string;
  workspaceBg?: string;
  isDark?: boolean;
}

// 为 ComponentConfig render 函数添加别名
export type ThemeStyle = Theme;
export type LayoutConfig = Layout;

export interface Layout {
  padding: number;
  gap: number;
  direction: 'column' | 'row';
  align: 'start' | 'center' | 'end'; 
  backdrop: 'none' | 'grid' | 'dots';  
  appBg: string;
  workspaceBg: string;
  radius: number;       
  borderWidth: number; 
}

export interface ComponentItem {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    borderRadius?: number;
    borderWidth?: number;
  };
}

// PropSchema 类型定义
export interface PropSchema {
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[] | number[];
  min?: number;
  max?: number;
}

export interface ComponentConfig {
  name: string;
  icon: React.ReactNode;
  category: string;
  defaultProps: Record<string, unknown>;
  propSchema?: Record<string, PropSchema>;
  render: (props: Record<string, unknown>, theme?: Theme, layout?: Layout) => React.ReactNode;
}

export interface ForgeStore {
  isDarkMode: boolean;
  theme: Theme;
  layout: Layout;
  canvasItems: ComponentItem[];
  activeComponentId: string | null;
  isPreviewMode: boolean;
  history: ComponentItem[][];
  historyStep: number;
  
  _saveHistory: (newItems: ComponentItem[]) => { canvasItems: ComponentItem[]; history: ComponentItem[][]; historyStep: number };
  toggleDarkMode: () => void;
  togglePreviewMode: () => void;
  updateTheme: (updates: Partial<Theme>) => void;  
  applyPreset: (presetName: string) => void;
  updateLayout: (updates: Partial<Layout>) => void;
  updateComponentStyle: (id: string, styleUpdates: Partial<ComponentItem['style']>) => void;
  addComponent: (type: string) => void;
  appendComponents: (items: ComponentItem[]) => void;
  removeComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  reorderComponent: (draggedId: string, targetId: string) => void;
  insertComponentAt: (type: string, targetId: string | null) => void;
  moveComponent: (id: string, direction: 'up' | 'down') => void;
  updateComponentProp: (id: string, key: string, value: unknown) => void;
  undo: () => void;
  redo: () => void;
  setActiveComponentId: (id: string | null) => void;
  clearCanvas: () => void;
  resetAll: () => void;
}

// AI 生成相关类型
export interface AIGeneratedComponent {
  type: string;
  props: Record<string, unknown>;
}

export interface AIComponentSchema {
  type: string;
  availableProps: string[];
}

// 组件 Props 类型定义
export interface CardProps {
  title: string;
  description?: string;
}

export interface AvatarProps {
  fallback: string;
  src?: string;
  size: 'sm' | 'default' | 'lg';
}

export interface BadgeProps {
  text: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface SeparatorProps {
  orientation: 'horizontal' | 'vertical';
}

export interface ButtonProps {
  children: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size: 'sm' | 'default' | 'lg';
}

export interface InputProps {
  placeholder: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

export interface TextareaProps {
  placeholder: string;
  rows: number;
}

export interface SwitchProps {
  label: string;
  checked: boolean;
}

export interface CheckboxProps {
  label: string;
  checked: boolean;
}

export interface AlertProps {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
}

export interface ProgressProps {
  value: number;
  label?: string;
}

export interface SkeletonProps {
  lines: number;
}