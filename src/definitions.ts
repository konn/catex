"use strict";
import { ArgSpec, ArgKind, CommandType, LaTeXScope } from "./latex_syntax";
import { ExtensionContext } from "vscode";
import { LaTeXInputMethodItemConfig } from "./latex_expander";
import { parseJSON, uniquifyRightBiased } from "./utils";
import { isString } from "util";

export interface IncludeDirective {
  include: string;
}

export type ArgDef = ArgSpec | ArgKind;

export interface CommandDefinition {
  name: string;
  args?: ArgDef[];
  contentPrefix?: string;
  scope?: LaTeXScope;
}

export type Command = string | CommandDefinition;

export type CommandDictionary =
  | IncludeDirective
  | (IncludeDirective | Command)[];

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
        args: cmd.args ? cmd.args.map(defToSpec) : undefined,
        contentPrefix: cmd.contentPrefix,
        scope: cmd.scope
      };
    }
  }
}

export function expandDictionary(
  context: ExtensionContext,
  dicSeed: (string | LaTeXInputMethodItemConfig)[]
): LaTeXInputMethodItemConfig[] {
  return uniquifyRightBiased<LaTeXInputMethodItemConfig, string>(
    dicSeed,
    isString,
    i => i.label,
    s => parseJSON(context, s)
  );
}

export function cmdDicToLaTeXItemConfs(
  context: ExtensionContext,
  cmdType: CommandType,
  is: CommandDictionary
): LaTeXInputMethodItemConfig[] {
  while (isIncludeDirective(is)) {
    is = parseJSON(context, is.include);
  }
  const items: LaTeXInputMethodItemConfig[] = uniquifyRightBiased<
    CommandDefinition | string,
    IncludeDirective
  >(
    is,
    isIncludeDirective,
    i => (isString(i) ? i : i.name),
    s => parseJSON(context, s.include)
  ).map(i => cmdToLaTeXConf(cmdType, i));
  return items;
}
