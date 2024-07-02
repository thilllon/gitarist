import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/github-action.ts'],
  sourcemap: true,
  clean: true,
  dts: true,
  treeshake: true,
  minify: false,
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.json',
});
