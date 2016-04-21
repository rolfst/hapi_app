import jwt from 'jwt-simple';

const secret = 'Oj4zlysjM74s9Bq9XzPzBwGwik2YyUaB';

export default {
  decodeToken: token => {
    return jwt.decode(token, secret);
  },
};
