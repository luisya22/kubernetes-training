/**
 * Mock KubernetesClient for testing
 */
export class KubernetesClient {
  async isClusterAvailable(): Promise<boolean> {
    return false;
  }

  async getResource(type: string, name: string, namespace: string): Promise<any> {
    return null;
  }

  async listResources(type: string, namespace?: string): Promise<any[]> {
    return [];
  }

  async executeCommand(podName: string, namespace: string, command: string[]): Promise<string> {
    return '';
  }

  getCurrentContext(): string {
    return 'mock-context';
  }

  getContexts(): any[] {
    return [];
  }

  setCurrentContext(contextName: string): void {
    // Mock implementation
  }
}
