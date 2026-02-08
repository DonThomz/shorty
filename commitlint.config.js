export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci'],
    ],
    'header-max-length': [2, 'always', 300],
    'subject-full-stop': [0],
  },
};
