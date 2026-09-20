import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import boundaries from "eslint-plugin-boundaries";
import importX from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

// Cada repositório mantém sua própria política; não há dependência entre checkouts.
const domains = {
    "auth": {"path": "src/features/auth", "dependencies": []},
    "profile": {"path": "src/features/profile", "dependencies": ["auth"]},
    "admin-users": {"path": "src/features/admin-users", "dependencies": ["auth"]},
    "admin-catalog": {"path": "src/features/admin-catalog", "dependencies": ["admin-media"]},
    "admin-media": {"path": "src/features/admin-media", "dependencies": []},
    "public-catalog": {"path": "src/features/public-catalog", "dependencies": []},
    "collection": {"path": "src/features/collection", "dependencies": []},
    "wishlist": {"path": "src/features/wishlist", "dependencies": []}
};
const composition = ["src/app/**/*", "src/App.tsx", "src/main.tsx"];
const shared = ["src/components/**/*", "src/hooks/**/*", "src/lib/**/*", "src/services/**/*", "src/types/**/*", "src/vite-env.d.ts", "src/test/**/*", "src/index.css"];

function createArchitectureConfig(root = projectRoot) {
    const resolver = { project: path.join(root, 'tsconfig.app.json') };
    const category = (categories) => ({ file: { categories } });
    const publicEntry = (name) => ({ file: { categories: name, path: `${domains[name].path}/index.ts` } });
    return {
        name: 'comanga/architecture',
        files: ['src/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
        ignores: ['**/*.{test,spec}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}', 'src/test/**'],
        languageOptions: { parser: tseslint.parser, sourceType: 'module', ecmaVersion: 'latest' },
        plugins: { boundaries, 'import-x': importX, '@typescript-eslint': tseslint.plugin },
        settings: {
            'boundaries/root-path': root,
            'boundaries/files': [
                ...Object.entries(domains).map(([name, domain]) => ({ category: name, pattern: `${domain.path}/**/*` })),
                { category: 'composition', pattern: composition },
                { category: 'shared', pattern: shared },
                { category: 'test', pattern: ['**/*.{test,spec}.*', 'src/test/**/*'] }
            ],
            'boundaries/additional-dependency-nodes': [
                { selector: 'TSImportType > Literal', kind: 'type', name: 'ts-import-type' }
            ],
            'import/resolver': { [require.resolve('eslint-import-resolver-typescript')]: resolver },
            'import-x/resolver-next': [createTypeScriptImportResolver(resolver)],
            'import-x/parsers': { [require.resolve('@typescript-eslint/parser')]: ['.ts', '.tsx', '.cts', '.mts'] }
        },
        rules: {
            'boundaries/no-unknown-files': 'error',
            'boundaries/no-unknown-dependencies': ['error', { require: 'file' }],
            'boundaries/no-ignored-dependencies': 'error',
            'boundaries/dependencies': ['error', {
                default: 'disallow',
                checkUnknownLocals: true,
                checkInternals: true,
                policies: [
                    { from: category('shared'), allow: { to: category('shared') } },
                    { from: category('composition'), allow: { to: [category(['composition', 'shared']), ...Object.keys(domains).map(publicEntry)] } },
                    ...Object.entries(domains).map(([name, domain]) => ({
                        from: category(name),
                        allow: { to: [category([name, 'shared']), ...domain.dependencies.map(publicEntry)] }
                    })),
                    { disallow: { to: category('test') } }
                ]
            }],
            'import-x/no-cycle': ['error', { ignoreExternal: true }],
            'import-x/no-self-import': 'error',
            'import-x/no-unresolved': 'error',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/triple-slash-reference': ['error', { path: 'never', types: 'always', lib: 'always' }],
            'no-restricted-imports': ['error', { paths: ['module', 'node:module'] }],
            'no-restricted-syntax': ['error',
                { selector: 'CallExpression[callee.object.name="module"][callee.property.name="require"]', message: 'Use import para manter o grafo de dependências verificável.' },
                { selector: 'CallExpression[callee.object.name="require"][callee.property.name="resolve"]', message: 'Use import para manter o grafo de dependências verificável.' },
                { selector: 'ImportExpression[source.type!="Literal"]', message: 'Imports dinâmicos devem usar um caminho literal.' }
            ]
        }
    };
}

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/components/ui/sonner.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
    rules: js.configs.recommended.rules,
  },
    {
        name: 'comanga/maintainability',
        files: ['**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
        rules: {
            complexity: ['error', 15],
            'max-depth': ['error', 4],
            'max-lines-per-function': ['error', { max: 150, skipBlankLines: true, skipComments: true }]
        }
    },
    {
        // Suítes agrupam cenários; o tamanho não limita seus callbacks.
        name: 'comanga/test-size',
        files: ['**/*.{test,spec}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
        rules: { 'max-lines-per-function': 'off' }
    },
    {
        // Apenas arquivos identificados como saída de geração automática.
        name: 'comanga/generated-size',
        files: ['**/*.generated.{js,jsx,ts,tsx}', 'src/generated/**/*.{js,jsx,ts,tsx}'],
        rules: { 'max-lines-per-function': 'off' }
    },
  createArchitectureConfig(),
);
