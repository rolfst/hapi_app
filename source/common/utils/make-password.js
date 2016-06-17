import bcrypt from 'bcrypt';

export default (passwordText) => {
  const hash = bcrypt.hashSync(passwordText, bcrypt.genSaltSync());

  return hash.replace('$2a$', '$2y$');
};
