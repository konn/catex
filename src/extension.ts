"use strict";

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WorkspaceConfiguration, workspace, extensions } from "vscode";
import {
  CommandDictionary,
  cmdDicToLaTeXItemConfs,
  LargeDictionary
} from "./definitions";
import {
  CommandType,
  InputMethodConf
} from "./generic-input-method/input_method";
import GenericInputMethodAPI from "./generic-input-method/api";

export class CaTeXException implements Error {
  constructor(public name: string, public message: string) {}

  /**
   * toString
   */
  public toString() {
    return `CaTeX: ${this.name}: ${this.message}`;
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const gim = extensions.getExtension("mr-konn.generic-input-method");
  if (!gim) {
    throw new CaTeXException(
      "Initialisation Error",
      "Generic Input Method not found"
    );
  }
  const api: GenericInputMethodAPI = await gim.activate();
  const conf: WorkspaceConfiguration = workspace.getConfiguration();
  function register_completer(dict: string, type: CommandType, name: string) {
    const items: CommandDictionary = conf.get(`catex.dictionary.${dict}`, {
      include: `defaults/${dict}s.json`
    });
    const dic = cmdDicToLaTeXItemConfs(context, type, items);
    const IM: InputMethodConf = {
      name: `CaTeX ${name} Completer`,
      commandName: `catex.${dict}`,
      languages: ["latex"],
      triggers: [],
      dictionary: dic,
      renderMode: "latex"
    };
    api.registerInputMethod(IM);
  }
  register_completer("section", CommandType.Section, "Section");
  register_completer("environment", CommandType.Environment, "Environment");
  register_completer("Maketitle", CommandType.Maketitle, "Maketitle");

  const items: LargeDictionary = conf.get(`catex.dictionary.large`, {
    include: "defaults/larges.json"
  });
  const dic = cmdDicToLaTeXItemConfs(context, CommandType.Large, items);
  const IM: InputMethodConf = {
    name: `CaTeX Large Completer`,
    commandName: `catex.large`,
    languages: ["latex"],
    triggers: [],
    dictionary: dic,
    renderMode: "latex"
  };
  api.registerInputMethod(IM);
}

// this method is called when your extension is deactivated
export function deactivate() {}
