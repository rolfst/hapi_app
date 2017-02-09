export const makeOptions = (token) => {
  return { headers: { 'X-API-Token': token } };
};

export function deleteRequest(url, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'DELETE',
    url,
  }, makeOptions(token)));
}

export function postRequest(url, payload, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'POST',
    url,
    payload,
  }, makeOptions(token)));
}

export function putRequest(url, payload, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'PUT',
    url,
    payload,
  }, makeOptions(token)));
}

export function getRequest(url, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'GET',
    url,
  }, makeOptions(token)));
}

export function patchRequest(url, payload, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'PATCH',
    url,
    payload,
  }, makeOptions(token)));
}
