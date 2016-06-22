import bcrypt from 'bcrypt';

export default (hash, plain) => {
  // We have to replace the first characters because of the
  // difference between the PHP bcrypt hasher and JavaScript's
  return bcrypt.compareSync(plain, hash.replace('$2y$', '$2a$'));
};
