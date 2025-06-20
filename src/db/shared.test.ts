import assert from "node:assert";
import test from "node:test";
import { decodeLookupField, decodeFirst, optionalArray } from "./shared";
import { number } from "typescript-json-decoder";

test("Decode lookup field", () => {
  assert.strictEqual(decodeLookupField(["foo", "bar"]), "foo");
  assert.strictEqual(decodeLookupField([]), undefined);
  assert.strictEqual(decodeLookupField(undefined), undefined);
});

test("Decode first item", () => {
  assert.strictEqual(decodeFirst(number)([1, 2]), 1);
  assert.strictEqual(decodeFirst(number)([]), undefined);
});

test("Decode optional array", () => {
  const decode = optionalArray(number);
  assert.deepStrictEqual(decode(undefined), []);
  assert.deepStrictEqual(decode([]), []);
  assert.deepStrictEqual(decode([1]), [1]);
});
