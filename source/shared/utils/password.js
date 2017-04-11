const bcrypt = require('bcryptjs');
const { sample, random } = require('lodash');

const plainRandom = () => {
  const words = [
    'appel', 'peer', 'schommel', 'standaard', 'lamp', 'envelop',
    'lepel', 'bestek', 'auto', 'vrachtwagen', 'mes', 'sjaal',
    'winter', 'tafel', 'kaars', 'laptop', 'computer', 'beker',
    'rugtas', 'gebouw', 'regen', 'hond', 'straat', 'raam',
    'telefoon', 'licht', 'flat', 'wekker', 'tijd', 'makkelijk',
  ];

  const word = sample(words);
  const number = random(1000, 9999);

  return `${word}${number}`;
};

const make = (passwordText) => {
  const hash = bcrypt.hashSync(passwordText, bcrypt.genSaltSync());

  return hash.replace('$2a$', '$2y$');
};

exports.make = make;
exports.plainRandom = plainRandom;
