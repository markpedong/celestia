import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalError from '@/app/global-error';
import { RouteError } from '@/components/ui/route-error';

test('global error fallback is generic, provides a retry button, and omits secrets', () => {
  const output = renderToStaticMarkup(createElement(GlobalError, {
    error: Object.assign(new Error('sensitive internal connection string'), { digest: 'opaque-digest' }),
    reset: () => {},
  }));
  assert.match(output, /Something went wrong/);
  assert.match(output, /Try again/);
  assert.match(output, /Go home/);
  assert.doesNotMatch(output, /sensitive internal connection string/);
  assert.doesNotMatch(output, /opaque-digest/);
});

test('route error fallback retains shell-friendly structure and recovery', () => {
  const output = renderToStaticMarkup(createElement(RouteError, {
    error: Object.assign(new Error('internal-secret'), { digest: 'opaque' }),
    reset: () => {},
  }));
  assert.match(output, /This page could not be loaded/);
  assert.match(output, /Try again/);
  assert.match(output, /Go home/);
  assert.doesNotMatch(output, /internal-secret/);
});
