import type { ThemePlugin } from '../../types';
import type { ThemeSemanticVars } from '../../../design-system';
import manifest from './manifest.json';

const semanticVars: ThemeSemanticVars = {
  'color-primary': '#70B8C2',
  'color-primary-hover': '#8FC9D1',
  'color-primary-active': '#5A9BA5',
  'color-success': '#52C41A',
  'color-success-active': '#95DE64',
  'color-warning': '#FAAD14',
  'color-error': '#FF7875',
  'color-info': '#69B1FF',
  'color-success-bg': '#162312',
  'color-success-border': '#274916',
  'color-warning-bg': '#2B2111',
  'color-warning-border': '#594214',
  'color-error-bg': '#2A1215',
  'color-error-border': '#58181C',
  'color-info-bg': '#111D2C',
  'color-info-border': '#15395B',
  'color-bg-base': '#141414',
  'color-bg-container': '#1F1F1F',
  'color-bg-layout': '#0F0F0F',
  'color-bg-spotlight': '#2A2A2A',
  'color-bg-mask': 'rgba(0, 0, 0, 0.65)',
  'color-text-base': '#E8E8E8',
  'color-text-primary': '#E8E8E8',
  'color-text-secondary': '#A8A8A8',
  'color-text-tertiary': '#737373',
  'color-text-quaternary': '#595959',
  'color-border': '#434343',
  'color-border-secondary': '#303030',
  'color-border-light': '#2A2A2A',
  'shadow-card': '0 2px 8px rgba(0, 0, 0, 0.3)',
  'shadow-elevated': '0 8px 24px rgba(0, 0, 0, 0.4)',
  'shadow-primary': '0 4px 16px rgba(112, 184, 194, 0.25)',
  'shadow-header': '0 2px 8px rgba(0, 0, 0, 0.3)',
};

const theme: ThemePlugin = {
  manifest,

  antdTheme: {
    token: {
      colorPrimary: '#70B8C2',
      colorBgBase: '#141414',
      colorTextBase: '#E8E8E8',
      borderRadius: 6,
      wireframe: false,
    },
    components: {
      Layout: {
        bodyBg: '#141414',
        headerBg: '#1F1F1F',
        siderBg: '#1F1F1F',
      },
      Card: {
        colorBgContainer: '#1F1F1F',
        boxShadowTertiary: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
    },
  },

  semanticVars,
  cssVars: semanticVars,

  customCSS: `
    /* Dark mode specific overrides */
    .modern-sider {
      background: linear-gradient(180deg,
        rgba(31, 31, 31, 0.98) 0%,
        rgba(20, 20, 20, 1) 100%) !important;
      border-right: 1px solid rgba(112, 184, 194, 0.15);
    }
  `,
};

export default theme;
