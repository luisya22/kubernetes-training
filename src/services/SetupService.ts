import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { KubernetesClient } from './KubernetesClient';
import { OSAdapter } from './OSAdapter';

const execAsync = promisify(exec);

export interface SetupStatus {
  kubectlInstalled: boolean;
  clusterAvailable: boolean;
  setupCompleted: boolean;
  kubectlVersion?: string;
  clusterInfo?: string;
  error?: string;
}

export class SetupService {
  private setupFilePath: string;
  private osAdapter: OSAdapter;
  private kubernetesClient: KubernetesClient;

  constructor(setupFilePath?: string) {
    const dataDir = path.join(__dirname, '../../data');
    this.setupFilePath = setupFilePath || path.join(dataDir, 'setup.json');
    this.osAdapter = new OSAdapter();
    this.kubernetesClient = new KubernetesClient();
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Check if setup has been completed previously
   */
  isSetupCompleted(): boolean {
    try {
      if (fs.existsSync(this.setupFilePath)) {
        const data = fs.readFileSync(this.setupFilePath, 'utf-8');
        const setup = JSON.parse(data);
        return setup.setupCompleted === true;
      }
    } catch (error) {
      console.error('Error reading setup status:', error);
    }
    return false;
  }

  /**
   * Mark setup as completed
   */
  markSetupCompleted(): void {
    try {
      const setup = {
        setupCompleted: true,
        completedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.setupFilePath, JSON.stringify(setup, null, 2));
    } catch (error) {
      console.error('Error saving setup status:', error);
    }
  }

  /**
   * Check if kubectl is installed
   */
  async checkKubectlInstalled(): Promise<{ installed: boolean; version?: string; error?: string }> {
    try {
      const os = this.osAdapter.getOS();
      const kubectlCommand = os === 'windows' ? 'kubectl.exe version --client' : 'kubectl version --client';
      
      const { stdout } = await execAsync(kubectlCommand, { timeout: 5000 });
      
      // Extract version from output
      const versionMatch = stdout.match(/Client Version: v([0-9.]+)/);
      const version = versionMatch ? versionMatch[1] : undefined;
      
      return { installed: true, version };
    } catch (error: any) {
      return { 
        installed: false, 
        error: error.message || 'kubectl not found. Please install kubectl first.' 
      };
    }
  }

  /**
   * Check if Kubernetes cluster is available
   */
  async checkClusterAvailable(): Promise<{ available: boolean; info?: string; error?: string }> {
    try {
      const available = await this.kubernetesClient.isClusterAvailable();
      
      if (available) {
        try {
          const context = this.kubernetesClient.getCurrentContext();
          return { available: true, info: context || 'Cluster connected' };
        } catch (error) {
          return { available: true, info: 'Cluster connected' };
        }
      }
      
      return { 
        available: false, 
        error: 'Kubernetes cluster is not available. Please ensure a cluster is running and accessible.' 
      };
    } catch (error: any) {
      return { 
        available: false, 
        error: error.message || 'Unable to connect to Kubernetes cluster.' 
      };
    }
  }

  /**
   * Run full setup check
   */
  async runSetupCheck(): Promise<SetupStatus> {
    const kubectlCheck = await this.checkKubectlInstalled();
    const clusterCheck = await this.checkClusterAvailable();
    
    return {
      kubectlInstalled: kubectlCheck.installed,
      clusterAvailable: clusterCheck.available,
      setupCompleted: kubectlCheck.installed && clusterCheck.available,
      kubectlVersion: kubectlCheck.version,
      clusterInfo: clusterCheck.info,
      error: kubectlCheck.error || clusterCheck.error
    };
  }

  /**
   * Get OS-specific installation instructions
   */
  getInstallationInstructions(): string {
    return this.osAdapter.getInstallationInstructions();
  }

  /**
   * Get OS type
   */
  getOS(): string {
    return this.osAdapter.getOS();
  }
}

