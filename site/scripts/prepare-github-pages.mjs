#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist", "client");
const index = path.join(client, "index.html");

if (!existsSync(index)) throw new Error(`Missing GitHub Pages build input: ${index}`);

for (let page = 1; page <= 22; page += 1) {
  const id = String(page).padStart(2, "0");
  for (const mode of ["slides", "edit"]) {
    const directory = path.join(client, mode, id);
    mkdirSync(directory, { recursive: true });
    copyFileSync(index, path.join(directory, "index.html"));
  }
}

writeFileSync(path.join(client, ".nojekyll"), "");
console.log("Prepared GitHub Pages routes for 22 slide and edit pages.");
