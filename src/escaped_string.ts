export default class EscapedString {
  public readonly length: number;
  constructor(public readonly value: string) {
    this.value = this.value.replace(/([\\\$\}])/g, "\\$1");
    this.length = this.value.length;
  }

  /**
   * toString
   */
  public toString(): string {
    return this.value;
  }
}
