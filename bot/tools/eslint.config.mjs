// The correctness lint for bot/ (round C4; spec-cleanup-2026-10-20 §6.2 and T8): 26 rules that find mistakes, none about style.
// Run from inside bot/ (CI does, .github/workflows/bot-gates.yml):
//   npx --yes eslint@10.13.0 -c tools/eslint.config.mjs --suppressions-location tools/eslint-suppressions.json .
// The files are the ones we own; the read-only release copies (elysium-server.js), the generated data wrappers and the ten
// legacy tests (README: "not gates, known stale reds"; round C2 deletes them) are left out.
// Every rule is an error. The violations the lint found on its first run (C4: 4 errors, 22 unused assignments) are suppressed in
// tools/eslint-suppressions.json, so only a NEW violation fails; round C2 fixes the old ones and prunes the file (ESLint fails on a
// suppression that no longer occurs, so the file cannot go stale).
const node = ['require', 'module', 'exports', 'process', '__dirname', '__filename', 'console', 'Buffer', 'global', 'globalThis',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'structuredClone',
  'URL', 'URLSearchParams', 'TextEncoder', 'TextDecoder', 'AbortController', 'performance', 'fetch'];
const browser = ['window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'WebSocket', 'Event', 'CustomEvent',
  'HTMLElement', 'Node', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'alert', 'confirm',
  'Blob', 'FileReader', 'XMLHttpRequest'];
const globals = Object.fromEntries([...node, ...browser].map(n => [n, 'readonly']));

export default [
  { ignores: ['elysium-server.js', 'elysium-cardfx.js', 'elysium-twd-*.js', 'test-bot-suffix.js', 'test-eligible.js', 'test-fixes.js',
    'test-grammar.js', 'test-handoff.js', 'test-persona.js', 'test-planner.js', 'test-planner2.js', 'test-planner3.js', 'test-soft.js',
    'tools/**', 'serie-*/**', 'bench-*/**'] },
  {
    files: ['ana-open.js', 'cardfx-compile.js', 'diag-*.js', 'elysium-bot.js', 'elysium-bot-arena.js', 'elysium-bot-hotseat.js',
      'elysium-bot-sim.js', 'elysium-bot-table.js', 'gen-*.js', 'krcg-v5.js', 'lab-*.js', 'test-bot-canary.js', 'test-bot-hotseat.js',
      'test-bot-logic.js', 'test-cardfx.js'],
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
