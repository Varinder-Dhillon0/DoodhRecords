import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TYPESCRIPT_CANDIDATES = [".ts", "/index.ts"];

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    const code = error?.code;
    const parentURL = context?.parentURL;
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");

    if (!isRelative || !parentURL?.startsWith("file:") || code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }

    const parentPath = fileURLToPath(parentURL);
    const basePath = resolvePath(dirname(parentPath), specifier);

    for (const suffix of TYPESCRIPT_CANDIDATES) {
      const candidate = suffix.startsWith(".") ? `${basePath}${suffix}` : `${basePath}${suffix}`;
      if (existsSync(candidate)) {
        return {
          url: pathToFileURL(candidate).href,
          shortCircuit: true,
        };
      }
    }

    throw error;
  }
}
