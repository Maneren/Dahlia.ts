// A simple text formatting package, inspired by the game Minecraft.
//
// Text is formatted in a similar way to in the game. With Dahlia, it is
// formatted by typing a marker (`&` by default in the original implementation)
// followed by a format code and finally the text to be formatted.
//
// ## Color Format Codes
//
// Each digit/letter corresponds to a hex value (dependent on the color depth). The coloring can be applied to the background if a `~` is inserted between `&` and the code.
//
// Color | 3-bit | 8-bit | 24-bit
// --- | --- | --- | ---
// `0` | `#000000` | `#000000` | `#000000`
// `1` | `#000080` | `#0000af` | `#0000aa`
// `2` | `#008000` | `#00af00` | `#00aa00`
// `3` | `#008080` | `#00afaf` | `#00aaaa`
// `4` | `#800000` | `#af0000` | `#aa0000`
// `5` | `#800080` | `#af00af` | `#aa00aa`
// `6` | `#808000` | `#ffaf00` | `#ffaa00`
// `7` | `#c0c0c0` | `#a8a8a8` | `#aaaaaa`
// `8` | `#000000` | `#585858` | `#555555`
// `9` | `#000080` | `#afafff` | `#5555ff`
// `a` | `#008000` | `#5fff5f` | `#55ff55`
// `b` | `#000080` | `#5fffff` | `#55ffff`
// `c` | `#800000` | `#ff5f5f` | `#ff5555`
// `d` | `#800080` | `#ff5fff` | `#ff55ff`
// `e` | `#808000` | `#ffff5f` | `#ffff55`
// `f` | `#c0c0c0` | `#ffffff` | `#ffffff`
// `g` | `#808000` | `#d7d700` | `#ddd605`
//
// ## Formatting Codes
//
// Code | Result
// --- | ---
// `l` | Bold
// `m` | Strikethrough
// `n` | Underline
// `o` | Italic
// `r` | Reset formatting
//
// ## Custom Colors
//
// For colors by hex code, use square brackets containing the hex code inside of it.
//
// - Foreground: `&[#xxxxxx]`
// - Background: `&~[#xxxxxx]`
//
// `xxxxxx` represents the hex value of the color.

import { iter } from "@maneren/utils/iterator";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import {
  BG_FORMAT_TEMPLATES,
  COLORS,
  COLORS_24BIT,
  FORMAT_TEMPLATES,
  FORMATTERS,
} from "./constants";

import {
  ANSI_REGEXES,
  create_patterns,
  fill_rgb_template,
  fill_template,
  remove_all_regexes,
  panic,
  has_key,
} from "./utils";

/** Specifies usable color depth levels */
export const enum Depth {
  /** 3-bit color (tty) */
  TTY = 3,
  /** 4-but color */
  Low = 4,
  /** 8-bit color */
  Medium = 8,
  /** 24-bit color (true color) */
  High = 24,
}

export class Dahlia {
  /** Specifies what ANSI color set to use (in bits) */
  depth: Depth;
  /** When true, doesn't add an "&r" at the end when converting strings. */
  no_reset: boolean;
  /** When true, `Dahlia.convert` is equivalent to `clean` */
  no_color: boolean;
  /** Regex patterns used by the Dahlia instance */
  private patterns: RegExp[];
  /** Marker used for formatting */
  marker: string;

  constructor(depth: Depth, no_reset: boolean, marker: string) {
    const env = process.env.NO_COLOR;
    const no_color = !!env && (env.toLowerCase() === "true" || env === "1");

    const patterns = create_patterns(marker);

    this.depth = depth;
    this.no_reset = no_reset;
    this.no_color = no_color;
    this.patterns = patterns;
    this.marker = marker;
  }

  /** Formats a string using the format codes.
   *
   * ### Example
   * ```ts
   * let dahlia = new Dahlia(Depth.High, true);
   * let text = dahlia.convert("&aHello\n&cWorld");
   * console.log(text);
   * ```
   *
   * <style>
   * .a {
   *     color: #55ff55;
   * }
   * .c {
   *     color: #ff5555;
   * }
   * </style>
   * <pre>
   * <span class="a">Hello</span>
   * <span class="c">World</span>
   * </pre>
   */
  convert(string: string): string {
    if (this.no_color) return remove_all_regexes(this.patterns, string);

    const reset = `${this.marker}r`;

    if (!(string.endsWith(reset) || this.no_reset)) string += reset;

    const replacer = (code: string, ...[bg, color]: string[]) =>
      this.get_ansi(color, bg === "~") ?? panic(`Invalid code: ${code}`);

    return this.patterns.reduce(
      (string: string, pattern: RegExp) => string.replace(pattern, replacer),
      string,
    );
  }

  /** Writes the prompt to stdout, then reads a line from input,
   * and returns it (excluding the trailing newline).
   */
  async input(prompt: string): Promise<string> {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(this.convert(prompt));
    return answer.slice(0, -1);
  }

  private get_ansi(code: string, bg: boolean): string | null {
    const formats = bg ? BG_FORMAT_TEMPLATES : FORMAT_TEMPLATES;

    if (code.length === 6) {
      const [r, g, b] = [0, 2, 4].map((i) =>
        parseInt(code.slice(i, i + 2), 16).toString(),
      );

      return fill_rgb_template(formats[24], r, g, b);
    }

    if (has_key(FORMATTERS, code)) {
      return fill_template(formats[3], FORMATTERS[code]);
    }

    const template = formats[this.depth];

    if (this.depth === Depth.High) {
      if (!has_key(COLORS_24BIT, code)) return null;
      const [r, g, b] = COLORS_24BIT[code];

      return fill_rgb_template(template, r, g, b);
    }

    const color_map = COLORS[this.depth];

    if (!has_key(color_map, code)) return null;
    let value = color_map[code];

    if (bg && this.depth <= Depth.Low) {
      value = (parseInt(value) + 10).toString();
    }

    return fill_template(template, value);
  }

  /** Resets all modifiers. */
  reset = () => stdout.write(this.convert(`${this.marker}r`));

  /** Wrapper over `console.log`, calling the `convert` method for each argument.
   *
   * ### Example
   * ```ts
   * let d = new Dahlia(Depth.Low, false);
   *
   * // The following two are equivalent
   * console.log(d.convert("Hello &3World&r!"));
   * d.log("Hello &3World&r!")
   * ```
   */
  log = (...msgs: string[]) => console.log(...msgs.map(this.convert));

  /** Returns a string with all the possible formatting options. */
  test = (): string =>
    this.convert(
      iter("0123456789abcdefg")
        .map((ch) => `${this.marker}${ch}${ch}`)
        .chain(
          iter("lmno").map((ch) => `${this.marker}r${this.marker}${ch}${ch}`),
        )
        .join(),
    );
}

/** Removes all Dahlia format codes from a string.
 *
 * ### Example
 * ```ts
 * let green_text = "&2>be me";
 * console.assert(clean(green_text) === ">be me")
 * ```
 */
export const clean = (string: string, marker: string): string =>
  remove_all_regexes(create_patterns(marker), string);

/** Removes all ANSI codes from a string.
 *
 * ### Example
 * ```ts
 * let dahlia = new Dahlia(Depth.High, false);
 * let green_text = dahlia.convert("&2>be me");
 * console.assert(clean_ansi(green_text) === ">be me");
 * ```
 */
export const clean_ansi = (string: string): string =>
  remove_all_regexes(ANSI_REGEXES, string);
