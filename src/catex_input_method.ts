import {
  InputMethodConf,
  InputMethod,
  RenderableQuickPickItem,
  RenderMode,
  Expander
} from "./generic-input-method/input_method";
import {
  ExtensionContext,
  TextEditor,
  SnippetString,
  workspace,
  WorkspaceConfiguration,
  window,
  ConfigurationTarget,
  QuickPick
} from "vscode";
import { CommandType, ArgSpec, ArgKind } from "./latex_syntax";
import {
  LaTeXInputMethodItem,
  LaTeXExpander,
  LaTeXInputMethodItemConfig
} from "./latex_expander";
import {
  preview,
  CommandDefinition,
  CommandDictionary,
  cmdDicToLaTeXItemConfs,
  expandDictionary,
  appendToDictionary,
  Command
} from "./definitions";
import EscapedString from "./escaped_string";
import { parseJSON } from "./utils";

export default class CaTeXInputMethod implements InputMethodConf {
  public name: string;
  public languages: string[];
  public triggers: string[];
  public dictionary: LaTeXInputMethodItemConfig[];
  public renderMode?: RenderMode | string | Expander;
  public commandName?: string;
  public configurationName: string;
  public onDidChangeConfiguration: (
    config: CommandDictionary
  ) => LaTeXInputMethodItemConfig[];

  constructor(
    private dictName: string,
    private kind: CommandType,
    context: ExtensionContext,
    conf: InputMethodConf
  ) {
    this.name = conf.name;
    this.languages = conf.languages;
    this.triggers = conf.triggers;
    while (typeof conf.dictionary === "string") {
      conf.dictionary = parseJSON(context, conf.dictionary);
    }
    let dicSeed = <(string | LaTeXInputMethodItemConfig)[]>conf.dictionary;
    this.dictionary = expandDictionary(context, dicSeed);

    this.renderMode = LaTeXExpander;
    this.commandName = conf.commandName;
    const dictPath = `catex.${this.dictName}.dictionary`;
    this.configurationName = dictPath;
    this.onDidChangeConfiguration = val => {
      const conf: CommandDictionary = val || {
        include: `defaults/${this.dictName}s.json`
      };
      return cmdDicToLaTeXItemConfs(context, this.kind, conf);
    };
  }

  public showQuickPick = async (
    im: InputMethod,
    editor: TextEditor,
    forced: boolean = false
  ) => {
    if (forced || this.languages.some(i => i === editor.document.languageId)) {
      const selection = new EscapedString(
        editor.document.getText(editor.selection)
      );
      const picks = await im.quickPickItems();
      const quickPick: QuickPick<
        RenderableQuickPickItem | RegistererItem
      > = window.createQuickPick();
      quickPick.canSelectMany = false;
      quickPick.items = picks;
      quickPick.onDidChangeValue(value => {
        quickPick.items = picks;

        if (
          value.length > 0 &&
          !quickPick.activeItems.some(i => i.label === value)
        ) {
          const actives = quickPick.activeItems;
          const defs = [
            new RegistererItem(
              this.dictName,
              this.kind,
              value,
              ConfigurationTarget.Global
            ),
            new RegistererItem(
              this.dictName,
              this.kind,
              value,
              ConfigurationTarget.Workspace
            ),
            new RegistererItem(
              this.dictName,
              this.kind,
              value,
              ConfigurationTarget.WorkspaceFolder
            )
          ];
          quickPick.items = picks.concat(defs);
          quickPick.activeItems = actives;
        }
      });
      quickPick.onDidAccept(() => {
        const item = quickPick.selectedItems[0];
        if (isRegisterer(item)) {
          item.registerCompletion(im, editor, selection);
        } else {
          editor.insertSnippet(item.toSnippet(selection));
        }
        quickPick.hide();
        quickPick.dispose();
      });
      quickPick.show();
    }
  };
}

function isRegisterer(reg: RenderableQuickPickItem): reg is RegistererItem {
  return (<RegistererItem>reg).registerCompletion !== undefined;
}

export class RegistererItem implements RenderableQuickPickItem {
  public description: string;
  public picked: boolean = false;
  constructor(
    public dictionary: string,
    private kind: CommandType,
    public label: string,
    private confTarget: ConfigurationTarget
  ) {
    if (confTarget === ConfigurationTarget.Global) {
      this.description = `Create Global completion for "${label}"`;
    } else if (confTarget === ConfigurationTarget.Workspace) {
      this.description = `Create Workspace completion for "${label}"`;
    } else if (confTarget === ConfigurationTarget.WorkspaceFolder) {
      this.description = `Create Workspace Folder completion for "${label}"`;
    } else {
      this.description = `Create Unknown completion for "${label}"`;
    }
  }

