import { ExtensionContext } from "vscode";
import { readFileSync } from "fs";
import { isAbsolute } from "path";

export function parseJSON<T>(context: ExtensionContext, path: string): T {
  if (!isAbsolute(path)) {
    path = context.asAbsolutePath(path);
  }
  return JSON.parse(readFileSync(path).toString());
}

export function uniquifyRightBiased<T, S>(
  elms: (T | S)[],
  isAlias: (i: S | (T | S)[] | T) => i is S,
  getKey: (obj: T) => any = (i: T) => i,
  unfold: (key: S) => S | (T | S)[]
): T[] {
  const els = elms.concat();
  const visit: Set<any> = new Set();
  const result: T[] = [];

  while (els.length > 0) {
    let i: T | S | undefined = els.pop();
    if (i) {
      if (isAlias(i)) {
        const unfolded = unfold(i);
        if (isAlias(unfolded)) {
          els.push(unfolded);
        } else {
          els.push(...unfolded);
        }
      } else {
        const key = getKey(i);
        if (!visit.has(key)) {
          result.unshift(i);
          visit.add(key);
        }
      }
    }
  }
  return result;
}

export function isString<T>(i: T | string): i is string {
  return typeof i === "string";
}
