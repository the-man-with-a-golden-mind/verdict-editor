// Post-step of `npm run embed:build`: copy the runtime /lib/*.mjs bundles and
// the integration example into dist/embed so the directory is a self-contained,
// servable distributable.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const embedDir = path.join(root, "dist/embed");

if (!fs.existsSync(embedDir)) {
  console.error("dist/embed missing — run the vite embed build first.");
  process.exit(1);
}

// 1) runtime lib bundles -> dist/embed/lib
const libSrc = path.join(root, "public/lib");
const libDst = path.join(embedDir, "lib");
fs.mkdirSync(libDst, { recursive: true });
let copied = 0;
for (const f of fs.readdirSync(libSrc)) {
  if (f.endsWith(".mjs")) {
    fs.copyFileSync(path.join(libSrc, f), path.join(libDst, f));
    copied += 1;
  }
}

// 2) integration example -> dist/embed/index.html (so `serve dist/embed` is a demo)
const exampleSrc = path.join(root, "examples/embed/index.html");
if (fs.existsSync(exampleSrc)) {
  fs.copyFileSync(exampleSrc, path.join(embedDir, "index.html"));
}

console.log(`Embed ready: ${copied} lib bundles -> dist/embed/lib` + (fs.existsSync(exampleSrc) ? ", example -> dist/embed/index.html" : ""));
console.log("Contents:", fs.readdirSync(embedDir).join(", "));
