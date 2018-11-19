export enum ArgKind {
  Fixed = "fixed",
  Optional = "optional"
}

export interface ArgSpec {
  kind: ArgKind;
  prefix?: string;
  candidates?: string[];
  placeholder?: string;
  body?: boolean;
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
