import { ComponentConfig } from '@/types';
import { formComponents } from './form';
import { displayComponents } from './display';
import { feedbackComponents } from './feedback';

export const COMPONENT_REGISTRY: Record<string, ComponentConfig> = {
  ...formComponents,
  ...displayComponents,
  ...feedbackComponents
};

export { formComponents, displayComponents, feedbackComponents };