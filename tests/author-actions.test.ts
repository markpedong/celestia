import assert from 'node:assert/strict';
import test from 'node:test';
import { authorActionState } from '@/lib/author-action-state';

test('author actions wait for authentication to resolve', () => {
  assert.equal(authorActionState(undefined, 'author'), 'loading');
});

test('guests receive sign-in actions and authors cannot follow themselves', () => {
  assert.equal(authorActionState(null, 'author'), 'guest');
  assert.equal(authorActionState('author', 'author'), 'self');
});

test('signed-in visitors can follow and start an existing direct conversation', () => {
  assert.equal(authorActionState('visitor', 'author'), 'ready');
});
