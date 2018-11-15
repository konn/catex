"use strict";

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  WorkspaceConfiguration,
  workspace,
  extensions,
  commands,
  window,
  ExtensionContext
} from "vscode";
import {
  CommandDictionary,
  cmdDicToLaTeXItemConfs,
  LargeDictionary,
  largeDicToLaTeXItemConfs
} from "./definitions";
import { InputMethodConf } from "./generic-input-method/input_method";
import GenericInputMethodAPI from "./generic-input-method/api";
import { CommandType } from "./latex_syntax";
import CaTeXInputMethod from "./catex_input_method";

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
export function activate(context: ExtensionContext) {
  const editor = window.activeTextEditor;
  if (editor) {
    commands.executeCommand("extension.catex.test.qphook", editor);
  }
  const gim = extensions.getExtension("mr-konn.generic-input-method");
  if (!gim) {
    throw new CaTeXException(
      "Initialisation Error",
      "Generic Input Method not found"
    );
  }

  gim.activate().then((api: GenericInputMethodAPI) => {
    const conf: WorkspaceConfiguration = workspace.getConfiguration();
    function register_completer(dict: string, type: CommandType) {
      let name = `${dict.charAt(0).toUpperCase}${dict.slice(1)}`;
      const items: CommandDictionary = conf.get(`catex.dictionary.${dict}`, {
        include: `defaults/${dict}s.json`
      });
      const dic = cmdDicToLaTeXItemConfs(context, type, items);
      const imConf: InputMethodConf = {
        name: `CaTeX ${name} Completer`,
        commandName: `catex.${dict}`,
        languages: ["latex"],
        triggers: [],
        dictionary: dic,
        renderMode: "latex"
      };
      const IM = new CaTeXInputMethod(dict, type, context, imConf);
      api.registerInputMethod(IM);
    }
    register_completer("section", CommandType.Section);
    register_completer("environment", CommandType.Environment);
    register_completer("maketitle", CommandType.Maketitle);

    const items: LargeDictionary = conf.get(`catex.dictionary.large`, {
      include: "defaults/larges.json"
    });
    const dic = largeDicToLaTeXItemConfs(context, items);
    const IM: InputMethodConf = {
      name: `CaTeX Large Completer`,
      commandName: `catex.large`,
      languages: ["latex"],
      triggers: [],
      dictionary: dic,
      renderMode: "latex"
    };
    api.registerInputMethod(IM);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
