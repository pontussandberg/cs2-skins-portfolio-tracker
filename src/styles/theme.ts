/**
 * Design tokens: the Nord palette (https://www.nordtheme.com), mapped like its VS Code theme.
 * Polar Night nord0-3 for backgrounds, Snow Storm for text, Frost as accent, Aurora for status.
 * Plain values, imported directly by styles; there is no ThemeProvider.
 */
const nord = {
  nord0: "#2e3440",
  nord1: "#3b4252",
  nord2: "#434c5e",
  nord3: "#4c566a",
  nord5: "#e5e9f0",
  nord7: "#8fbcbb",
  nord8: "#88c0d0",
  nord11: "#bf616a",
  nord12: "#d08770",
  nord13: "#ebcb8b",
  nord14: "#a3be8c",
  nord15: "#b48ead",
};

/** `color` at `percent`% opacity. */
export const alpha = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;
/** A faint tint of `color` over the panel background, for status backgrounds. */
const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, ${nord.nord1})`;

export const theme = {
  color: {
    canvas: nord.nord0,
    surface: nord.nord1,
    surface2: nord.nord2,
    line: nord.nord2,
    lineStrong: nord.nord3,
    ink: nord.nord5,
    /** Between nord3 and nord4: Nord's comment grey is too faint for body text (>= 4.5:1 here). */
    inkMuted: "#a3adbf",

    /** Frost: fills (dark text on it, 7:1), links and highlights. */
    accent: nord.nord8,
    accentHover: nord.nord7,
    accentInk: nord.nord0,

    /** Status: Aurora text on a faint tint of the panel colour. */
    success: tint(nord.nord14, 16),
    successInk: nord.nord14,
    danger: tint(nord.nord11, 18),
    dangerInk: "#d08b92", // nord11 lightened for contrast on nord1
    warning: tint(nord.nord13, 14),
    warningInk: nord.nord13,
    info: tint(nord.nord15, 18),
    infoInk: "#c6a5c0", // nord15 lightened

    /** Float bar wear ranges (FN, MW, FT, WW, BS), green to red. */
    wear: { fn: nord.nord14, mw: nord.nord7, ft: nord.nord13, ww: nord.nord12, bs: nord.nord11 },
  },
  font: {
    sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "Cascadia Mono", Menlo, Consolas, monospace',
  },
  radius: { card: "10px", control: "8px", dialog: "12px" },
  layout: { maxWidth: "80rem" },
  motion: { fast: "120ms ease" },
  shadow: {
    /** Dialogs and toasts. */
    floating: "0 24px 60px rgb(0 0 0 / 0.4)",
    /** A card being dragged. */
    lifted: "0 12px 32px rgb(0 0 0 / 0.35)",
  },
  /** Stacking order, lowest first. Modal dialogs use the browser's top layer and sit above all of these. */
  z: { raised: 10, dragging: 20, nav: 30, status: 40, toast: 50 },
} as const;

/** Min-width breakpoints (same as the previous Tailwind ones). */
export const media = {
  sm: "@media (min-width: 640px)",
  md: "@media (min-width: 768px)",
  lg: "@media (min-width: 1024px)",
  xl: "@media (min-width: 1280px)",
} as const;
