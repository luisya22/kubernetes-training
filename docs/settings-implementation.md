# Settings and Configuration Implementation

## Overview

Task 27 has been completed, adding comprehensive configuration and settings functionality to the Kubernetes Training Application. This implementation satisfies Requirement 6.4 for cluster configuration.

## Components Implemented

### 1. Settings UI Component (`src/renderer/components/Settings.tsx`)

A comprehensive settings interface that allows users to configure:

- **Kubernetes Configuration**
  - Kubernetes Context: Specify which kubectl context to use (defaults to current context)
  
- **Docker Configuration**
  - Docker Host: Configure Docker daemon connection string
  
- **Validation Configuration**
  - Validation Timeout: Set maximum time (in milliseconds) for validation commands
  - Range: 1000ms to 300000ms (1 second to 5 minutes)
  - Default: 30000ms (30 seconds)
  
- **Appearance Settings**
  - Theme: Toggle between Light and Dark themes
  - Theme changes apply immediately to the entire application
  
- **Advanced Settings**
  - Debug Mode: Enable detailed logging and error messages for troubleshooting

### 2. Configuration Service (`src/services/ConfigService.ts`)

A service that manages application configuration with:

- **Persistence**: Saves configuration to `data/config.json`
- **Default Values**: Provides sensible defaults when no config exists
- **Type Safety**: Uses TypeScript interfaces for configuration
- **Methods**:
  - `getConfig()`: Get entire configuration
  - `updateConfig(updates)`: Update multiple settings at once
  - `getValidationTimeout()` / `setValidationTimeout(timeout)`: Manage timeout
  - `getTheme()` / `setTheme(theme)`: Manage theme
  - `getDebugMode()` / `setDebugMode(enabled)`: Manage debug mode
  - `getKubernetesContext()` / `setKubernetesContext(context)`: Manage k8s context
  - `getDockerHost()` / `setDockerHost(host)`: Manage Docker host

### 3. Theme Support (`src/renderer/styles.css`)

Added comprehensive theme support with CSS variables:

- **Light Theme** (default):
  - Clean, bright interface
  - High contrast for readability
  
- **Dark Theme**:
  - Reduced eye strain in low-light environments
  - Consistent color scheme across all components

Theme variables include:
- Background colors (primary, secondary, tertiary)
- Text colors (primary, secondary, tertiary)
- Border colors
- Accent colors
- Success/warning/error colors
- Code block styling
- Shadow effects

### 4. Integration with Validation Engine

Updated `ValidationEngine` to use configurable timeout:

- Accepts `ConfigService` in constructor
- Uses `configService.getValidationTimeout()` for all HTTP requests
- Replaces hardcoded 10-second timeouts with user-configurable values
- Allows users to adjust timeout based on their environment

### 5. Application Integration (`src/renderer/App.tsx`)

- Added Settings view to main navigation
- Initialized `ConfigService` and passed to components
- Applied theme on application mount
- Settings accessible via navigation bar

## User Experience

### Accessing Settings

1. Click "Settings" button in the main navigation bar
2. Settings panel opens with all configuration options
3. Make desired changes
4. Click "Save Changes" to persist configuration
5. Click "Reset" to discard changes
6. Click "Close" to return to main application

### Theme Switching

- Select theme from dropdown in Appearance section
- Theme applies immediately upon saving
- Theme persists across application restarts
- All UI components respect theme colors

### Validation Timeout

- Adjust timeout based on cluster performance
- Useful for slow networks or resource-constrained environments
- Prevents premature timeout failures
- Default 30 seconds works for most scenarios

### Debug Mode

- Enable for detailed logging
- Helpful for troubleshooting issues
- Shows additional error information
- Can be toggled on/off as needed

## Testing

### Unit Tests

Created comprehensive test suites:

1. **Settings Component Tests** (`src/renderer/components/__tests__/Settings.test.tsx`)
   - Renders all settings sections
   - Displays current configuration values
   - Shows save button when changes are made
   - Saves configuration changes correctly
   - Resets changes when reset button clicked
   - Calls onClose callback
   - Handles Kubernetes context configuration
   - Handles Docker host configuration

2. **ConfigService Tests** (`src/services/__tests__/ConfigService.test.ts`)
   - Returns default configuration
   - Gets and sets validation timeout
   - Gets and sets theme
   - Gets and sets debug mode
   - Gets and sets Kubernetes context
   - Gets and sets Docker host
   - Updates multiple config values at once
   - Persists configuration to disk
   - Loads existing configuration
   - Handles corrupted config files gracefully

## Configuration File Format

Configuration is stored in `data/config.json`:

```json
{
  "validationTimeout": 30000,
  "debugMode": false,
  "theme": "light",
  "kubernetesContext": "minikube",
  "dockerHost": "unix:///var/run/docker.sock"
}
```

## Requirements Satisfied

✅ **Requirement 6.4**: "WHEN the Training Application verifies the Kubernetes cluster THEN the Training Application SHALL confirm the cluster is running and accessible"

The settings implementation allows users to:
- Configure which Kubernetes context to use
- Set Docker host for container operations
- Adjust validation timeouts for different environments
- Enable debug mode for troubleshooting cluster issues

## Future Enhancements

Potential improvements for future iterations:

1. **Additional Themes**: Add more theme options (high contrast, colorblind-friendly)
2. **Export/Import Config**: Allow users to share configurations
3. **Validation Profiles**: Preset timeout configurations for different scenarios
4. **Advanced Kubernetes Options**: Configure namespaces, service accounts, etc.
5. **Logging Configuration**: Control log levels and output destinations
6. **Keyboard Shortcuts**: Add hotkeys for common settings

## Technical Notes

- Configuration service is singleton-like (created once in App.tsx)
- Theme changes use CSS custom properties for instant updates
- All settings persist immediately upon save
- Settings UI uses inline styles for theme-aware rendering
- ConfigService handles file I/O errors gracefully
- ValidationEngine timeout is configurable but has sensible defaults
