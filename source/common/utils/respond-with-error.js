export default error => {
  return {
    error: {
      title: error.output.payload.title,
      detail: error.output.payload.message,
      status_code: error.output.statusCode,
    },
  };
};
