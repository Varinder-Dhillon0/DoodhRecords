export const BASE_FONT_SIZES = {
  labelSm: 9,
  labelCaps: 11,
  bodySm: 12,
  titleMd: 14,
  bodyMd: 14,
  body: 15,
  bodyLg: 16,
  titleLg: 16,
  metric: 17,
  headlineSm: 18,
  headlineMd: 20,
  headlineLg: 24,
  metricDisplay: 28,
  headlineXl: 32,
} as const;

export const TYPOGRAPHY = {
  ultraMicro: BASE_FONT_SIZES.labelSm,
  micro: BASE_FONT_SIZES.labelCaps,
  caption: BASE_FONT_SIZES.bodySm,
  label: BASE_FONT_SIZES.titleMd,
  bodySmall: BASE_FONT_SIZES.bodySm,
  body: BASE_FONT_SIZES.bodyMd,
  bodyLarge: BASE_FONT_SIZES.bodyLg,
  title: BASE_FONT_SIZES.titleLg,
  metric: BASE_FONT_SIZES.metric,
  headingSmall: BASE_FONT_SIZES.headlineSm,
  heading: BASE_FONT_SIZES.headlineMd,
  screenTitle: BASE_FONT_SIZES.headlineMd,
  brandTitle: BASE_FONT_SIZES.headlineLg,
  display: BASE_FONT_SIZES.metricDisplay,
  headlineXl: BASE_FONT_SIZES.headlineXl,
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
    Math.abs(option.multiplier - value) < Math.abs(nearest.multiplier - value)
      ? option
      : nearest,
  );

const baseSizeToName = new Map<number, TypographyName>(
  (Object.keys(TYPOGRAPHY) as TypographyName[]).map((name) => [
    TYPOGRAPHY[name],
    name,
  ]),
);

export const TEXT_VARIANTS = {
  display: {
    fontSize: TYPOGRAPHY.display,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  screenTitle: {
    fontSize: TYPOGRAPHY.headingSmall,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
  },
  body: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: "400",
  },
  bodyStrong: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: "700",
  },
  caption: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: "500",
  },
  micro: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "600",
  },
  eyebrow: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  button: {
    fontSize: TYPOGRAPHY.bodyLarge,
    fontWeight: "700",
  },
  numeric: {
    fontSize: TYPOGRAPHY.display,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
} as const;

export type TextVariantName = keyof typeof TEXT_VARIANTS;

export const getTypographySize = (
  baseSize: number,
  runtimeTypography: RuntimeTypography,
): number => {
  const semanticName = baseSizeToName.get(baseSize);
  return semanticName ? runtimeTypography[semanticName] : baseSize;
};
