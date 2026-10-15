import { z } from "zod";

// Each event brings its own look. Colours become CSS variables that Tailwind reads as ev-* utilities
// (see globals.css), so core components never hard-code an event's palette.
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "use a 6-digit hex colour");

export const themeSchema = z.object({
  background: color.default("#faf8f5"),
  foreground: color.default("#1c1b1a"),
  muted: color.default("#6b6863"),
  card: color.default("#ffffff"),
  line: color.default("#e7e3dc"),
  accent: color.default("#1c1b1a"),
  accentForeground: color.default("#ffffff"),
  font: z.enum(["sans", "serif", "rounded"]).default("sans"),
});

export type Theme = z.infer<typeof themeSchema>;

const fontStacks: Record<Theme["font"], string> = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  rounded: "ui-rounded, 'SF Pro Rounded', var(--font-geist-sans), system-ui, sans-serif",
};

export function themeToCssVars(raw: unknown): Record<string, string> {
  const theme = themeSchema.parse(raw ?? {});
  return {
    "--ev-bg": theme.background,
    "--ev-fg": theme.foreground,
    "--ev-muted": theme.muted,
    "--ev-card": theme.card,
    "--ev-line": theme.line,
    "--ev-accent": theme.accent,
    "--ev-accent-fg": theme.accentForeground,
    "--ev-font": fontStacks[theme.font],
  };
}
