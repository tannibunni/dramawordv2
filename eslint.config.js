import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-undef': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      'no-case-declarations': 'error',
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // React Native globals
        __DEV__: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        NodeJS: 'readonly',
        // Web APIs (for React Native)
        window: 'readonly',
        FormData: 'readonly',
        RequestInit: 'readonly',
        SpeechSynthesisUtterance: 'readonly',
        // React Native specific
        Alert: 'readonly',
        Animated: 'readonly',
        ScrollView: 'readonly',
        FlatList: 'readonly',
        Modal: 'readonly',
        TouchableOpacity: 'readonly',
        ActivityIndicator: 'readonly',
        Keyboard: 'readonly',
        Platform: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.expo/**',
      'android/**',
      'ios/**',
      '*.config.js',
      'metro.config.js',
      'babel.config.js',
      'test-*.js',
      '**/test-*.js',
      '**/*.test.js',
      '**/*.test.ts',
      '**/*.spec.js',
      '**/*.spec.ts',
    ],
  }
); 