  public toSnippet(): SnippetString {
    return new SnippetString();
  }

  public async registerCompletion(
    im: InputMethod,
    editor: TextEditor,
    selection?: EscapedString
  ) {
    const conf: WorkspaceConfiguration = workspace.getConfiguration();
    const re = /^(\{[^\{\}\[\]]*?\}|\[[^\{\}\[\]]*?\])*$/;
    const noArgs =
      this.kind === CommandType.Maketitle || this.kind === CommandType.Text;
    const specStr: String | undefined = noArgs
      ? undefined
      : await window.showInputBox({
          prompt: "Enter argument spec (start with `!` for possible body):",

          placeHolder: "{default}[!body]{}",
          validateInput: input => {
            if (re.test(input)) {
              return;
            } else {
              return "Must be a repeat of \"[(placeholder)]\" and/or \"{(placeholder)}\"";
            }
          }
        });
    if (noArgs || specStr !== undefined) {
      let args: ArgSpec[] | undefined;
      if (typeof specStr === "string") {
        if (!noArgs && (<string>specStr).length > 0) {
          args = [];
          let match: RegExpExecArray | null;
          const itemRe = /\{[^\{\}\[\]]*?\}|\[[^\{\}\[\]]*?\]/g;

          while ((match = itemRe.exec(specStr))) {
            const mbody = match[0].slice(1, match[0].length - 1);
            let placeholder: string | undefined;
            let body: boolean | undefined;
            if (mbody.length > 1) {
              if (mbody.charAt(0) === "!") {
                body = true;
                placeholder = mbody.slice(1);
              } else {
                placeholder = mbody;
              }
            }
            if (match[0].charAt(0) === "{") {
              args.push({ kind: ArgKind.Fixed, placeholder, body });
            } else {
              args.push({ kind: ArgKind.Optional, placeholder, body });
            }
          }
        } else if (this.kind === CommandType.Section) {
          args = [{ kind: ArgKind.Fixed }];
        }
      }
      let itemConf = {
        label: this.label,
        body: this.label,
        filterText: this.label,
        description: preview(this.kind, this.label),
        args: args,
        type: this.kind
      };

      const DICTIONARY_NAME = `catex.${this.dictionary}.dictionary`;
      const item = new LaTeXInputMethodItem(itemConf);
      (<LaTeXInputMethodItem[]>im.dictionary).push(item);
      await editor.insertSnippet(item.toSnippet(selection));

      const itemDef: Command =
        this.kind === CommandType.Maketitle
          ? this.label
          : { name: this.label, args };
      const curConf = conf.inspect<CommandDictionary>(DICTIONARY_NAME);
      let curDic: CommandDictionary = [
        { include: `defaults/${this.dictionary}s.json` }
      ];
      if (curConf) {
        switch (this.confTarget) {
          case ConfigurationTarget.Global:
            curDic = curConf.globalValue || curConf.defaultValue || curDic;
            break;

          case ConfigurationTarget.Workspace:
            curDic =
              curConf.workspaceValue ||
              curConf.globalValue ||
              curConf.defaultValue ||
              curDic;
            break;

          case ConfigurationTarget.WorkspaceFolder:
            curDic =
              curConf.workspaceFolderValue ||
              curConf.workspaceValue ||
              curConf.globalValue ||
              curConf.defaultValue ||
              curDic;
            break;
        }
      }
      let dic: CommandDictionary = [];
      if (curDic instanceof Array) {
        dic = curDic.concat([itemDef]);
      }
      dic = appendToDictionary(curDic, itemDef);
      await conf.update(DICTIONARY_NAME, dic, this.confTarget);

      if (curConf && curConf.workspaceFolderValue) {
        await conf.update(
          DICTIONARY_NAME,
          appendToDictionary(curConf.workspaceFolderValue, itemDef),
          ConfigurationTarget.WorkspaceFolder
        );
      } else if (curConf && curConf.workspaceValue) {
        await conf.update(
          DICTIONARY_NAME,
          appendToDictionary(curConf.workspaceValue, itemDef),
          ConfigurationTarget.Workspace
        );
      }
    }
  }
}
