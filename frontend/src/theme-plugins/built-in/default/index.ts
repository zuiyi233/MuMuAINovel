import type { ThemePlugin } from '../../types';
import { getThemeCssVars } from '../../../design-system';
import manifest from './manifest.json';

const semanticVars = getThemeCssVars('default');

const theme: ThemePlugin = {
  manifest,

  // AntD ConfigProvider theme configuration
  antdTheme: {
    token: {
      colorPrimary: semanticVars['color-primary'],
      colorBgBase: semanticVars['color-bg-base'],
      colorTextBase: semanticVars['color-text-base'],
      borderRadius: 12,
      wireframe: false,
      fontFamily: 'var(--font-family-sans)',
      colorBgContainer: semanticVars['color-bg-container'],
      colorBorder: semanticVars['color-border-light'],
    },
    components: {
      Layout: {
        bodyBg: semanticVars['color-bg-base'],
        headerBg: semanticVars['color-bg-container'],
        siderBg: semanticVars['color-bg-container'],
      },
      Card: {
        colorBgContainer: semanticVars['color-bg-container'],
        boxShadowTertiary: semanticVars['shadow-card'],
        borderRadiusLG: 16,
      },
      Button: {
        borderRadius: 10,
        controlHeight: 34,
      },
    },
  },

  semanticVars,
  cssVars: semanticVars,
};

export default theme;
