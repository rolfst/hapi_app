// const assert = require('chai').assert;
// import User from 'models/User';
//
// before(() => {
//   return User.create({
//     firstName: 'Test',
//     lastName: 'Gebruiker',
//     email: 'testgebruiker@flex-appeal.nl',
//     profileImg: 'test.jpg',
//     password: 'test',
//   });
// });
//
// describe('#findByFirstName()', () => {
//   it('respond with maching record', () => {
//     User.findOne({ firstName: 'Test' }).then(user => {
//       assert.equal(user.firstName, 'Test');
//       assert.equal(user.email, 'testgebruiker@flex-appeal.nl');
//     });
//   });
// });
//
// after(() => {
//   return User.destroy({
//     where: { email: 'testgebruiker@flex-appeal.nl' },
//   });
// });
