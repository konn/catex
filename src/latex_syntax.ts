export enum ArgKind {
  Fixed = "fixed",
  Optional = "optional"
}

export interface ArgSpec {
  kind: ArgKind;
  candidates?: string[];
  placeholder?: string;
}

export enum CommandType {
  Maketitle = "maketitle",
  Environment = "environment",
  Section = "section",
  Text = "text",
  Large = "large"
}

export enum LaTeXScope {
  Math = "math",
  Text = "text"
}
