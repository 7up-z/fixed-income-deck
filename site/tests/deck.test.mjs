import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync(new URL("../public/data/slides.json", import.meta.url)));

test("deck contains all 22 slides", () => {
  assert.equal(data.slides.length, 22);
  assert.deepEqual(
    data.slides.map((slide) => slide.id),
    Array.from({ length: 22 }, (_, index) => String(index + 1).padStart(2, "0"))
  );
});

test("every slide exposes editable text from the PPTX", () => {
  assert.equal(data.slides.every((slide) => slide.textBoxes.length > 0), true);
});

test("extracted text boxes use the fixed slide coordinate system", () => {
  for (const slide of data.slides) {
    for (const box of slide.textBoxes) {
      assert.ok(box.x >= 0 && box.y >= 0);
      assert.ok(box.x + box.w <= 1672.5);
      assert.ok(box.y + box.h <= 941.5);
    }
  }
});
