export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Tính năng mới
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Code style (formatting, etc)
        'refactor', // Code refactoring
        'test', // Tests
        'chore', // Maintenance
        'perf', // Performance
        'ci', // CI/CD
        'build', // Build system
        'revert', // Revert commit
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'camel-case']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
  },
};
