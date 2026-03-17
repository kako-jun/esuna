/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Famicom Final Fantasy color palette
        'ff-bg':           '#000080',
        'ff-panel':        '#0000AA',
        'ff-panel-dark':   '#000066',
        'ff-border':       '#ffffff',
        'ff-border-inner': '#aaaaff',
        'ff-text':         '#ffffff',
        'ff-text-dim':     '#aaaaff',
        'ff-cursor':       '#ffffff',
        'ff-selected':     '#0000CC',
        'ff-gap':          '#000044',
        // Legacy CSS variable references (keep for compatibility)
        background:  'var(--ff-bg)',
        foreground:  'var(--ff-text)',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', '"Courier New"', 'Courier', 'monospace'],
        mono:  ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
