// Presets only change colours and pattern. Size, margin, error correction and
// logo stay as the user set them. Every preset keeps contrast above 4.5:1.

export const PRESETS = [
  {
    id: 'classic',
    name: 'Classic',
    settings: { fg: '#000000', bg: '#ffffff', fg2: '#4338ca', gradient: false, pattern: 'square' },
  },
  {
    id: 'ink',
    name: 'Ink',
    settings: { fg: '#14213d', bg: '#eef1fb', fg2: '#4338ca', gradient: false, pattern: 'rounded' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    settings: { fg: '#0b3d91', bg: '#eaf6ff', fg2: '#007c91', gradient: true, pattern: 'rounded' },
  },
  {
    id: 'forest',
    name: 'Forest',
    settings: { fg: '#1b4332', bg: '#edf6ee', fg2: '#4338ca', gradient: false, pattern: 'dots' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    settings: { fg: '#b3141f', bg: '#fff6ee', fg2: '#5a189a', gradient: true, pattern: 'rounded' },
  },
  {
    id: 'berry',
    name: 'Berry',
    settings: { fg: '#6a0572', bg: '#fdf0fb', fg2: '#4338ca', gradient: false, pattern: 'dots' },
  },
];

export const DEFAULT_PRESET_ID = 'classic';

/** The setting keys a preset controls. Changing one of these by hand clears the active preset. */
export const PRESET_KEYS = ['fg', 'bg', 'fg2', 'gradient', 'pattern'];
