/**
 * Maps spoken phrases (lowercase) to command keys.
 * Used by speech navigation to trigger actions across the app.
 */
const PHRASE_TO_KEY: Record<string, string> = {
  /* Navigation - global */
  "next": "next",
  "next section": "next",
  "go next": "next",
  "next page": "next",
  "previous": "previous",
  "previous section": "previous",
  "go back": "previous",
  "back": "previous",
  "go previous": "previous",
  "home": "home",
  "go home": "home",
  "main page": "home",
  "demo": "tryDemo",
  "try demo": "tryDemo",
  "try demo lesson": "tryDemo",
  "try demo lessons": "tryDemo",
  "demo lesson": "tryDemo",
  "demo lessons": "tryDemo",
  "demo page": "tryDemo",
  "open demo": "tryDemo",
  "open demo lesson": "tryDemo",
  "tri demo": "tryDemo",
  "tried demo": "tryDemo",
  "dry demo lesson": "tryDemo",
  "start demo": "tryDemo",
  "show demo": "tryDemo",
  "load demo": "tryDemo",
  "go to demo": "tryDemo",
  "paste": "pasteText",
  "paste text": "pasteText",
  "paste lesson": "pasteText",
  "upload": "upload",
  "upload lesson": "upload",
  "upload file": "upload",
  "upload files": "upload",
  "preferences": "preferences",
  "profile": "preferences",
  "set up preferences": "preferences",
  "learning preferences": "preferences",
  "settings": "preferences",

  /* Read aloud - learn page */
  "read": "read",
  "read aloud": "read",
  "read lesson": "read",
  "start reading": "read",
  "read section": "read",
  "pause": "pause",
  "pause reading": "pause",
  "stop": "pause",
  "stop reading": "pause",
  "repeat": "repeat",
  "repeat section": "repeat",
  "read again": "repeat",

  /* Modes - learn page */
  "normal": "modeNormal",
  "normal mode": "modeNormal",
  "dyslexia": "modeDyslexia",
  "dyslexia mode": "modeDyslexia",
  "adhd": "modeAdhd",
  "adhd mode": "modeAdhd",
  "adhd focus": "modeAdhd",
  "focus mode": "modeAdhd",
  "low vision": "modeLowVision",
  "low vision mode": "modeLowVision",
  "vision mode": "modeLowVision",

  /* Toolbar - learn page */
  "increase font": "fontBigger",
  "bigger font": "fontBigger",
  "larger text": "fontBigger",
  "font bigger": "fontBigger",
  "decrease font": "fontSmaller",
  "smaller font": "fontSmaller",
  "smaller text": "fontSmaller",
  "font smaller": "fontSmaller",
  "contrast": "contrast",
  "high contrast": "contrast",
  "toggle contrast": "contrast",

  /* Forms */
  "save": "save",
  "save preferences": "save",
  "skip": "skip",
  "continue": "continue",
  "continue to lesson": "continue",

  "turn off": "turnOff",
  "speech off": "turnOff",
  "disable speech": "turnOff",
  "stop listening": "turnOff",
};

const GO_TO_SECTION_REGEX = /go to section (\d+)|section (\d+)/i;

export type CommandResult = { key: string; payload?: number } | null;

export function getCommandKey(transcript: string): CommandResult {
  const t = transcript.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;

  // Check for section navigation first
  const match = t.match(GO_TO_SECTION_REGEX);
  if (match) {
    const n = parseInt(match[1] ?? match[2] ?? "0", 10);
    if (n >= 1 && n <= 20) return { key: "goToSection", payload: n };
  }

  // CRITICAL: Check for stop/pause commands FIRST to prevent "stop" from matching "start reading"
  // These commands should take priority over any other matches
  // Check longer phrases first to avoid partial matches
  const stopPauseCommands = ["stop reading", "pause reading", "stop", "pause"];
  for (const cmd of stopPauseCommands) {
    // Exact match only - prevents "stop" from matching "start"
    if (t === cmd && PHRASE_TO_KEY[cmd]) {
      return { key: PHRASE_TO_KEY[cmd] };
    }
  }

  // Exact match check for all other commands
  if (PHRASE_TO_KEY[t]) {
    return { key: PHRASE_TO_KEY[t] };
  }

  // No match found
  return null;
}

export const SPEECH_STORAGE_KEY = "neuroadapt-speech-nav-enabled";
