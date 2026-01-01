# Kubernetes Training Application

An interactive desktop application for learning Kubernetes from beginner to advanced levels.

## Features

- Interactive lessons with hands-on exercises
- Automated validation of exercise completion
- Cross-platform support (Windows, macOS, Linux)
- Sample microservices for deployment practice
- Progress tracking and level unlocking

## Prerequisites

- Node.js 18+ and npm
- Docker Desktop (includes Kubernetes) or Minikube
- kubectl command-line tool
- 4GB RAM minimum, 8GB recommended
- 10GB free disk space

## Installation

### For End Users (Download Pre-built Installers)

**[🌐 Visit Download Page](https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/)**

Or download directly from GitHub:

**[📦 Download Latest Release](https://github.com/luisya22/kubernetes-training/releases/latest)**

Available for:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` for Intel and Apple Silicon
- **Linux**: `.AppImage` (universal) or `.deb` (Debian/Ubuntu)

### For Developers (Build from Source)

```bash
npm install
```

## Development

```bash
# Start development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# Build for production
npm run build

# Package for current platform
npm run package

# Package for specific platforms
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux

# Package for all platforms
npm run package:all
```

Built installers will be in the `release/` directory.

For detailed packaging instructions, see [docs/building-and-packaging.md](docs/building-and-packaging.md).

## Distribution

The application can be distributed as:
- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` disk image (Intel and Apple Silicon)
- **Linux**: `.AppImage` (universal) or `.deb` (Debian/Ubuntu)

See [docs/release-checklist.md](docs/release-checklist.md) for the complete release process.

## Project Structure

```
├── src/
│   ├── main/              # Electron main process
│   ├── renderer/          # React UI components
│   │   └── components/    # UI components
│   ├── services/          # Core business logic
│   └── types/             # TypeScript type definitions
├── content/
│   ├── lessons/           # Lesson content files
│   ├── exercises/         # Exercise definitions
│   └── microservices/     # Sample microservice code
└── dist/                  # Build output
```

## Testing

The project uses Jest for unit testing and fast-check for property-based testing.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Creating Releases

See [RELEASE.md](RELEASE.md) for instructions on creating new releases.

## License

MIT
