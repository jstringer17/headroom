// A tiny expect() on top of node:assert, so host-core tests read the same as before (node --test, no extra packages).
import assert from "node:assert/strict";

const has = (a, b) => (typeof a === "string" ? a.includes(b) : Array.isArray(a) && a.some((x) => { try { assert.deepStrictEqual(x, b); return true; } catch { return x === b; } }));
function match(actual, sub) {
  if (sub && typeof sub === "object" && !Array.isArray(sub)) {
    assert.ok(actual && typeof actual === "object", `expected an object, got ${actual}`);
    for (const k of Object.keys(sub)) match(actual[k], sub[k]);
  } else assert.deepStrictEqual(actual, sub);
}

export function expect(actual) {
  const api = {
    toBe: (v) => assert.strictEqual(actual, v),
    toEqual: (v) => assert.deepStrictEqual(actual, v),
    toContain: (v) => assert.ok(has(actual, v), `expected to contain ${JSON.stringify(v)}: ${String(actual).slice(0, 300)}`),
    toMatchObject: (v) => match(actual, v),
    toHaveLength: (n) => assert.strictEqual(actual.length, n),
    toBeUndefined: () => assert.strictEqual(actual, undefined),
    toBeTruthy: () => assert.ok(actual),
    not: {
      toBe: (v) => assert.notStrictEqual(actual, v),
      toContain: (v) => assert.ok(!has(actual, v), `expected not to contain ${JSON.stringify(v)}`),
    },
    rejects: { toThrow: async () => { await assert.rejects(actual); } },
  };
  return api;
}
