import { ExtensionContext, extensions } from "vscode";
import { readFileSync } from "fs";
import { isAbsolute } from "path";
import * as path_util from "path";

export function parseJSON<T>(context: ExtensionContext, path: string): T {
  path = canonicalisePath(context, path);
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

export function canonicalisePath(
  context: ExtensionContext,
  fp: string
): string {
  if (!isAbsolute(fp)) {
    let matches: null | RegExpMatchArray;
    if ((matches = fp.match(/^\$GIM\/(.+)$/))) {
      const gim = extensions.getExtension("mr-konn.generic-input-method");
      if (gim) {
        return path_util.join(gim.extensionPath, matches[1]);
      } else {
        throw new CanonicalisePathException(
          "Generic Input Method not found",
          "The extension `generic-input-method` not found."
        );
      }
    } else {
      return context.asAbsolutePath(fp);
    }
  } else {
    return fp;
  }
}

export class CanonicalisePathException implements Error {
  constructor(public name: string, public message: string) {}

  /**
   * toString
   */
  public toString() {
    return `CaTeX: ${this.name}: ${this.message}`;
  }
}
