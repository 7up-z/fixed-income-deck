import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("slide 03 corrections are baked into the blueprint without DOM patches", () => {
  const slide = data.slides.find((item) => item.id === "03");
  assert.equal(slide.patches, undefined);

  const image = fs.readFileSync(
    new URL("../public/blueprints-web/slide-03.jpg", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(image).digest("hex"),
    "db81fe839d22e7e1df9fa0cbf0b7849993838d3c64fd8faa1025709613b3e156",
  );
});

test("slide 04 corrections are baked into the blueprint without DOM patches", () => {
  const slide = data.slides.find((item) => item.id === "04");
  assert.equal(slide.patches, undefined);

  const image = fs.readFileSync(
    new URL("../public/blueprints-web/slide-04.jpg", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(image).digest("hex"),
    "eb1d8f4679d9e7bd83c69673f1cb73d962f8c45549d523e350ddfac9e89b40a1",
  );
});
