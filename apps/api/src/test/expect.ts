// Bộ so khớp nhỏ kiểu expect() trên node:assert, để spec đọc giống bên web mà vẫn chạy bằng `node --test`.
import assert from "node:assert/strict";

export { describe, it, before, after } from "node:test";

function isSubset(actual: unknown, expected: unknown): boolean {
  if (expected === null || typeof expected !== "object") return Object.is(actual, expected);
  if (actual === null || typeof actual !== "object") return false;
  return Object.entries(expected).every(([k, v]) => isSubset((actual as Record<string, unknown>)[k], v));
}

export function expect<T>(actual: T, message?: string) {
  const m = message;
  return {
    toBe: (v: T) => assert.equal(actual, v, m),
    toEqual: (v: unknown) => assert.deepEqual(actual, v, m),
    toMatchObject: (v: object) => assert.ok(isSubset(actual, v), m ?? `${JSON.stringify(actual)} không chứa ${JSON.stringify(v)}`),
    toHaveLength: (n: number) => assert.equal((actual as { length: number }).length, n, m),
    toBeGreaterThan: (n: number) => assert.ok((actual as number) > n, m ?? `${String(actual)} > ${n}`),
    toBeLessThanOrEqual: (n: number) => assert.ok((actual as number) <= n, m ?? `${String(actual)} <= ${n}`),
    toBeNull: () => assert.equal(actual, null, m),
    toBeUndefined: () => assert.equal(actual, undefined, m),
    toMatch: (re: RegExp) => assert.match(String(actual), re, m),
    toContain: (v: unknown) => assert.ok((actual as unknown[] | string).includes(v as never), m),
    not: {
      toContain: (v: unknown) => assert.ok(!(actual as unknown[] | string).includes(v as never), m),
      toBe: (v: T) => assert.notEqual(actual, v, m),
    },
  };
}
