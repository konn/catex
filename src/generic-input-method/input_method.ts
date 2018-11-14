import {
  CompletionItem,
  ExtensionContext,
  SnippetString,
  CompletionItemProvider,
  TextDocument,
  Position,
  CancellationToken,
  CompletionContext,
  QuickPickItem,
  TextEditor
} from "vscode";
export declare const Expanders: Map<string, Expander>;
export declare class InputMethod implements CompletionItemProvider {
  name: string;
  languages: string[];
  triggers: string[];
  renderMode: Expander;
  commandName?: string;
  private completionItems;
  private dictionary;
  constructor(context: ExtensionContext, conf: InputMethodConf);
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ): CompletionItem[];
  /**
   * quickPickItems
   */
  quickPickItems(): Thenable<RenderableQuickPickItem[]>;
  invokeQuickPick(editor: TextEditor, forced?: boolean): void;
}
export declare class SimpleInputMethodItem implements ToSnippet {
  label: string;
  body: string;
  description?: string;
  constructor(i: InputMethodItemConfig);
  /**
   * toSnippet
   */
  toSnippet(_?: string): SnippetString;
}
export interface InputMethodItem extends ToSnippet {
  label: string;
  body: string;
  description?: string;
}
export enum CommandType {
  Maketitle = "maketitle",
  Environment = "environment",
  Section = "section",
  Text = "text",
  Large = "large"
}
export interface ArgSpec {
  kind: ArgKind;
  candidates?: string[];
}
export declare enum ArgKind {
  Fixed = "fixed",
  Optional = "optional"
}
export interface LaTeXInputMethodItemConfig {
  label: string;
  body: string;
  filterText: string;
  description: string;
  type?: CommandType;
  args?: ArgSpec[];
}
export declare class LaTeXInputMethodItem implements InputMethodItem {
  label: string;
  body: string;
  description: string;
  type?: CommandType;
  args?: ArgSpec[];
  constructor(item: LaTeXInputMethodItemConfig);
  /**
   * render
   */
  toSnippet(selection?: string): SnippetString;
}
export interface ToSnippet {
  toSnippet(selection?: string): SnippetString;
}
export declare enum RenderMode {
  Snippet = "snippet",
  String = "string",
  LaTeXCommand = "latex"
}
export interface RenderableQuickPickItem extends QuickPickItem, ToSnippet {}
export interface InputMethodConf {
  name: string;
  languages: string[];
  triggers: string[];
  dictionary: (InputMethodItemConfig | string)[] | string;
  renderMode?: RenderMode | string | Expander;
  commandName?: string;
}
export interface InputMethodItemConfig {
  label: string;
  body: string;
  description?: string;
  [index: string]: any;
}
export declare type Expander = (conf: InputMethodItemConfig) => InputMethodItem;
export declare const SimpleExpander: Expander;
export declare const RawStringExpander: Expander;
export declare const LaTeXExpander: Expander;
export {};
