// Resolves the "@/..." TS path alias to ./src for `node --test` (no bundler).
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
const src = path.resolve(import.meta.dirname, "../src");
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = path.join(src, specifier.slice(2));
    const file = [".ts", ".tsx", "/index.ts"].map((e) => base + e).find(existsSync) ?? base;
    return next(pathToFileURL(file).href, context);
  }
  return next(specifier, context);
}
