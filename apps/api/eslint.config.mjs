import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "drizzle/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  { files: ["src/**/*.spec.ts", "src/seed/**/*.ts"], rules: { "max-lines-per-function": "off" } },
  {
    // domain là TypeScript thuần: không biết application, infrastructure, ORM, NestJS (ADR-017 kiểu YBA).
    files: ["src/modules/*/domain/**/*.ts"],
    ignores: ["src/modules/*/domain/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        { group: ["**/application/**", "**/infrastructure/**"], message: "domain không import application hay infrastructure" },
        { group: ["drizzle-orm", "drizzle-orm/*", "postgres", "@nestjs/*"], message: "domain không import ORM hay NestJS" },
      ] }],
    },
  },
  {
    // application chỉ biết domain và port của mình; cài đặt port nằm ở infrastructure.
    files: ["src/modules/*/application/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        { group: ["**/infrastructure/**"], message: "application không import infrastructure; khai port ở application" },
        { group: ["drizzle-orm", "drizzle-orm/*", "postgres"], message: "application không import ORM; dùng port" },
      ] }],
    },
  },
);
