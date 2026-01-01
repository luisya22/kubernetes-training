import process from "process";

export type OSType = 'windows' | 'macos' | 'linux';
export type ShellType = 'cmd' | 'powershell' | 'bash' | 'zsh';

export class OSAdapter {
  getOS(): OSType {
    const platform = process.platform;
    if (platform === 'win32') return 'windows';
    if (platform === 'darwin') return 'macos';
    return 'linux';
  }

  adaptCommand(command: string): string {
    const os = this.getOS();
    
    // First adapt environment variables if on Windows
    if (os === 'windows') {
      const shell = this.getShellType();
      if (shell === 'powershell') {
        command = command.replace(/\$([A-Z_][A-Z0-9_]*)/g, '$env:$1');
      } else if (shell === 'cmd') {
        command = command.replace(/\$([A-Z_][A-Z0-9_]*)/g, '%$1%');
      }
    }
    
    // Handle kubectl commands with OS-specific adaptations
    if (command.includes('kubectl')) {
      command = this.adaptKubectlCommand(command, os);
    }
    
    // Handle path separators (but not for kubectl commands or URLs)
    if (os === 'windows' && !command.includes('kubectl')) {
      // Convert forward slashes to backslashes for Windows paths
      // But preserve URLs
      if (!command.includes('http://') && !command.includes('https://')) {
        command = command.replace(/\/([a-zA-Z])/g, '\\$1');
      }
    }
    
    return command;
  }

  private adaptKubectlCommand(command: string, os: OSType): string {
    // kubectl commands work the same across platforms, but we need to ensure
    // the executable name is correct and paths are adapted
    if (os === 'windows') {
      // Ensure kubectl.exe is used on Windows if not already specified
      if (command.startsWith('kubectl ') && !command.startsWith('kubectl.exe')) {
        command = command.replace(/^kubectl /, 'kubectl.exe ');
      }
    }
    
    return command;
  }

  getInstallationInstructions(): string {
    const os = this.getOS();
    
    switch (os) {
      case 'windows':
        return `
# Kubernetes Installation Instructions for Windows

## Option 1: Docker Desktop (Recommended)
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Open Docker Desktop settings
4. Navigate to "Kubernetes" tab
5. Check "Enable Kubernetes"
6. Click "Apply & Restart"

## Option 2: Minikube
1. Install Chocolatey package manager: https://chocolatey.org/install
2. Run in PowerShell (as Administrator):
   choco install minikube
3. Start Minikube:
   minikube start

## Verify Installation
Run in PowerShell:
kubectl version --client
kubectl cluster-info
        `.trim();
        
      case 'macos':
        return `
# Kubernetes Installation Instructions for macOS

## Option 1: Docker Desktop (Recommended)
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Open Docker Desktop preferences
4. Navigate to "Kubernetes" tab
5. Check "Enable Kubernetes"
6. Click "Apply & Restart"

## Option 2: Minikube with Homebrew
1. Install Homebrew if not already installed: https://brew.sh
2. Run in Terminal:
   brew install minikube
3. Start Minikube:
   minikube start

## Verify Installation
Run in Terminal:
kubectl version --client
kubectl cluster-info
        `.trim();
        
      case 'linux':
        return `
# Kubernetes Installation Instructions for Linux

## Option 1: Minikube (Recommended)
1. Download and install Minikube:
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
2. Start Minikube:
   minikube start

## Option 2: Docker Desktop (Ubuntu)
1. Follow instructions at: https://docs.docker.com/desktop/install/linux-install/
2. Enable Kubernetes in Docker Desktop settings

## Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

## Verify Installation
kubectl version --client
kubectl cluster-info
        `.trim();
    }
  }

  getShellType(): ShellType {
    const os = this.getOS();
    
    if (os === 'windows') {
      // Check if PowerShell is available (most modern Windows systems)
      // Default to PowerShell as it's more powerful
      return 'powershell';
    }
    
    // For macOS and Linux, check SHELL environment variable
    const shell = process.env.SHELL || '';
    if (shell.includes('zsh')) {
      return 'zsh';
    }
    
    return 'bash';
  }

  getPathSeparator(): string {
    return this.getOS() === 'windows' ? '\\' : '/';
  }

  adaptPath(path: string): string {
    const separator = this.getPathSeparator();
    // Replace all path separators with the OS-specific one
    return path.replace(/[\/\\]/g, separator);
  }
}
