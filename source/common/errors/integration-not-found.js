class IntegrationNotFound extends Error {
  constructor(integrationName) {
    const message = `No adapter found for integration ${integrationName}`;

    super(message);
    this.name = 'IntegrationNotFound';
    this.message = message;
    this.stack = (new Error()).stack;
  }
}

export default IntegrationNotFound;
