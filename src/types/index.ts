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
  parentId?: string;
  props: Record<string, unknown>;
  style?: {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    // 额外可编辑的样式字段
    padding?: number; // px
    fontSize?: number; // px
    width?: 'auto' | 'full' | string;
    height?: 'auto' | 'full' | string;
    // 每个组件可单独设置排版方向
    direction?: 'column' | 'row';
    // 卡片内子组件排版方向（仅 Card 组件有效）
    childrenDirection?: 'column' | 'row';
    // 组件在画布中的对齐方式
    alignSelf?: 'start' | 'center' | 'end' | 'stretch';
    // 横向布局时的连续位置偏移，单位为百分比
    horizontalOffset?: number;
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
  // 现在 render 可以接收第四个参数为 ComponentItem，方便读取 item.style 等信息
  render: (props: Record<string, unknown>, theme?: Theme, layout?: Layout, item?: ComponentItem) => React.ReactNode;
}

export type PreviewViewport = 'mobile' | 'tablet' | 'desktop';

export interface ForgeStore {
  isDarkMode: boolean;
  theme: Theme;
  layout: Layout;
  canvasItems: ComponentItem[];
  clipboardItems: ComponentItem[];
  activeComponentId: string | null;
  selectedComponentIds: string[];
  isPreviewMode: boolean;
  previewViewport: PreviewViewport;
  history: ComponentItem[][];
  historyStep: number;
  aiSessionLog: AISessionEntry[];
  
  _saveHistory: (newItems: ComponentItem[]) => { canvasItems: ComponentItem[]; history: ComponentItem[][]; historyStep: number };
  toggleDarkMode: () => void;
  togglePreviewMode: () => void;
  setPreviewViewport: (viewport: PreviewViewport) => void;
  updateTheme: (updates: Partial<Theme>) => void;  
  applyPreset: (presetName: string) => void;
  updateLayout: (updates: Partial<Layout>) => void;
  updateComponentStyle: (id: string, styleUpdates: Partial<ComponentItem['style']>) => void;
  addComponent: (type: string) => void;
  addComponentToCard: (type: string, cardId: string) => void;
  appendComponents: (items: ComponentItem[]) => void;
  updateComponentParent: (id: string, parentId?: string) => void;
  removeComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  copySelectedComponents: () => void;
  pasteClipboard: () => void;
  reorderComponent: (draggedId: string, targetId: string, position?: 'before' | 'after') => void;
  insertComponentAt: (type: string, targetId: string | null, position?: 'before' | 'after') => void;
  moveComponent: (id: string, direction: 'up' | 'down') => void;
  updateComponentProp: (id: string, key: string, value: unknown) => void;
  replaceComponentProps: (id: string, props: Record<string, unknown>) => void;
  replaceCardChildren: (cardId: string, cardProps: Record<string, unknown>, children: ComponentItem[]) => void;
  appendAISessionEntry: (entry: Omit<AISessionEntry, 'timestamp'>) => void;
  clearAISessionLog: () => void;
  undo: () => void;
  redo: () => void;
  setActiveComponentId: (id: string | null) => void;
  setSelectedComponentIds: (ids: string[]) => void;
  toggleSelectedComponentId: (id: string) => void;
  clearSelection: () => void;
  removeSelectedComponents: () => void;
  loadFromSnapshot: (payload: {
    canvasItems: ComponentItem[];
    theme?: Partial<Theme>;
    layout?: Partial<Layout>;
  }) => void;
  clearCanvas: () => void;
  resetAll: () => void;
}

// AI 生成相关类型
export interface AISessionEntry {
  scope: 'page' | 'local';
  prompt: string;
  resultSummary: string;
  componentType?: string;
  timestamp: number;
}

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
  content?: string;
  footerPrimary?: string;
  footerSecondary?: string;
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

export interface SelectProps {
  placeholder: string;
  options: string;
}

export interface TabsProps {
  tabs: string;
  defaultTab: string;
  content: string;
}

export interface DialogProps {
  triggerText: string;
  title: string;
  description: string;
  confirmText: string;
}

export interface DropdownMenuProps {
  triggerText: string;
  items: string;
}

export interface TableProps {
  columns: string;
  rows: string;
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