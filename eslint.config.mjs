import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    "**/.next/**",
    "**/.next-test/**",
    "**/node_modules/**",
    ".cache/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
