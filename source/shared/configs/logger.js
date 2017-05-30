// The environment to default to when none is supplied via ENV
exports.defaultEnvironment = 'development';

// The minimum error level to be sent to stderr instead of stdout
exports.errorLogLevel = 'WARNING';

// The minimum error level to send to external services like sentry or datadog
exports.exportLogLevel = 'WARNING';

exports.defaultLogLevels = {
  acceptance: 'WARNING',
  ci: null,
  development: 'INFO',
  production: 'WARNING',
  testing: 'WARNING',
};
