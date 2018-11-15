import { Expander, InputMethodItem } from "./generic-input-method/input_method";
import { CommandType, ArgSpec, ArgKind, LaTeXScope } from "./latex_syntax";
import { SnippetString } from "vscode";

export const LaTeXExpander: Expander = i =>
  new LaTeXInputMethodItem(i as LaTeXInputMethodItemConfig);

export interface LaTeXInputMethodItemConfig {
  label: string;
  body: string;
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
  constructor(item: LaTeXInputMethodItemConfig) {
    this.label = item.label;
    this.body = item.body;
    this.description = item.description;
    this.type = item.type;
    this.args = item.args;
    this.scope = item.scope;
  }

  /**
   * render
   */
  public toSnippet(selection: string = ""): SnippetString {
    let rendered = "";

    let args = (this.args || []).map(render_argspec(selection)).join("");

    if (this.type === CommandType.Environment) {
      if (selection) {
        rendered = [
          `\\begin{${this.body}}${args}`,
          `  ${selection}$0`,
          `\\end{${this.body}}`
        ].join("\n");
      } else {
        rendered = [
          `\\begin{${this.body}}${args}`,
          "  $0",
          `\\end{${this.body}}`
        ].join("\n");
      }
    } else if (this.type === CommandType.Large) {
      if (selection) {
        rendered = `{\\${this.body} ${selection}}`;
      } else {
        rendered = `{\\${this.body} $1}`;
      }
    } else if (this.type === CommandType.Section) {
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
    }
    return new SnippetString(rendered);
  }
}

/**
 * render_argspec
 */
function render_argspec(
  selection: string
): (spec: ArgSpec, i: number) => string {
  return function(value: ArgSpec, index: number): string {
    let rendered = "";
    let cands = value.candidates;
    if (cands) {
      rendered = `\${${index}|${cands.join(",")}|}`;
    } else if (selection.length > 0 && index === 0) {
      rendered = selection;
    } else {
      rendered = `\${${index}}`;
    }
    if (value.kind === ArgKind.Fixed) {
      rendered = `{${rendered}}`;
    } else if (value.kind === ArgKind.Optional) {
      rendered = `[${rendered}]`;
    }
    return rendered;
  };
}
