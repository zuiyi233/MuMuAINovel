import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const COLOR_LITERAL_RE = /(#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\))/;
const UNIT_LITERAL_RE = /-?\d+(\.\d+)?(px|rem|em|vh|vw|%)\b/;
const TOKEN_LITERAL_RE = /^var\(--.+\)$/;

const SPRING_FESTIVAL_WHITELIST = [
  /\/src\/components\/SpringFestival\.tsx$/,
  /\/src\/components\/SpringFestival\.css$/,
  /\/src\/components\/AnnotatedText\.tsx$/,
  /\/src\/components\/MemorySidebar\.tsx$/,
];

const UI_ENFORCED_PATHS = [
  '/src/components/ui/',
  '/src/components/layout/',
  '/src/components/CardStyles.tsx',
];

const mumuLintPlugin = {
  rules: {
    'no-hardcoded-ui-values': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow hardcoded visual values in UI layer. Use design tokens instead.',
        },
        schema: [],
      },
      create(context) {
        const filename = context.filename.replace(/\\/g, '/');
        const isWhitelisted = SPRING_FESTIVAL_WHITELIST.some((re) => re.test(filename));
        const shouldEnforce =
          !isWhitelisted && UI_ENFORCED_PATHS.some((target) => filename.includes(target));

        if (!shouldEnforce) {
          return {};
        }

        const checkStringLiteral = (node, value) => {
          if (!value || TOKEN_LITERAL_RE.test(value)) return;
          if (COLOR_LITERAL_RE.test(value)) {
            context.report({
              node,
              message: 'Hardcoded color is not allowed in UI layer. Use design tokens.',
            });
          }
        };

        const isSensitiveStyleKey = (keyName) =>
          [
            'borderRadius',
            'boxShadow',
            'fontSize',
            'margin',
            'marginTop',
            'marginRight',
            'marginBottom',
            'marginLeft',
            'padding',
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',
            'gap',
            'rowGap',
            'columnGap',
            'lineHeight',
          ].includes(keyName);

        const checkStyleObject = (node) => {
          if (!node || node.type !== 'ObjectExpression') return;
          for (const prop of node.properties) {
            if (!prop || prop.type !== 'Property') continue;
            const keyName =
              prop.key.type === 'Identifier'
                ? prop.key.name
                : prop.key.type === 'Literal'
                  ? String(prop.key.value)
                  : '';
            if (!isSensitiveStyleKey(keyName)) continue;

            const valueNode = prop.value;
            if (valueNode.type === 'Literal') {
              if (keyName === 'lineHeight' && typeof valueNode.value === 'number') {
                continue;
              }
              if (typeof valueNode.value === 'number' && valueNode.value !== 0) {
                context.report({
                  node: valueNode,
                  message: `Hardcoded ${keyName} is not allowed in UI layer. Use tokens.`,
                });
              }
              if (typeof valueNode.value === 'string') {
                const raw = valueNode.value.trim();
                if (!TOKEN_LITERAL_RE.test(raw) && UNIT_LITERAL_RE.test(raw)) {
                  context.report({
                    node: valueNode,
                    message: `Hardcoded ${keyName} with unit value is not allowed in UI layer. Use tokens.`,
                  });
                }
              }
            }
          }
        };

        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              checkStringLiteral(node, node.value.trim());
            }
          },
          TemplateElement(node) {
            const raw = node.value?.raw?.trim();
            checkStringLiteral(node, raw);
          },
          JSXAttribute(node) {
            if (node.name?.name !== 'style') return;
            if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
            checkStyleObject(node.value.expression);
          },
        };
      },
    },
  },
};

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      mumu: mumuLintPlugin,
    },
    rules: {
      'mumu/no-hardcoded-ui-values': 'error',
    },
  },
])
