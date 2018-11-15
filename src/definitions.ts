"use strict";
import { ArgSpec, ArgKind, CommandType } from "./latex_syntax";
import { ExtensionContext } from "vscode";
import { readFileSync } from "fs";
import { LaTeXInputMethodItemConfig } from "./latex_expander";

export interface IncludeDirective {
  include: string;
}

export type ArgDef = ArgSpec | ArgKind;

export interface CommandDefinition {
  name: string;
  args?: ArgDef[];
}

export type Command = string | CommandDefinition;

export type CommandDictionary =
  | IncludeDirective
  | (IncludeDirective | Command)[];
export type LargeDictionary = IncludeDirective | (IncludeDirective | string)[];

function isIncludeDirective<T>(i: IncludeDirective | T): i is IncludeDirective {
  return (<IncludeDirective>i).include !== undefined;
}

function defToSpec(def: ArgDef): ArgSpec {
  if (typeof def === "string") {
    return {
      kind: def
    };
  } else {
    return def;
  }
}

export function preview(type: CommandType, cmd: string): string {
  switch (type) {
    case CommandType.Environment:
      return `\\begin{${cmd}}...\\end{${cmd}}`;
    case CommandType.Large:
      return `{\\${cmd}} ...}`;
    case CommandType.Maketitle:
      return `\\${cmd}`;
    case CommandType.Section:
      return `\\${cmd}{...}`;
    default:
      return cmd;
  }
}

export function cmdToLaTeXConf(
  cmdType: CommandType,
  cmd: Command
): LaTeXInputMethodItemConfig {
  {
    if (typeof cmd === "string") {
      return {
        label: cmd,
        body: cmd,
        filterText: cmd,
        description: preview(cmdType, cmd),
        type: cmdType
      };
    } else {
      return {
        label: cmd.name,
        body: cmd.name,
        type: cmdType,
        description: preview(cmdType, cmd.name),
        filterText: cmd.name,
        args: cmd.args ? cmd.args.map(defToSpec) : undefined
      };
    }
  }
}

export function cmdDicToLaTeXItemConfs(
  context: ExtensionContext,
  cmdType: CommandType,
  is: CommandDictionary
): LaTeXInputMethodItemConfig[] {
  const items: LaTeXInputMethodItemConfig[] = new Array();
  if (isIncludeDirective(is)) {
    const ls: Command[] = parseDefault(context, is.include);
    ls.forEach(cmd => items.push(cmdToLaTeXConf(cmdType, cmd)));
  } else {
    is.forEach(i => {
      if (isIncludeDirective(i)) {
        const is: Command[] = parseDefault(context, i.include);
        is.forEach(cmd => items.push(cmdToLaTeXConf(cmdType, cmd)));
      } else {
        items.push(cmdToLaTeXConf(cmdType, i));
      }
    });
  }
  return items;
}

function toLarge(large: string): LaTeXInputMethodItemConfig {
  return {
    type: CommandType.Large,
    label: large,
    filterText: large,
    body: large,
    description: `{\\${large} ...}`
  };
}

function parseDefault<T>(context: ExtensionContext, path: string): T {
  return JSON.parse(readFileSync(context.asAbsolutePath(path)).toString());
}

export function largeDicToLaTeXItemConfs(
  context: ExtensionContext,
  is: LargeDictionary
): LaTeXInputMethodItemConfig[] {
  const items: LaTeXInputMethodItemConfig[] = new Array();
  if (isIncludeDirective(is)) {
    const os: string[] = parseDefault(context, is.include);
    os.forEach(cmd => {
      items.push(toLarge(cmd));
    });
  } else {
    is.forEach(i => {
      if (isIncludeDirective(i)) {
        const is: string[] = parseDefault(context, i.include);
        is.forEach(cmd => {
          items.push(toLarge(cmd));
        });
      } else {
        items.push(toLarge(i));
      }
    });
  }
  return items;
}
