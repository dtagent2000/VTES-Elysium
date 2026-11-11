// The correctness lint for bot/ (round C4; spec-cleanup-2026-10-20 §5.2 and T8): 26 rules that find mistakes, none about style.
// Run from inside bot/ (CI does, .github/workflows/bot-gates.yml):
//   npx --yes eslint@10.13.0 -c tools/eslint.config.mjs --suppressions-location tools/eslint-suppressions.json .
// Every script in bot/ is linted (a new file is covered by itself) except main's files (the release copy elysium-server.js and
// main's canary test-bot-canary.js: we cannot fix them in bot/, THE RULE) and the generated data wrappers -- the 25 files we own today.
// Every rule is an error, and nothing is suppressed: the lint's first run (C4) found 4 errors and 22 unused assignments, round C2
// (bot v0.6.218) fixed them and pruned tools/eslint-suppressions.json to {}. The file stays because the command above names it and
// CI checks that it only shrinks -- so a pull request that adds a suppression fails; never run --suppress-all / --suppress-rule.
const node = ['require', 'module', 'exports', 'process', '__dirname', '__filename', 'console', 'Buffer', 'global', 'globalThis',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'structuredClone',
  'URL', 'URLSearchParams', 'TextEncoder', 'TextDecoder', 'AbortController', 'performance', 'fetch'];
const browser = ['window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'WebSocket', 'Event', 'CustomEvent',
  'HTMLElement', 'Node', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'alert', 'confirm',
  'Blob', 'FileReader', 'XMLHttpRequest'];
const globals = Object.fromEntries([...node, ...browser].map(n => [n, 'readonly']));

export default [
  { ignores: ['elysium-server.js', 'test-bot-canary.js', 'elysium-cardfx.js', 'elysium-twd-*.js', 'tools/**', 'serie-*/**', 'bench-*/**'] },
  {
    files: ['*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      'no-undef': 'error', 'no-dupe-keys': 'error', 'no-dupe-class-members': 'error', 'no-dupe-else-if': 'error',
      'no-duplicate-case': 'error', 'no-unreachable': 'error', 'no-self-assign': 'error', 'no-self-compare': 'error',
      'no-const-assign': 'error', 'no-func-assign': 'error', 'no-redeclare': 'error', 'use-isnan': 'error', 'valid-typeof': 'error',
      'no-unsafe-negation': 'error', 'no-cond-assign': ['error', 'except-parens'], 'no-sparse-arrays': 'error',
      'no-unsafe-finally': 'error', 'getter-return': 'error', 'no-setter-return': 'error', 'no-loss-of-precision': 'error',
      'no-constant-binary-expression': 'error', 'no-unused-private-class-members': 'error', 'no-shadow-restricted-names': 'error',
      'no-obj-calls': 'error', 'no-fallthrough': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
];
