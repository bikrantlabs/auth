import { build } from "esbuild";
import { rm } from "fs/promises";
import { fileURLToPath } from "url";

const srcDir = fileURLToPath(new URL("../src", import.meta.url));

await rm("dist", { recursive: true, force: true });

await build({
  entryPoints: ["src/server.ts"],
  outdir: "dist",
  bundle: true,
  sourcemap: true,
  platform: "node",
  target: "node20.10.0",
  alias: {
    "@": srcDir,
  },
  // pino's transport worker resolves its own paths at runtime via dynamic
  // require; those paths are not valid inside a single-file bundle.
  external: ["pino", "pino-pretty", "thread-stream"],
});
