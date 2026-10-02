# QR Maker

A browser-only QR code generator built with React and Vite. No backend: everything, including the saved "recent codes", stays in your browser.

## Features

- **Types:** URL, plain text, email, phone number, Wi-Fi, each with its own inputs
- **Live preview** that updates as you type or change any setting
- **Customization:** size, foreground and background colour, error correction level, margin
- **Presets:** six ready-made looks that you can still adjust afterwards
- **Download:** PNG (taken from the exact canvas shown in the preview), plus SVG and copy-to-clipboard
- **Validation:** clear messages for missing or invalid input
- **Scan reliability warnings:** low contrast, inverted colours, small margin, tiny modules, logo covering too much, dense codes
- **Recent codes:** saved in `localStorage`, still there after a refresh, reusable with one click
- **Extras:** logo in the centre, gradient colours, dot and rounded patterns, light/dark theme
- **Responsive** layout for desktop and mobile

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # run the automated tests
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## Project structure

```
src/
  components/   QRTypeSelector, QRInputForm, QRCustomization, QRPresetSelector,
                QRPreview, QRWarning, RecentQRCodes, ErrorMessage
  utils/
    qrGenerator.js   builds the QR matrix, draws it (canvas + SVG), PNG/SVG/clipboard export, scan warnings
    qrFormatter.js   turns form input into the string inside the code (mailto:, tel:, WIFI:...)
    validation.js    input validation for every type
    localStorage.js  recent codes and theme persistence
  data/presets.js
  styles/       global.css, app.css, components.css, responsive.css
  App.jsx, main.jsx
tests/          validation, qrFormatter, qrGenerator, localStorage
```

The `qrcode-generator` library only works out which squares are dark. Drawing, SVG export, patterns, gradients, the logo and the warnings are all in `qrGenerator.js`.

## How the pieces fit

1. `QRInputForm` edits the data for the selected type.
2. `validation.js` checks it. If it is valid, `qrFormatter.js` builds the final string.
3. `qrGenerator.js` turns that string into a matrix of dark and light squares.
4. `QRPreview` draws the matrix on a canvas using the current settings. The PNG download is that same canvas, so the file always matches the preview.
5. `getWarnings()` inspects the settings and matrix and `QRWarning` shows any problems.
6. After you pause for 2 seconds on a valid code, it is saved to "Recent codes". Logos are not saved there because they can be large.

## Deploy

**Vercel:** push the project to GitHub, choose "Add New Project", import the repo. Vercel detects Vite automatically (build command `npm run build`, output directory `dist`).

**Netlify:** push to GitHub, choose "Add new site", then "Import an existing project". Build command `npm run build`, publish directory `dist`.

Neither needs any environment variables or server settings.

## Testing

### Automated (`npm test`, 71 tests)

| File | What it covers |
| --- | --- |
| `validation.test.js` | Valid and invalid input for every type: URLs (including `javascript:` and `ftp:`), empty and over-long text, email, phone length and characters, Wi-Fi name and password rules |
| `qrFormatter.test.js` | The exact strings produced for each type, including Wi-Fi escaping of `; , : " \` |
| `qrGenerator.test.js` | Matrix size, determinism, UTF-8 text, "too long" errors, margins, patterns, SVG output, gradient and logo handling, every warning rule. It also **renders each QR type to pixels and decodes it with a real QR reader (jsQR)**, at all four error correction levels, and checks the decoded text matches what was encoded |
| `localStorage.test.js` | Saving, newest-first order, de-duplication, the 8-item cap, removing, clearing, reading back after a "reload", corrupted data, and blocked or full storage |

### Manual checklist (do this in a browser before submitting)

**Each QR type.** For URL, Text, Email, Phone and Wi-Fi: fill in the form, confirm the preview appears, and scan it with your phone. The URL should open, the email should open a draft, the phone should offer to call, and the Wi-Fi code should offer to join the network.

**Customization.** Move every control and confirm the preview changes immediately: size, margin, code colour, background, gradient, pattern (square, rounded, dots), error correction level, and logo upload. Pick a preset, then change one setting and confirm the preset highlight clears.

**Downloads.** Download the PNG and SVG and open them. Check that the PNG looks the same as the preview, that its pixel size matches the "× px" line under the preview, and that both scan with a phone. Try "Copy image" and paste it into a document. Repeat with a gradient, a dot pattern and a logo.

**Invalid input.** Try: empty fields, `not a url`, `javascript:alert(1)`, `abc` as an email, `12345` as a phone number, a Wi-Fi password that is too short, and text over 1000 characters. Each should show a message and no QR code.

**Scan warnings.** Set the colours to light grey on white (error), white on black (inverted warning), margin 0 to 3, a very small size, and a logo with error correction at L or M. Each should show a warning. Confirm the default black on white shows the green "No scanning problems" note.

**Persistence.** Make two or three different codes, waiting 2 seconds on each, refresh the page, and confirm they are still listed. Click "Use" on one and confirm the form and style come back. Remove one and use "Clear all". Also confirm the theme you chose is remembered.

**Responsiveness.** Use the browser's device toolbar at about 375 px wide and at tablet and desktop widths. Nothing should scroll sideways, controls should stay tappable, and the preview should sit between the form and the style section on small screens.
