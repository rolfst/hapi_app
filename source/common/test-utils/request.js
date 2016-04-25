const makeDefaultOptions = (globalProps) => {
  return {
    headers:      { 'X-API-Token': globalProps.authToken },
    credentials:  { user: globalProps.authUser },
  };
};

export function deleteRequest(url) {
  return global.server.inject(Object.assign({
    method: 'DELETE',
    url,
  }, makeDefaultOptions(global)));
};

export function postRequest(url, payload) {
  return global.server.inject(Object.assign({
    method: 'POST',
    url,
    payload,
  }, makeDefaultOptions(global)));
};

export function putRequest(url, payload) {
  return global.server.inject(Object.assign({
    method: 'PUT',
    url,
    payload,
  }, makeDefaultOptions(global)));
};

export function getRequest(url) {
  return global.server.inject(Object.assign({
    method: 'GET',
    url,
  }, makeDefaultOptions(global)));
};
