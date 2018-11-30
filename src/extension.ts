"use strict";

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  WorkspaceConfiguration,
  workspace,
  extensions,
  ExtensionContext
} from "vscode";
import { CommandDictionary, cmdDicToLaTeXItemConfs } from "./definitions";
import {
  InputMethodConf,
  InputMethodItemConfig
} from "./generic-input-method/input_method";
import GenericInputMethodAPI from "./generic-input-method/api";
import { CommandType } from "./latex_syntax";
import CaTeXInputMethod from "./catex_input_method";
import { LaTeXExpander } from "./latex_expander";
import { parseJSON, uniquifyRightBiased, isString } from "./utils";

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
export async function activate(context: ExtensionContext) {
  const gim = extensions.getExtension("mr-konn.generic-input-method");
  if (!gim) {
    throw new CaTeXException(
      "Initialisation Error",
      "Generic Input Method not found"
    );
  }

  const api: GenericInputMethodAPI = await gim.activate();
  const conf: WorkspaceConfiguration = workspace.getConfiguration("catex");
  api.registerExpander("latex", LaTeXExpander);
  function register_input_method(dict: string, prefix: string) {
    const DICT_NAME = `${dict}-completion`;
    let dic: InputMethodConf = conf.get(`${DICT_NAME}`, {
      languages: ["latex"],
      name: `CaTeX ${dict.charAt(0).toUpperCase()}${dict.slice(1)} Completion`,
      commandName: `catex.${dict}`,
      triggers: [prefix],
      dictionary: `defaults/${dict}s.json`,
      renderMode: LaTeXExpander
    });

    dic.configurationName = `catex.${dict}-completion`;
    dic.onDidChangeConfiguration = (
      config: InputMethodConf
    ): InputMethodItemConfig[] => {
      console.log("Change, change, changed!");
      let dic: string | (string | InputMethodItemConfig)[] = config.dictionary;
      while (typeof dic === "string") {
        dic = parseJSON(context, dic);
      }
      return uniquifyRightBiased<InputMethodItemConfig, string>(
        dic,
        isString,
        s => s.label,
        (path: string) => parseJSON(context, path)
      );
    };

    if (typeof dic.dictionary === "string") {
      dic.dictionary = context.asAbsolutePath(dic.dictionary);
    } else {
      dic.dictionary = dic.dictionary.map(i => {
        if (typeof i === "string") {
          return context.asAbsolutePath(i);
        } else {
          return i;
        }
      });
    }
    api.registerInputMethod(dic);
  }
  register_input_method("greek", ":");
  register_input_method("image", ";");
  register_input_method("font", "@");

  function register_completer(dict: string, type: CommandType) {
    let name = `${dict.charAt(0).toUpperCase()}${dict.slice(1)}`;
    const dictName = `${dict}.dictionary`;
    const items: CommandDictionary = conf.get(dictName, {
      include: `defaults/${dict}s.json`
    });

    const dic = cmdDicToLaTeXItemConfs(context, type, items);
    const imConf: InputMethodConf = {
      name: `CaTeX ${name} Completer`,
      commandName: `catex.${dict}`,
      languages: ["latex"],
      triggers: [],
      dictionary: dic,
      renderMode: LaTeXExpander
    };
    const IM = new CaTeXInputMethod(dict, type, context, imConf);
    api.registerInputMethod(IM);
  }
  register_completer("section", CommandType.Section);
  register_completer("environment", CommandType.Environment);
  register_completer("maketitle", CommandType.Maketitle);
  register_completer("large", CommandType.Large);
}

// this method is called when your extension is deactivated
export function deactivate() {}
