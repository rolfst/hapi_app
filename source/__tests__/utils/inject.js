export default (server, user, { token, method, url }) => {
  return server.inject({
    method,
    url,
    headers: {
      'X-API-Token': token,
    },
    credentials: { user },
  });
};
