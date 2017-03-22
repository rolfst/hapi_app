const makeOptions = (token) => {
  return { headers: { 'X-API-Token': token } };
};

function deleteRequest(url, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'DELETE',
    url,
  }, makeOptions(token)));
}

function postRequest(url, payload, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'POST',
    url,
    payload,
  }, makeOptions(token)));
}

function putRequest(url, payload, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'PUT',
    url,
    payload,
  }, makeOptions(token)));
}

function getRequest(url, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'GET',
    url,
  }, makeOptions(token)));
}

function patchRequest(url, payload, token, server = global.server) {
  return server.inject(Object.assign({
    method: 'PATCH',
    url,
    payload,
  }, makeOptions(token)));
}

exports.deleteRequest = deleteRequest;
exports.getRequest = getRequest;
exports.makeOptions = makeOptions;
exports.patchRequest = patchRequest;
exports.postRequest = postRequest;
exports.putRequest = putRequest;
