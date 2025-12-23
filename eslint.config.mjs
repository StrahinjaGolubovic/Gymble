import { createRequire } from "module";

const require = createRequire(import.meta.url);

/** @type {import("eslint").Linter.FlatConfig[]} */
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

const config = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/data/**",
      "**/uploads/**",
      "**/profiles/**",
      "**/public/uploads/**",
      "**/public/profiles/**",
      "**/dist/**",
      "**/out/**",
      "**/coverage/**",
    ],
  },
  ...nextCoreWebVitals,
];

export default config;


