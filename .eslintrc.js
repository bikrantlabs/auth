/* eslint-env node */
module.exports = {
  extends: [],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: [
    "bundle/**",
    "dist/**",
    "node_modules/**",
    ".yarn/**",
    "migrations/**",
    "TODO/**",
    "**/*.js", // ignore plain JS files
    "**/*.cjs", // ignore the eslint config itself
    "**/*.mjs",
  ],
  parserOptions: {
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
  },

  overrides: [
    {
      // Enables type checking for typescript files.
      // Src for the overrides from here :
      // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslint-recommended.ts
      files: ["*.ts", "*.tsx", "*.mts", "*.cts"],
      parser: "@typescript-eslint/parser",
      // Move parserOptions INTO the override, so it only applies to TS files
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        // "eslint" rules
        // check https://eslint.org/docs/latest/rules/ for reference
        "no-cond-assign": ["error", "always"],
        eqeqeq: ["error"],
        "no-constant-binary-expression": "error",
        curly: "error",
        "default-case": "error",
        "default-case-last": "error",
        "no-constant-condition": "error",
        "no-duplicate-imports": "error",
        "no-fallthrough": "error",
        "use-isnan": "error",

        "no-loss-of-precision": "error",
        "no-promise-executor-return": "error",
        // See "when not to use it", and check your use case, if you think this
        // rule should be disabled.
        "no-await-in-loop": "error",
        "no-useless-escape": "error",
        "prefer-object-spread": "error",
        "prefer-spread": "error",
        "no-empty": "error",
        "no-useless-catch": "error",
        // See "when not to use it", and check your use case, if you think this
        // rule should be disabled.
        "no-bitwise": "error",
        // typescript-eslint rules
        // check https://typescript-eslint.io/rules/ for reference
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
        "@typescript-eslint/no-unnecessary-condition": "error",
        "@typescript-eslint/prefer-includes": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-reduce-type-parameter": "error",
        "@typescript-eslint/prefer-string-starts-ends-with": "error",
        "@typescript-eslint/ban-types": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-for-in-array": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-return": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/restrict-plus-operands": "error",
      },
    },
  ],
  root: true,
};
