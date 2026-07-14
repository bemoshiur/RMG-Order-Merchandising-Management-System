import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Static security analysis: flags eval-with-expression, child_process, non-literal fs paths,
  // unsafe regex, insecure randomness, buffer noassert, etc.
  security.configs.recommended,
  {
    rules: {
      // detect-object-injection fires on every `obj[key]` access (e.g. our `data[field]` inline
      // editors, all tenant-scoped and field-allowlisted) — it is pure noise, so turn it off while
      // keeping every other security rule active.
      "security/detect-object-injection": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
