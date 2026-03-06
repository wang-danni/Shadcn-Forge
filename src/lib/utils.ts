import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const copyToClipboard = (text: string): void => {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const getBackdropStyle = (
  backdrop: 'none' | 'grid' | 'dots' | 'noise',
  isDarkMode: boolean
) => {
  if (backdrop === 'grid') {
    return {
      backgroundImage:
        'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    };
  }

  if (backdrop === 'dots') {
    return {
      backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    };
  }

  if (backdrop === 'noise') {
    return {
      backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
      opacity: isDarkMode ? 0.15 : 0.05
    };
  }

  return {};
};