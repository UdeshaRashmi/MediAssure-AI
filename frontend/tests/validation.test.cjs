const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/validation.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = { exports: {} };
new Function("exports", "module", compiled.outputText)(loaded.exports, loaded);
const { fieldError, MAX_STOCK } = loaded.exports;

test("required fields reject whitespace while optional fields allow blanks", () => {
  assert.ok(fieldError({ name: "medicine", value: "  ", required: true }));
  assert.equal(fieldError({ name: "strength", value: "" }), undefined);
  assert.equal(fieldError({ name: "name", value: "Valid Name", required: true, minLength: 2 }), undefined);
});
test("email and international phone formats are checked", () => {
  for (const value of ["missing-at", "a@b", "a@b..com", "a @b.com"]) assert.ok(fieldError({ name: "email", value, type: "email" }));
  assert.equal(fieldError({ name: "email", value: " user@example.com ", type: "email" }), undefined);
  for (const value of ["abc1234567", "12", "+1234567890123456"]) assert.ok(fieldError({ name: "phone", value, phone: true }));
  assert.equal(fieldError({ name: "phone", value: "+94 (77) 123-4567", phone: true }), undefined);
});
test("password length and confirmation preserve exact password characters", () => {
  assert.ok(fieldError({ name: "password", value: "      ", type: "password", required: true, minLength: 6 }));
  assert.ok(fieldError({ name: "confirm_password", value: "password ", match: "password" }));
  assert.equal(fieldError({ name: "confirm_password", value: " password ", match: " password " }), undefined);
});
test("stock and quantities reject fractions, nonfinite values and database overflow", () => {
  const rules = { name: "stock", type: "number", integer: true, min: 0, max: MAX_STOCK, required: true };
  for (const value of ["", "1.5", "NaN", "Infinity", "-1", String(MAX_STOCK + 1)]) assert.ok(fieldError({ ...rules, value }));
  for (const value of ["0", String(MAX_STOCK)]) assert.equal(fieldError({ ...rules, value }), undefined);
  assert.ok(fieldError({ ...rules, name: "quantity", min: 1, value: "0" }));
});
test("coordinates accept zero and decimals, reject out-of-range values", () => {
  assert.equal(fieldError({ name: "latitude", type: "number", value: "0", min: -90, max: 90 }), undefined);
  assert.equal(fieldError({ name: "longitude", type: "number", value: "79.8612", min: -180, max: 180 }), undefined);
  assert.ok(fieldError({ name: "latitude", type: "number", value: "90.01", max: 90 }));
  assert.ok(fieldError({ name: "longitude", type: "number", value: "-181", min: -180 }));
});
