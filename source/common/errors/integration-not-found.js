class IntegrationNotFound extends Error {
  constructor(network) {
    const message = `No adapter found for network ${network.name}`;

    super(message);
    this.name = 'IntegrationNotFound';
    this.message = message;
    this.stack = (new Error()).stack;
  }
}

export default IntegrationNotFound;
