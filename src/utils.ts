export const panic = (msg: string) => {
  throw msg;
};

export const has_rey = <O extends Record<string, unknown>>(
  obj: O,
  key: PropertyKey,
): key is keyof O => key in obj;

export const ANSI_REGEXES = [
  /\x1b\[(\d+)m/g,
  /\x1b\[(?:3|4)8;5;(\d+)m/g,
  /\x1b\[(?:3|4)8;2;(\d+);(\d+);(\d+)m/g,
];

export const CODE_REGEXES = [
  String.raw`(~?)([0-9a-gl-or])`,
  String.raw`(~?)\[#([0-9a-fA-F]{6})\]`,
];

export const create_patterns = (marker: string): RegExp[] =>
  CODE_REGEXES.map((x) => new RegExp(`${marker}${x}`, "g"));

export const fill_template = (template: string, value: string): string =>
  template.replace("{}", value);

export const fill_rgb_template = (
  template: string,
  r: string,
  g: string,
  b: string,
): string => template.replace("{r}", r).replace("{g}", g).replace("{b}", b);

export const remove_all_regexes = (regexes: RegExp[], string: string): string =>
  regexes.reduce((string, pattern) => string.replace(pattern, ""), string);

export function* chain_iter<T>(a: Iterable<T>, b: Iterable<T>): Iterable<T> {
  for (const x of a) yield x;
  for (const x of b) yield x;
}
