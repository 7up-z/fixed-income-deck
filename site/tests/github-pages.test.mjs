import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const client = path.join(root, "dist", "client");

test("GitHub Pages build uses the repository base path", () => {
  const index = fs.readFileSync(path.join(client, "index.html"), "utf8");
  assert.match(index, /\/fixed-income-deck\/assets\//);
});

test("all 22 slide and edit routes have static entry pages", () => {
  for (let page = 1; page <= 22; page += 1) {
    const id = String(page).padStart(2, "0");
    for (const mode of ["slides", "edit"]) {
      assert.ok(fs.existsSync(path.join(client, mode, id, "index.html")));
    }
  }
});

test("GitHub Pages build disables Jekyll processing", () => {
  assert.ok(fs.existsSync(path.join(client, ".nojekyll")));
});
