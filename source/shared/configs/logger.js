// The environment to default to when none is supplied via ENV
exports.defaultEnvironment = 'development';

// The minimum error level to be sent to stderr instead of stdout
exports.errorLogLevel = 'WARNING';

exports.defaultLogLevels = {
  acceptance: 'INFO',
  ci: null,
  development: 'DEBUG',
  production: 'WARNING',
  testing: 'WARNING'
};
