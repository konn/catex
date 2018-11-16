import { Expander, InputMethodItem } from "./generic-input-method/input_method";
import { CommandType, ArgSpec, ArgKind, LaTeXScope } from "./latex_syntax";
import { SnippetString, workspace, window } from "vscode";

export const LaTeXExpander: Expander = i =>
  new LaTeXInputMethodItem(i as LaTeXInputMethodItemConfig);
export interface LaTeXInputMethodItemConfig {
  label: string;
  body: string;
  contentPrefix?: string;
  filterText: string;
  description: string;
  type?: CommandType;
  args?: ArgSpec[];
  scope?: LaTeXScope;
}

export class LaTeXInputMethodItem implements InputMethodItem {
  public label: string;
  public body: string;
  public description: string;
  public type?: CommandType;
  public args?: ArgSpec[];
  public scope?: LaTeXScope;
  public contentPrefix: string;
  constructor(item: LaTeXInputMethodItemConfig) {
    this.label = item.label;
    this.body = item.body;
    this.description = item.description;
    this.type = item.type;
    this.args = item.args;
    this.scope = item.scope;
    this.contentPrefix = item.contentPrefix || "";
  }

  /**
   * render
   */
  public toSnippet(selection: string = ""): SnippetString {
    let rendered = "";
    let tabSize = 1;
    const editor = window.activeTextEditor;
    if (editor) {
      tabSize = workspace
        .getConfiguration("editor", editor.document.uri)
        .get("tabSize", 1);
    }
    const spaces = Array(tabSize)
      .fill(" ")
      .join("");
    let args = renderArgs(selection, this.args || []).value;

    if (this.type === CommandType.Environment) {
      if (selection) {
        rendered = [
          `\\begin{${this.body}}${args}`,
          `${spaces}${this.contentPrefix}${selection}$0`,
          `\\end{${this.body}}`
        ].join("\n");
      } else {
        rendered = [
          `\\begin{${this.body}}${args}`,
          `${spaces}${this.contentPrefix}$0`,
          `\\end{${this.body}}`
        ].join("\n");
      }
    } else if (this.type === CommandType.Large) {
      if (selection) {
        rendered = `{\\${this.body}${args} ${this.contentPrefix}${selection}}`;
      } else {
        rendered = `{\\${this.body}${args} ${this.contentPrefix}$1}`;
      }
    } else if (this.type === CommandType.Maketitle) {
      rendered = `\\${this.body}`;
    } else if (this.type === CommandType.Section) {
      if (selection) {
        selection = `${this.contentPrefix}${selection}`;
      }
      if (!this.args || this.args.length === 0) {
        if (selection.length === 0) {
          rendered = `\\${this.body}{$1}`;
        } else {
          rendered = `\\${this.body}{${selection}}`;
        }
      } else {
        rendered = `\\${this.body}${args}`;
      }
    } else if (this.type === CommandType.Text) {
      rendered = this.body;
    } else {
      rendered = `\\${this.body}${args}`;
    }
    return new SnippetString(rendered);
  }
}

export function renderArgs(selection: string, specs: ArgSpec[]): SnippetString {
  let rendered = new SnippetString();
  let i = 0;
  let selRemains: boolean = selection.length > 0;
  const bodyIdx = specs.some(i => i.body || false)
    ? null
    : specs.findIndex(i => i.kind === ArgKind.Fixed);
  specs.forEach((value, pos) => {
    if (selRemains && (value.body || pos === bodyIdx)) {
      rendered.appendText(`{${selection}}`);
    } else {
      const mk = (inner: SnippetString) => {
        let cands = value.candidates;
        if (cands) {
          i += 1;
          inner.value += `\${${i}|`;
          inner.appendText(cands.join(","));
          inner.value += "|}";
        } else if (value.placeholder) {
          inner.appendText(value.placeholder);
        }
      };
      if (value.kind === ArgKind.Fixed) {
        i += 1;
        rendered.appendText("{");
        rendered.appendPlaceholder(mk, i);
        rendered.appendText("}");
      } else if (value.kind === ArgKind.Optional) {
        i += 1;
        rendered.appendPlaceholder(inner => {
          i += 1;
          inner.appendText("[");
          inner.appendPlaceholder(mk, i);
          inner.appendText("]");
        }, i);
      }
    }
  });
  return rendered;
}
