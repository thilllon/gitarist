import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.mts', 'src/github-action.ts'],
  sourcemap: false,
  clean: true,
  dts: true,
  treeshake: true,
  minify: true,
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.json',
});
