import { KubernetesClient } from './KubernetesClient';
import { DockerClient } from './DockerClient';

export interface SystemHealth {
  kubernetes: {
    available: boolean;
    error?: string;
  };
  docker: {
    available: boolean;
    error?: string;
  };
  overall: boolean;
}

/**
 * SystemHealthCheck provides utilities to check the availability
 * of required system components (Kubernetes, Docker)
 */
export class SystemHealthCheck {
  private kubernetesClient: KubernetesClient;
  private dockerClient: DockerClient;
  private lastCheck: SystemHealth | null = null;
  private lastCheckTime: number = 0;
  private cacheDuration: number = 30000; // 30 seconds

  constructor(kubernetesClient?: KubernetesClient, dockerClient?: DockerClient) {
    this.kubernetesClient = kubernetesClient || new KubernetesClient();
    this.dockerClient = dockerClient || new DockerClient();
  }

  /**
   * Check the health of all system components
   * Results are cached for 30 seconds to avoid excessive checks
   */
  async checkHealth(forceRefresh: boolean = false): Promise<SystemHealth> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (!forceRefresh && this.lastCheck && (now - this.lastCheckTime) < this.cacheDuration) {
      return this.lastCheck;
    }

    const health: SystemHealth = {
      kubernetes: { available: false },
      docker: { available: false },
      overall: false
    };

    // Check Kubernetes
    try {
      health.kubernetes.available = await this.kubernetesClient.isClusterAvailable();
    } catch (error) {
      health.kubernetes.available = false;
      health.kubernetes.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check Docker
    try {
      await this.dockerClient.listImages();
      health.docker.available = true;
    } catch (error) {
      health.docker.available = false;
      health.docker.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Overall health is true if at least one system is available
    health.overall = health.kubernetes.available || health.docker.available;

    // Cache the result
    this.lastCheck = health;
    this.lastCheckTime = now;

    return health;
  }

  /**
   * Check only Kubernetes availability
   */
  async checkKubernetes(): Promise<boolean> {
    try {
      return await this.kubernetesClient.isClusterAvailable();
    } catch (error) {
      console.error('Kubernetes health check failed:', error);
      return false;
    }
  }

  /**
   * Check only Docker availability
   */
  async checkDocker(): Promise<boolean> {
    try {
      await this.dockerClient.listImages();
      return true;
    } catch (error) {
      console.error('Docker health check failed:', error);
      return false;
    }
  }

  /**
   * Get the last cached health check result
   */
  getLastCheck(): SystemHealth | null {
    return this.lastCheck;
  }

  /**
   * Clear the health check cache
   */
  clearCache(): void {
    this.lastCheck = null;
    this.lastCheckTime = 0;
  }

  /**
   * Get suggestions for fixing system health issues
   */
  getHealthSuggestions(health: SystemHealth): string[] {
    const suggestions: string[] = [];

    if (!health.kubernetes.available) {
      suggestions.push('Kubernetes cluster is not available:');
      suggestions.push('  • Start your cluster (minikube start, docker-desktop, etc.)');
      suggestions.push('  • Verify: kubectl cluster-info');
      suggestions.push('  • Check kubeconfig: kubectl config view');
    }

    if (!health.docker.available) {
      suggestions.push('Docker is not available:');
      suggestions.push('  • Start Docker Desktop or Docker daemon');
      suggestions.push('  • Verify: docker ps');
      suggestions.push('  • Check Docker daemon status');
    }

    if (!health.overall) {
      suggestions.push('');
      suggestions.push('The application requires at least one of Kubernetes or Docker to be running.');
      suggestions.push('Some features may be unavailable until these services are started.');
    }

    return suggestions;
  }
}
