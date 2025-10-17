# Missile Command - Modern Edition

A modernized version of the classic 1980 arcade game "Missile Command" developed and published by Atari. This project features a complete rewrite with modern JavaScript ES6 modules, improved UI/UX, and enhanced gameplay features.

## 🎮 Live Demo

[Play the game online](https://santiherranz.github.io/new-missile-command/)

## ✨ Features

### 🎯 Core Gameplay
- **Defend your cities** from falling asteroids using missile defense towers
- **Manual and Auto modes** - Click to fire manually or let the AI handle defense
- **Progressive difficulty** - Each level increases asteroid speed and quantity
- **Score system** with persistent high scores using localStorage

### 🎨 Modern UI/UX
- **Responsive design** that works on desktop and mobile devices
- **Modern interface** built with Tailwind CSS v3
- **Smooth animations** and visual effects
- **Particle system** for enhanced explosion effects
- **Real-time FPS counter** (optional)

### ⚙️ Configuration Options
- **Difficulty settings** - Easy, Normal, Hard
- **Sound effects** toggle
- **Particle effects** toggle
- **Auto mode** preference
- **FPS display** toggle

### 🏆 Advanced Features
- **High score system** with persistent storage
- **Settings panel** for game customization
- **Pause/Resume** functionality
- **Game over screen** with score display
- **Keyboard controls** (Space to toggle mode)

## 🚀 Technical Features

### Architecture
- **ES6 Modules** - Clean, organized code structure
- **Object-oriented design** with proper separation of concerns
- **Modern JavaScript** features and best practices
- **JSDoc documentation** for all classes and methods

### Performance
- **Optimized game loop** with fixed timestep
- **Efficient rendering** with Canvas API
- **Memory management** with object pooling
- **Smooth 60 FPS** gameplay

### Code Organization
```
src/
├── constants/     # Game configuration and constants
├── core/         # Main game logic and game loop
├── entities/     # Game objects (Asteroid, Missile, City, etc.)
├── ui/           # User interface components
├── utils/        # Utility functions (physics, collision detection)
└── main.js       # Application entry point
```

## 🎮 How to Play

### Controls
- **Mouse/Touch**: Click on the canvas to fire missiles at asteroids
- **Spacebar**: Toggle between Manual and Auto mode
- **UI Buttons**: 
  - `PAUSE` - Pause/Resume the game
  - `AUTO` - Toggle automatic missile firing
  - `⚙️` - Open settings panel
  - `🏆` - View high scores

### Objective
- **Defend your cities** (green rectangles) from falling asteroids
- **Use missile towers** (green circles with cannons) to fire defensive missiles
- **Destroy asteroids** before they reach your cities
- **Survive as long as possible** and achieve the highest score

### Scoring
- **25 points** for each asteroid destroyed
- **Bonus points** for consecutive hits
- **High scores** are saved automatically

## 🛠️ Development

### Prerequisites
- Modern web browser with ES6 module support
- Local web server (for development)

### Setup
1. Clone the repository
2. Serve the files using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. Open `http://localhost:8000` in your browser

### Project Structure
- **HTML**: Modern semantic markup with Tailwind CSS
- **JavaScript**: ES6 modules with classes and modern syntax
- **CSS**: Custom styles with Tailwind utility classes
- **Assets**: No external dependencies except Tailwind CDN

## 🔧 Configuration

### Game Settings
Access the settings panel (⚙️ button) to customize:
- **Difficulty**: Easy, Normal, Hard
- **Sound Effects**: Enable/disable audio
- **Particle Effects**: Toggle visual effects
- **Auto Mode**: Default game mode
- **FPS Display**: Show/hide performance counter

### Technical Settings
- **Canvas Resolution**: Automatically scales to window size
- **Frame Rate**: 60 FPS target with adaptive timing
- **Memory Management**: Automatic object pooling for performance

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Touch controls supported

## 🎯 Future Enhancements

- [ ] Sound effects and background music
- [ ] Power-ups and special weapons
- [ ] Multiplayer mode
- [ ] Level editor
- [ ] Achievement system
- [ ] Mobile app version

## 📄 License

This project is for educational purposes. The original Missile Command game is owned by Atari.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📸 Screenshots

![Game Screenshot](https://user-images.githubusercontent.com/961911/110108706-cbaea780-7dac-11eb-9feb-7edbfd19af5e.png)

---

**Enjoy defending your cities!** 🚀💥
