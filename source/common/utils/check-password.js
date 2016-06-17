import bcrypt from 'bcrypt';

export default (hash, plain) => {
  // We have to replace the first characters because of the
  // difference between the PHP bcrypt hasher and JavaScript's
  const result = bcrypt.compareSync(plain, hash.replace('$2y$', '$2a$'));

  return result;
};
