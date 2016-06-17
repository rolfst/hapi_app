import jwt from 'jwt-simple';

export const makeDefaultOptions = (globalProps) => {
  const decodedToken = jwt.decode(globalProps.authToken, process.env.JWT_SECRET);

  return {
    headers: { 'X-API-Token': globalProps.authToken },
    credentials: globalProps.authUser,
    artifacts: { integrations: decodedToken.integrations },
  };
};

export function deleteRequest(url, server = global.server) {
  return server.inject(Object.assign({
    method: 'DELETE',
    url,
  }, makeDefaultOptions(global)));
}

export function postRequest(url, payload, server = global.server) {
  return server.inject(Object.assign({
    method: 'POST',
    url,
    payload,
  }, makeDefaultOptions(global)));
}

export function putRequest(url, payload, server = global.server) {
  return server.inject(Object.assign({
    method: 'PUT',
    url,
    payload,
  }, makeDefaultOptions(global)));
}

export function getRequest(url, server = global.server) {
  return server.inject(Object.assign({
    method: 'GET',
    url,
  }, makeDefaultOptions(global)));
}

export function patchRequest(url, payload, server = global.server) {
  return server.inject(Object.assign({
    method: 'PATCH',
    url,
    payload,
  }, makeDefaultOptions(global)));
}
