const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/roleAccess.tsx"), "utf8");
const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
const loaded = { exports: {} };
new Function("exports", "module", "require", result.outputText)(loaded.exports, loaded, require);
const { canAccessPage, getNavGroupsForRole } = loaded.exports;

test("both medicine supplier roles have stock management navigation", () => {
  for (const role of ["Pharmacist", "Hospital Staff"]) {
    assert.equal(canAccessPage(role, "inventory"), true);
    assert.ok(getNavGroupsForRole(role).flatMap(group => group.items).some(item => item.id === "inventory"));
  }
});
test("patients cannot access stock management", () => {
  assert.equal(canAccessPage("Patient", "inventory"), false);
  assert.equal(getNavGroupsForRole("Patient").flatMap(group => group.items).some(item => item.id === "inventory"), false);
});
