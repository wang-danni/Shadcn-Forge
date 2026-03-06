import { COMPONENT_REGISTRY } from './components';

export const CATEGORIES = [
  {
    id: 'Forms',
    name: '表单输入',
    items: Object.entries(COMPONENT_REGISTRY).filter(([, config]) => config.category === 'Forms')
  },
  {
    id: 'Display',
    name: '数据展示',
    items: Object.entries(COMPONENT_REGISTRY).filter(([, config]) => config.category === 'Display')
  },
  {
    id: 'Feedback',
    name: '反馈提醒',
    items: Object.entries(COMPONENT_REGISTRY).filter(([, config]) => config.category === 'Feedback')
  }
];