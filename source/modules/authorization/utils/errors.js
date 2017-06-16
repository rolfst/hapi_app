const { ERoutePermissions, EPrefetchData, EPermissions } = require('../definitions');

class AuthenticationError extends Error {
  constructor(message, context) {
    let exceptionMessage;
    let errorCode;

    switch (message) {
      case ERoutePermissions.ORGANISATION_ADMIN:
        exceptionMessage = 'Not an organisation admin';
        errorCode = '10020';
        break;
      case ERoutePermissions.ORGANISATION_USER:
        exceptionMessage = 'Not an organisation member';
        errorCode = '10021';
        break;
      case ERoutePermissions.NETWORK_ADMIN:
        exceptionMessage = 'Not a network admin';
        errorCode = '10015';
        break;
      case ERoutePermissions.NETWORK_USER:
        exceptionMessage = 'Not a network member';
        errorCode = '10002';
        break;
      case ERoutePermissions.TEAM_MEMBER:
        exceptionMessage = 'Not a team member';
        errorCode = '10010';
        break;
      case EPrefetchData.ORGANISATION:
        exceptionMessage = 'Organisation does not exist';
        errorCode = '404';
        break;
      case EPrefetchData.NETWORK:
        exceptionMessage = 'Network does not exist';
        errorCode = '404';
        break;
      case EPrefetchData.TEAM:
        exceptionMessage = 'Team does not exist';
        errorCode = '404';
        break;
      default:
        exceptionMessage = message;
        errorCode = null;
    }

    super(exceptionMessage);
    this.context = context;
    this.errorCode = errorCode;
  }
}

class PermissionError extends Error {
  constructor(message, context) {
    let exceptionMessage;
    let errorCode;

    switch (message) {
      case EPermissions.CREATE:
      case EPermissions.READ:
      case EPermissions.UPDATE:
      case EPermissions.DELETE:
        exceptionMessage = `No ${message} rights on ${context.resource}`;
        errorCode = '401';
        break;
      default:
        exceptionMessage = message;
        errorCode = null;
    }

    super(exceptionMessage);
    this.context = context;
    this.errorCode = errorCode;
  }
}

exports.AuthenticationError = AuthenticationError;
exports.PermissionError = PermissionError;
