const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/services/location.ts"), "utf8");
const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = { exports: {} };
new Function("exports", "module", result.outputText)(loaded.exports, loaded);
const { detectLocation } = loaded.exports;

test("detects device coordinates and accepts zero coordinates", async () => {
  const geo = { getCurrentPosition(success) { success({ coords: { latitude: 0, longitude: 0, accuracy: 25 } }); } };
  assert.deepEqual(await detectLocation(geo, true), { latitude: 0, longitude: 0, accuracy: 25 });
});
test("requests a fresh location with a finite timeout", async () => {
  let options;
  const geo = { getCurrentPosition(success, _error, value) { options = value; success({ coords: { latitude: 6.9271, longitude: 79.8612, accuracy: 40 } }); } };
  const position = await detectLocation(geo, true);
  assert.equal(position.longitude, 79.8612);
  assert.equal(options.maximumAge, 0);
  assert.ok(options.timeout > 0 && options.timeout <= 15000);
});
test("permission denied and timeout have distinct actionable errors", async () => {
  await assert.rejects(detectLocation({ getCurrentPosition(_success, fail) { fail({ code: 1 }); } }, true), /permission was denied/);
  await assert.rejects(detectLocation({ getCurrentPosition(_success, fail) { fail({ code: 3 }); } }, true), /timed out/);
  await assert.rejects(detectLocation({ getCurrentPosition(_success, fail) { fail({ code: 2 }); } }, true), /could not be determined/);
});
test("unsupported browsers and insecure pages have manual fallback guidance", async () => {
  await assert.rejects(detectLocation(undefined, true), /does not support/);
  await assert.rejects(detectLocation(undefined, false), /localhost or a secure connection/);
});
test("invalid device coordinates are never accepted", async () => {
  for (const coords of [{ latitude: NaN, longitude: 10 }, { latitude: 91, longitude: 10 }, { latitude: 10, longitude: 181 }]) {
    await assert.rejects(detectLocation({ getCurrentPosition(success) { success({ coords }); } }, true), /could not be determined/);
  }
});
