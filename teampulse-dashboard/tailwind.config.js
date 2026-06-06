/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f9f9f7',
          dim: '#dadad8',
          bright: '#f9f9f7',
          'container-lowest': '#ffffff',
          'container-low': '#f4f4f2',
          container: '#eeeeec',
          'container-high': '#e8e8e6',
          'container-highest': '#e2e3e1',
          variant: '#e2e3e1',
        },
        'on-surface': {
          DEFAULT: '#1a1c1b',
          variant: '#4c4546',
        },
        'inverse-surface': '#2f3130',
        'inverse-on-surface': '#f1f1ef',
        outline: {
          DEFAULT: '#7e7576',
          variant: '#cfc4c5',
        },
        'surface-tint': '#5e5e5e',
        primary: {
          DEFAULT: '#000000',
          container: '#1b1b1b',
          fixed: '#e2e2e2',
          'fixed-dim': '#c6c6c6',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#848484',
          fixed: '#1b1b1b',
          'fixed-variant': '#474747',
        },
        secondary: {
          DEFAULT: '#2a6a41',
          container: '#abefbb',
          fixed: '#aef2be',
          'fixed-dim': '#92d6a3',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#2e6f45',
          fixed: '#00210d',
          'fixed-variant': '#0a522c',
        },
        tertiary: {
          DEFAULT: '#000000',
          container: '#271900',
          fixed: '#ffdeaa',
          'fixed-dim': '#f1bf67',
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#a77d2c',
          fixed: '#271900',
          'fixed-variant': '#5f4100',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        background: '#f9f9f7',
        'on-background': '#1a1c1b',
        'infrastructure-green': '#155932',
        'warning-amber': '#7A5500',
        'canvas-off-white': '#FAFAF8',
        'ink-black': '#000000',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.5rem',
      },
      spacing: {
        base: '4px',
        gutter: '16px',
        margin: '40px',
      },
      maxWidth: {
        'container-max': '2200px',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
