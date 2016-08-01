export default error => ({
  error: {
    type: error.output.payload.type,
    detail: error.output.payload.message,
    status_code: error.output.statusCode,
  },
});
