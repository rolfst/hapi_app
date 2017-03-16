module.exports = (user) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const options = {
    subject: 'My cool subject',
    template: '123',
  };

  return { email: user.email, data, options };
};
