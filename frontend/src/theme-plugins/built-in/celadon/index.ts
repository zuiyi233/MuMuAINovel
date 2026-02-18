import type { ThemePlugin } from '../../types';
import { getThemeCssVars } from '../../../design-system';
import manifest from './manifest.json';

// 天青墨纸主题 —— 天青色为主调，米汤白为底，墨色为文
// 参考 iA Writer / Bear / Craft 等笔记软件的温暖护眼配色
const semanticVars = getThemeCssVars('celadon');

const theme: ThemePlugin = {
  manifest,

  antdTheme: {
    token: {
      colorPrimary: semanticVars['color-primary'],
      colorBgBase: semanticVars['color-bg-base'],
      colorTextBase: semanticVars['color-text-base'],
      colorBgContainer: semanticVars['color-bg-container'],
      colorBorder: semanticVars['color-border-light'],
      // 天青色作为强调色，但整体保持低饱和度
      borderRadius: 10,
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
        borderRadiusLG: 14,
      },
      Button: {
        borderRadius: 8,
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
        // 写作工坊背景：浅竹纸色
        'color-bg-layout': '#DDD7CB',
        'shadow-card': semanticVars['shadow-card'],
      },
      customCSS: '',
    },
  },

  motion: {
    enablePageTransition: true,
    durationMs: 320,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
};

export default theme;
