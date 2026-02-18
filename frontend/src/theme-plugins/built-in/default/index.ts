import type { ThemePlugin } from '../../types';
import type { ThemeSemanticVars } from '../../../design-system';
import manifest from './manifest.json';

const semanticVars: ThemeSemanticVars = {
  'color-primary': '#4D8088',
  'color-primary-hover': '#5F9EA8',
  'color-primary-active': '#3A666C',
  'color-success': '#52C41A',
  'color-success-active': '#389E0D',
  'color-warning': '#FAAD14',
  'color-error': '#FF4D4F',
  'color-info': '#1890FF',
  'color-success-bg': '#F6FFED',
  'color-success-border': '#B7EB8F',
  'color-warning-bg': '#FFFBE6',
  'color-warning-border': '#FFE58F',
  'color-error-bg': '#FFF2F0',
  'color-error-border': '#FFCCC7',
  'color-info-bg': '#E6F7FF',
  'color-info-border': '#91D5FF',
  'color-bg-base': '#F8F6F1',
  'color-bg-container': '#FFFFFF',
  'color-bg-layout': '#F0F2F5',
  'color-bg-spotlight': '#3A666C',
  'color-bg-mask': 'rgba(0, 0, 0, 0.45)',
  'color-text-base': '#2B2B2B',
  'color-text-primary': '#2B2B2B',
  'color-text-secondary': '#595959',
  'color-text-tertiary': '#8C8C8C',
  'color-text-quaternary': '#BFBFBF',
  'color-border': '#D9D9D9',
  'color-border-secondary': '#F0F0F0',
  'color-border-light': '#E8EBEE',
  'shadow-card': '0 2px 8px rgba(0, 0, 0, 0.06)',
  'shadow-elevated': '0 8px 24px rgba(77, 128, 136, 0.15)',
  'shadow-primary': '0 4px 16px rgba(77, 128, 136, 0.25)',
  'shadow-header': '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const theme: ThemePlugin = {
  manifest,

  // AntD ConfigProvider theme configuration
  antdTheme: {
    token: {
      colorPrimary: '#4D8088',
      colorBgBase: '#F8F6F1',
      colorTextBase: '#2B2B2B',
      borderRadius: 6,
      wireframe: false,
      fontFamily: 'var(--font-family-sans)',
    },
    components: {
      Layout: {
        bodyBg: '#F8F6F1',
        headerBg: '#FFFFFF',
        siderBg: '#FFFFFF',
      },
      Card: {
        colorBgContainer: '#FFFFFF',
        boxShadowTertiary: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      Button: {
        borderRadius: 6,
        controlHeight: 36,
      },
    },
  },

  semanticVars,
  cssVars: semanticVars,
};

export default theme;
