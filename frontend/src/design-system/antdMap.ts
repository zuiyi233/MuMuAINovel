import type { ThemeConfig } from 'antd';
import tokens from './generated/tokens.json';

export type ThemeId = 'default' | 'dark' | 'ink';

type ThemeTokens = Record<string, string>;

const readTheme = (themeId: ThemeId): ThemeTokens => {
  const allThemes = (tokens as { themes: Record<ThemeId, ThemeTokens> }).themes;
  return allThemes[themeId];
};

const createThemeConfig = (themeId: ThemeId): ThemeConfig => {
  const t = readTheme(themeId);
  return {
    token: {
      colorPrimary: t['color-primary'],
      colorSuccess: t['color-success'],
      colorWarning: t['color-warning'],
      colorError: t['color-error'],
      colorInfo: t['color-info'],
      colorBgBase: t['color-bg-base'],
      colorBgContainer: t['color-bg-container'],
      colorBorder: t['color-border'],
      colorTextBase: t['color-text-base'],
      colorText: t['color-text-primary'],
      colorTextSecondary: t['color-text-secondary'],
      colorTextTertiary: t['color-text-tertiary'],
      borderRadius: 10,
      fontFamily: 'var(--font-family-sans)',
      wireframe: false,
      controlHeight: 36,
    },
    components: {
      Layout: {
        bodyBg: t['color-bg-base'],
        headerBg: t['color-bg-container'],
        siderBg: t['color-bg-container'],
      },
      Card: {
        colorBgContainer: t['color-bg-container'],
        boxShadowTertiary: t['shadow-card'],
        borderRadiusLG: 12,
      },
      Button: {
        borderRadius: 10,
        controlHeight: 36,
        controlHeightLG: 44,
      },
      Input: {
        borderRadius: 10,
      },
      Modal: {
        borderRadiusLG: 12,
      },
      Drawer: {
        colorBgElevated: t['color-bg-container'],
      },
      Menu: {
        itemBorderRadius: 10,
      },
      Alert: {
        borderRadiusLG: 10,
      },
    },
  };
};

export const antdThemeMap: Record<ThemeId, ThemeConfig> = {
  default: createThemeConfig('default'),
  dark: createThemeConfig('dark'),
  ink: createThemeConfig('ink'),
};

export const getAntdThemeConfig = (themeId: string): ThemeConfig =>
  antdThemeMap[(themeId as ThemeId) || 'default'] ?? antdThemeMap.default;
