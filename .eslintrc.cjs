module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { 
    ecmaVersion: "latest", 
    sourceType: "module",
    project: "./tsconfig.json"
  },
  plugins: ["@typescript-eslint", "unused-imports", "react"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "next/core-web-vitals",
    "next/typescript"
  ],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error", 
      { 
        "vars": "all", 
        "varsIgnorePattern": "^_", 
        "args": "after-used", 
        "argsIgnorePattern": "^_" 
      }
    ]
  },
  settings: { 
    react: { version: "detect" } 
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "dist/",
    "coverage/",
    ".vercel/",
    ".turbo/",
    "*.config.js",
    "*.config.mjs",
    "stars-codebase/**"
  ]
};
