# 3D Building Designer

A modern, interactive 3D building design application built with React, TypeScript, and Three.js. Create, edit, and visualize architectural designs with real-time 3D rendering and advanced design exploration tools.

## 🏗️ Features

### Core Functionality
- **Interactive 3D Building Creation**: Draw and design buildings with intuitive click-and-drag tools
- **Real-time 3D Visualization**: Instant feedback with smooth Three.js rendering
- **Multiple Camera Views**: Switch between perspective and orthographic cameras
- **Grid System**: Optional grid overlay with snap-to-grid functionality
- **Design Exploration**: Advanced parametric design tools with visual graphs

### Building Design Tools
- **Flexible Floor Configuration**: Adjustable floor count and height
- **Window Management**: Automated window placement and parameterization
- **Material System**: Customizable building colors and materials
- **Context Integration**: Import and work with 3D context models (.3dm format)

### Advanced Features
- **Sun Position Simulation**: Real-time shadow analysis with sun controller
- **Performance Optimization**: Efficient rendering and memory management
- **Theme System**: Dark/light mode with customizable color schemes
- **Export/Import**: Save and load building configurations
- **Keyboard Shortcuts**: Streamlined workflow with hotkeys

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/threejsEditor.git
cd threejsEditor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 🎮 Usage

### Basic Controls
- **Left Click**: Place building points or select elements
- **Right Click**: Complete building creation or cancel action
- **Mouse Wheel**: Zoom in/out
- **Middle Mouse Drag**: Pan the camera

### Keyboard Shortcuts

#### Drawing & Building
- **D**: Start/restart drawing building mode
- **U**: Undo last point while drawing
- **Escape**: Cancel current action or exit drawing mode
- **Ctrl + C**: Open building configuration panel

#### View & Display
- **G**: Toggle grid visibility
- **S**: Toggle snap to grid
- **F**: Toggle FPS counter
- **T**: Toggle theme (dark/light mode)
- **R**: Toggle sun controller for shadow analysis

#### File Operations
- **Ctrl + S**: Save current configuration
- **I**: Import configuration from file
- **Ctrl + E**: Export current scene

#### Utility
- **Delete** or **Backspace**: Clear all buildings
- **Ctrl + Shift + D**: Open theme color debugger

#### Dialog Controls
- **Enter**: Confirm action in dialogs (e.g., save configuration)
- **Escape**: Close dialogs or cancel actions

### Building Creation
1. Click the "Draw Building" tool in the left toolbar
2. Click on the ground plane to place building corners
3. Right-click to complete the building footprint
4. Use the configuration panel to adjust floors, height, and materials

### Design Exploration
- Access the design graph dialog to explore parametric variations
- Adjust building parameters and see real-time updates
- Export configurations for future use

## 🏗️ Architecture

### Core Systems
- **ThreeJSCore**: Central 3D engine management
- **CameraManager**: Camera controls and view management
- **SceneManager**: 3D scene organization and object management
- **LightingManager**: Dynamic lighting and shadow systems
- **EnvironmentManager**: Sky, ground, and atmosphere controls

### Services
- **BuildingService**: Building creation and modification logic
- **WindowService**: Automated window placement and styling
- **DesignExplorationService**: Parametric design analysis
- **DrawingService**: Interactive drawing tools and geometry creation

### Components
- **SimpleBuildingCreator**: Main application container
- **LeftToolbar/BottomToolbar**: Tool selection and controls
- **BuildingConfigPanel**: Building parameter configuration
- **SunController**: Solar analysis and shadow simulation

## 🎨 Theming

The application supports dynamic theming with CSS custom properties. Theme colors can be debugged and modified in real-time using the built-in theme debugger (Ctrl + Shift + D).

## 📦 Key Dependencies

- **React 18**: Modern React with hooks and concurrent features
- **Three.js**: 3D graphics and WebGL rendering
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool and development server
- **D3.js**: Data visualization for design graphs
- **Rhino3dm**: 3D model file format support
- **Lucide React**: Modern icon library

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

TBA

## 🙏 Acknowledgments

- Three.js community for excellent 3D graphics library
- React team for the robust UI framework
- Tailwind CSS for the utility-first styling approach
- All contributors and users of this project
