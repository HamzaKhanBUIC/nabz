import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules/", "dist/", "coverage/", "logs/", "data/", "contract/", "content/", "tools/console/", ".claude/"],
  },
  ...tseslint.configs.recommended,
  {
    // src/core is the rules engine. It must stay pure so it can run anywhere
    // and so every result is reproducible: no Node APIs, no clock, no randomness.
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["node:*", "fs", "fs/*", "path", "os", "http", "https", "child_process"], message: "src/core must not use Node APIs." },
            { group: ["express", "cors"], message: "src/core must not know about HTTP." },
            { group: ["**/api/**", "**/store/**"], message: "src/core must not import the API or the store." },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        { object: "Date", property: "now", message: "Pass the time in as an argument." },
        { object: "Math", property: "random", message: "src/core must be deterministic." },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: "Pass the time in as an argument." },
      ],
    },
  },
);
