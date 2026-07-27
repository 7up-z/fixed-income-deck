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

test("slide 03 applies only the approved chart-line and summary corrections", () => {
  const slide = data.slides.find((item) => item.id === "03");
  assert.deepEqual(slide.patches, [
    {
      kind: "erase",
      y: 269,
      h: 2,
      segments: [
        { x: 123, w: 25 },
        { x: 451, w: 10 },
        { x: 808, w: 12 },
        { x: 1094, w: 18 },
      ],
    },
    {
      kind: "replace-text",
      x: 1203,
      y: 713,
      w: 384,
      h: 29,
      text: "投资活跃度显著增强。",
    },
  ]);
});
