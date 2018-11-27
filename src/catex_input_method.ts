import {
  InputMethodConf,
  InputMethod,
  RenderableQuickPickItem,
  InputMethodItemConfig,
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
import { preview, CommandDefinition, CommandDictionary } from "./definitions";
import EscapedString from "./escaped_string";
import * as Path from "path";
import { readFileSync } from "fs";

type LaTeXConf = string | (string | LaTeXInputMethodItemConfig)[];

export default class CaTeXInputMethod implements InputMethodConf {
  public name: string;
  public languages: string[];
  public triggers: string[];
  public dictionary: (InputMethodItemConfig | string)[] | string;
  public renderMode?: RenderMode | string | Expander;
  public commandName?: string;
  constructor(
    private dictName: string,
    private kind: CommandType,
    context: ExtensionContext,
    conf: InputMethodConf
  ) {
    this.name = conf.name;
    this.languages = conf.languages;
    this.triggers = conf.triggers;
    if (typeof conf.dictionary === "string") {
      this.dictionary = conf.dictionary;
    } else {
      const dicSet: Set<string> = new Set();
      const dic: LaTeXInputMethodItemConfig[] = [];
      let dicSeed = conf.dictionary;
      let i: undefined | string | InputMethodItemConfig;
      while ((i = dicSeed.pop())) {
        if (typeof i === "string") {
          dicSeed = dicSeed.concat(this.decodePath(context, i));
        } else {
          if (!dicSet.has(i.label)) {
            dicSet.add(i.label);
            dic.push(<LaTeXInputMethodItemConfig>i);
          }
        }
      }
      this.dictionary = dic;
    }
    this.renderMode = LaTeXExpander;
    this.commandName = conf.commandName;
  }

  private decodePath(
    cxt: ExtensionContext,
    path: string
  ): LaTeXInputMethodItemConfig[] {
    let started: LaTeXConf = this.parseAny(cxt, path);
    const items: LaTeXInputMethodItemConfig[] = [];
    let seeds: (string | LaTeXInputMethodItemConfig)[];
    while (typeof started === "string") {
      started = this.parseAny(cxt, started);
    }
    seeds = started;

    const labDic: Set<string> = new Set();
    let i: undefined | string | LaTeXInputMethodItemConfig;
    while ((i = seeds.pop())) {
      if (typeof i === "string") {
        let ref: LaTeXConf = this.parseAny(cxt, i);
        while (typeof ref === "string") {
          ref = this.parseAny(cxt, ref);
        }
        seeds = seeds.concat(ref);
      } else if (!labDic.has(i.label)) {
        labDic.add(i.label);
        items.unshift(i);
      }
    }

    return items;
  }

  private parseAny<T>(cxt: ExtensionContext, path: string): T {
    path = Path.isAbsolute(path) ? path : cxt.asAbsolutePath(path);
    return JSON.parse(readFileSync(path).toString());
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

      const item = new LaTeXInputMethodItem(itemConf);
      (<LaTeXInputMethodItem[]>im.dictionary).push(item);
      await editor.insertSnippet(item.toSnippet(selection));

      const itemDef: string | CommandDefinition =
        this.kind === CommandType.Maketitle
          ? this.label
          : { name: this.label, args };
      const curConf = conf.inspect<CommandDictionary>(
        `catex.${this.dictionary}.dictionary`
      );
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
      await conf.update(
        `catex.${this.dictionary}.dictionary`,
        dic,
        this.confTarget
      );
    }
  }
}
