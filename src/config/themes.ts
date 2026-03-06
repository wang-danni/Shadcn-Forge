import { Theme } from '@/types';

export const THEME_PRESETS: Record<string, Theme> = {
  Default: {
    primary: '#3b82f6',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f1f5f9',
    border: '#e2e8f0',
    radius: 8,
    borderWidth: 1,
    destructive: '#ef4444',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    appBg: '#f8fafc',
    workspaceBg: '#f1f5f9',
    isDark: false
  },
  Zinc: {
    primary: '#18181b',
    background: '#ffffff',
    foreground: '#09090b',
    muted: '#f4f4f5',
    border: '#e4e4e7',
    radius: 6,              
    borderWidth: 1,
    destructive: '#ef4444',
    secondary: '#f4f4f5',
    secondaryForeground: '#18181b',
    appBg: '#ffffff',
    workspaceBg: '#f4f4f5',
    isDark: false
  },
  Rose: {
    primary: '#e11d48',
    background: '#ffffff',
    foreground: '#0c0a09',
    muted: '#ffe4e6',
    border: '#fecdd3',
    radius: 10,
    borderWidth: 1,
    destructive: '#ef4444',
    secondary: '#ffe4e6',
    secondaryForeground: '#e11d48',
    appBg: '#fff1f2',
    workspaceBg: '#ffe4e6',
    isDark: false
  },
  Midnight: {
    primary: '#818cf8',
    background: '#0f172a',
    foreground: '#f8fafc',
    muted: '#1e293b',
    border: '#334155',
    radius: 8,
    borderWidth: 1,
    destructive: '#f87171',
    secondary: '#1e293b',
    secondaryForeground: '#f8fafc',
    appBg: '#020617',
    workspaceBg: '#0f172a',
    isDark: true
  }
};