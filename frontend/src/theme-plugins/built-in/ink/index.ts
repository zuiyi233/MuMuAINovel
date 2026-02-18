import type { ThemePlugin } from '../../types';
import { getThemeCssVars } from '../../../design-system';
import manifest from './manifest.json';

const semanticVars = getThemeCssVars('ink');

const theme: ThemePlugin = {
  manifest,

  antdTheme: {
    token: {
      colorPrimary: semanticVars['color-primary'],
      colorBgBase: semanticVars['color-bg-base'],
      colorTextBase: semanticVars['color-text-base'],
      colorBgContainer: semanticVars['color-bg-container'],
      colorBorder: semanticVars['color-border-light'],
      borderRadius: 12,
      wireframe: false,
      fontFamily: 'var(--font-family-sans)',
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

  customCSS: '',

  featureOverrides: {
    prompt_workshop: {
      cssVars: {
        'color-bg-layout': '#D8DBE8',
        'shadow-card': semanticVars['shadow-card'],
      },
      customCSS: '',
    },
  },

  motion: {
    enablePageTransition: true,
    durationMs: 380,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
};

export default theme;
