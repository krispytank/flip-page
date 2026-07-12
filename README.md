# FlipPage - Interactive Document Viewer

A Next.js application that provides an interactive flip page experience for viewing documents with realistic page-turning effects and sounds.

## Features

- **Realistic Page Flipping**: CSS 3D transforms for smooth page-turning animations
- **Sound Effects**: Realistic page-turning sounds using Web Audio API
- **PDF Support**: Upload and view PDF documents
- **Image Support**: View images as pages in the flipbook
- **Navigation**: Previous/next buttons, keyboard arrows, and click navigation
- **Zoom Controls**: Zoom in/out with buttons or keyboard shortcuts
- **Fullscreen Mode**: Press F for fullscreen viewing
- **Responsive Design**: Works on desktop and mobile devices
- **Touch Support**: Optimized for touch devices

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flippage
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Main Page

Visit the main page at `http://localhost:3000` to:
- Upload PDF or image documents
- Load a sample flipbook
- Access the interactive viewer

### Test Page

Visit the test page at `http://localhost:3000/test` to:
- See a working example of the flipbook
- Test navigation and zoom controls
- Experience the page-flipping animations

### Navigation

- **Arrow Keys**: Use left/right arrow keys to navigate between pages
- **Click**: Click on pages to navigate forward/backward
- **Buttons**: Use the navigation buttons at the bottom of the viewer

### Zoom Controls

- **+/- Keys**: Use plus/minus keys to zoom in/out
- **Buttons**: Use the zoom buttons at the bottom of the viewer
- **Reset**: Click the reset button to return to 100% zoom

### Keyboard Shortcuts

- `←` / `→`: Navigate between pages
- `+` / `-`: Zoom in/out
- `0`: Reset zoom to 100%
- `F`: Toggle fullscreen mode

## Project Structure

```
flippage/
├── src/
│   ├── components/
│   │   ├── FlipBook.js           # Main flip page component
│   │   ├── NavigationControls.js # Navigation buttons
│   │   └── ZoomControls.js       # Zoom controls
│   └── pages/
│       ├── index.js              # Main page
│       └── test.js               # Test page
├── public/
│   └── sounds/
│       └── page-flip.mp3         # Page flip sound effect
└── package.json
```

## Technologies Used

- **Next.js**: React framework for server-side rendering
- **React**: JavaScript library for building user interfaces
- **CSS 3D Transforms**: For realistic page-flipping animations
- **Web Audio API**: For generating page-turning sounds

## Customization

### Adding Sound Effects

The current implementation uses the Web Audio API to generate synthetic page-turning sounds. To use custom sound files:

1. Place your sound file in `public/sounds/page-flip.mp3`
2. Update the `playFlipSound` function in `FlipBook.js` to load and play the file

### Customizing Colors

Edit the CSS styles in the components to customize the color scheme. Each component uses styled-jsx for scoped styling.

### Adding New Document Types

Extend the `FlipBook.js` component to support additional document formats by adding new rendering logic in the `renderPageContent` function.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Building for Production

```bash
npm run build
```

### Starting Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## License

MIT License