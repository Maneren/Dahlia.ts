import { clean, clean_ansi, Dahlia, Depth } from "../src/index";

test("clean", () => {
  expect(clean("hmm &3&oyes&r.", "&")).toBe("hmm yes.");
});

test("clean with custom marker", () => {
  expect(clean("i'm !4!lballing!r!", "!")).toBe("i'm balling!");
});

test("clean ansi", () => {
  expect(clean_ansi("hmm \x1b[38;2;0;170;170m\x1b[3myes\x1b[0m.\x1b[0m")).toBe(
    "hmm yes.",
  );
});

test("convert", () => {
  const dahlia = new Dahlia(Depth.High, false, "&");

  expect(dahlia.convert("hmm &3&oyes&r.")).toBe(
    "hmm \x1b[38;2;0;170;170m\x1b[3myes\x1b[0m.\x1b[0m",
  );
});

test("convert with background", () => {
  const dahlia = new Dahlia(Depth.High, false, "&");

  expect(dahlia.convert("hmm &~3yes&r.")).toBe(
    "hmm \x1b[48;2;0;170;170myes\x1b[0m.\x1b[0m",
  );
});

test("convert custom marker", () => {
  const dahlia = new Dahlia(Depth.High, false, "@");

  expect(dahlia.convert("hmm @3@oyes@r.")).toBe(
    "hmm \x1b[38;2;0;170;170m\x1b[3myes\x1b[0m.\x1b[0m",
  );
});

test("testing output", () => {
  const dahlia = new Dahlia(Depth.High, false, "&");

  const test = dahlia.test();

  expect(test).toBe(
    "\x1b[38;2;0;0;0m0\x1b[38;2;0;0;170m1\x1b[38;2;0;170;0m2\x1b[38;2;0;170;170m3\x1b[38;2;170;0;0m4\x1b[38;2;170;0;170m5\x1b[38;2;255;170;0m6\x1b[38;2;170;170;170m7\x1b[38;2;85;85;85m8\x1b[38;2;85;85;255m9\x1b[38;2;85;255;85ma\x1b[38;2;85;255;255mb\x1b[38;2;255;85;85mc\x1b[38;2;255;85;255md\x1b[38;2;255;255;85me\x1b[38;2;255;255;255mf\x1b[38;2;221;214;5mg\x1b[0m\x1b[1ml\x1b[0m\x1b[9mm\x1b[0m\x1b[4mn\x1b[0m\x1b[3mo\x1b[0m",
  );
});
