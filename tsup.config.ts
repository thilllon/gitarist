import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  sourcemap: true,
  clean: true,
  dts: true,
  treeshake: true,
  minify: true,
  shims: true,
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.json',
});
