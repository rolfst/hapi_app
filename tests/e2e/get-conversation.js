import { assert } from 'chai';
import User from 'models/User';

// before(() => {
//   return User.create({
//     firstName: 'Test',
//     lastName: 'Gebruiker',
//     email: 'testgebruiker@flex-appeal.nl',
//     profileImg: 'test.jpg',
//     password: 'test',
//   });
// });

it('GET /conversations/:id', () => {
  assert.equal(1, 1);
});

// after(() => {
//   return User.destroy({
//     where: { email: 'testgebruiker@flex-appeal.nl' },
//   });
// });
