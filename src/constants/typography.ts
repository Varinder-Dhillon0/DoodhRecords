export const BASE_FONT_SIZES = {
  xs: 11,
  sm: 12,
  md: 13,
  bodySmall: 14,
  body: 15,
  bodyLarge: 16,
  metric: 17,
  headingSmall: 18,
  heading: 20,
  title: 22,
  hero: 24,
  display: 28,
} as const;

export const TYPOGRAPHY = {
  micro: BASE_FONT_SIZES.xs,
  caption: BASE_FONT_SIZES.sm,
  label: BASE_FONT_SIZES.md,
  bodySmall: BASE_FONT_SIZES.bodySmall,
  body: BASE_FONT_SIZES.body,
  bodyLarge: BASE_FONT_SIZES.bodyLarge,
  metric: BASE_FONT_SIZES.metric,
  headingSmall: BASE_FONT_SIZES.headingSmall,
  heading: BASE_FONT_SIZES.heading,
  screenTitle: BASE_FONT_SIZES.title,
  brandTitle: BASE_FONT_SIZES.hero,
  display: BASE_FONT_SIZES.display,
} as const;

export type TypographyName = keyof typeof TYPOGRAPHY;
export type RuntimeTypography = Record<TypographyName, number>;

export const FONT_SCALE_MULTIPLIERS = {
  small: 0.85,
  default: 1,
  large: 1.15,
  extraLarge: 1.3,
  huge: 1.45,
} as const;

export const FONT_SCALE_OPTIONS = [
  {
    id: "small",
    multiplier: FONT_SCALE_MULTIPLIERS.small,
    labelKey: "settings.fontSizeSmall",
  },
  {
    id: "default",
    multiplier: FONT_SCALE_MULTIPLIERS.default,
    labelKey: "settings.fontSizeDefault",
  },
  {
    id: "large",
    multiplier: FONT_SCALE_MULTIPLIERS.large,
    labelKey: "settings.fontSizeLarge",
  },
  {
    id: "extraLarge",
    multiplier: FONT_SCALE_MULTIPLIERS.extraLarge,
    labelKey: "settings.fontSizeExtraLarge",
  },
  {
    id: "huge",
    multiplier: FONT_SCALE_MULTIPLIERS.huge,
    labelKey: "settings.fontSizeHuge",
  },
] as const;

export type FontScaleOption = (typeof FONT_SCALE_OPTIONS)[number];

export const FONT_SCALE_RANGE = {
  min: FONT_SCALE_OPTIONS[0].multiplier,
  max: FONT_SCALE_OPTIONS[FONT_SCALE_OPTIONS.length - 1].multiplier,
  step: 0.15,
  default: FONT_SCALE_OPTIONS[1].multiplier,
} as const;

export const scaleFontSize = (baseSize: number, multiplier: number): number =>
  Math.round(baseSize * multiplier);

export const createTypography = (multiplier: number): RuntimeTypography =>
  Object.fromEntries(
    Object.entries(TYPOGRAPHY).map(([name, baseSize]) => [
      name,
      scaleFontSize(baseSize, multiplier),
    ]),
  ) as RuntimeTypography;

export const getNearestFontScaleOption = (value: number): FontScaleOption =>
  FONT_SCALE_OPTIONS.reduce((nearest, option) =>
    Math.abs(option.multiplier - value) <
    Math.abs(nearest.multiplier - value)
      ? option
      : nearest,
  );

export const getTypographySize = (
  baseSize: number,
  runtimeTypography: RuntimeTypography,
): number => {
  const semanticName = Object.keys(TYPOGRAPHY).find(
    (name) => TYPOGRAPHY[name as TypographyName] === baseSize,
  ) as TypographyName | undefined;
  return semanticName ? runtimeTypography[semanticName] : baseSize;
};
