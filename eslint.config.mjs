import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'commitlint.config.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended.map(({ rules, ...others }) => {
    return {
      ...others,
      rules: {
        ...rules,
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    };
  }),
);
