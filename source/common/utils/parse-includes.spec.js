import { assert } from 'chai';
import parseIncludes from 'common/utils/parse-includes';

it('parse includes from query object', () => {
  assert.deepEqual(
    parseIncludes({ include: 'users,comments' }),
    ['users', 'comments']
  );

  assert.deepEqual(
    parseIncludes({ include: 'users' }),
    ['users']
  );

  assert.deepEqual(
    parseIncludes({}),
    []
  );

  assert.deepEqual(
    parseIncludes({ include: 'users,comments.user' }),
    ['users', 'comments.user']
  );
});
