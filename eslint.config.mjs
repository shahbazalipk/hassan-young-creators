/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "_legacy/**", "prisma/dev.db"],
  },
];

export default config;
