import { expect, test } from 'vitest';
import config from '../../playwright.config';

test('the Rust-backed browser harness allows a cold dependency build', () => {
  const server = config.webServer;
  expect(Array.isArray(server)).toBe(false);
  if (Array.isArray(server) || !server) throw new Error('expected one browser test server');

  expect(server.command).toContain('cargo run --locked');
  expect(server.timeout).toBeGreaterThanOrEqual(300_000);
});
