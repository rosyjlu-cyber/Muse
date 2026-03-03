export const Theme = {
  colors: {
    // App-wide background (white)
    background: '#FFFFFF',
    surface: '#F5F5F5',          // card surface on white
    surfaceAlt: '#EBEBEB',

    // Text on light backgrounds
    primary: '#0B0B0B',
    secondary: '#666666',

    // Coral accent — brand color
    accent: '#D4574A',
    lime: '#D4574A',             // kept for compat; panel bg is now a gradient
    limeText: '#0B0B0B',         // text on light panel
    limeMuted: 'rgba(0,0,0,0.42)',

    // Calendar circles (on panel gradient)
    circleEmpty: 'rgba(0,0,0,0.10)',
    circleToday: '#0B0B0B',
    disabledOnLime: 'rgba(0,0,0,0.28)',

    // Accent tint (for icon backgrounds etc)
    accentLight: 'rgba(212,87,74,0.12)',

    // Brand coral — wordmarks on light background
    brandWarm: '#D4574A',

    // General
    border: 'rgba(0,0,0,0.1)',
    white: '#FFFFFF',
    disabled: 'rgba(0,0,0,0.28)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 22,
    full: 100,
  },
  font: {
    xs: 10,
    sm: 12,
    base: 15,
    md: 17,
    lg: 22,
    xl: 28,
    xxl: 36,
    brand: 'PlayfairDisplay_700Bold_Italic' as const,
  },
};
