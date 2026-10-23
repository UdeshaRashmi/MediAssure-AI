const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/mapGeometry.ts"), "utf8");
const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = { exports: {} };
new Function("exports", "module", result.outputText)(loaded.exports, loaded);
const { projectLocation, isInMap, polygonPath } = loaded.exports;
const outline = require("../src/data/sri-lanka.json");

test("projects the actual Sri Lanka outline to finite SVG coordinates", () => {
  const value = polygonPath(outline.geometry.coordinates);
  assert.ok(value.startsWith("M"));
  assert.ok(value.endsWith("Z"));
  assert.ok(!value.includes("NaN") && !value.includes("Infinity"));
});
test("northern points are above southern points and eastern points are right", () => {
  assert.ok(projectLocation(80, 9)[1] < projectLocation(80, 6)[1]);
  assert.ok(projectLocation(81, 7)[0] > projectLocation(80, 7)[0]);
  const [x, y] = projectLocation(79.8612, 6.9271);
  assert.ok(x > 0 && x < 540 && y > 0 && y < 720);
});
test("does not place missing, invalid or out-of-area locations on the Sri Lanka map", () => {
  for (const coords of [[null, 80], [7, null], [NaN, 80], [0, 0], [51.5, -.1]]) assert.equal(isInMap(...coords), false);
  assert.equal(isInMap(6.9271, 79.8612), true);
});
