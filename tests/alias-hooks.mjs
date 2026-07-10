// Node test runner için "@/..." alias'ını src/ altına çözer.
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const SRC = pathToFileURL(resolvePath(process.cwd(), "src") + "/").href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let rest = specifier.slice(2);
    // uzantısız içe aktarmalara .ts ekle
    const lastSeg = rest.split("/").pop() ?? "";
    if (!lastSeg.includes(".")) rest += ".ts";
    return nextResolve(SRC + rest, context);
  }
  return nextResolve(specifier, context);
}
