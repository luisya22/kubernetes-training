import * as k8s from '@kubernetes/client-node';

/**
 * KubernetesClient wraps the Kubernetes API client for cluster interaction.
 * Handles connection initialization, authentication, and resource queries.
 */
export class KubernetesClient {
  private kc: k8s.KubeConfig;
  private k8sApi: k8s.CoreV1Api;
  private appsApi: k8s.AppsV1Api;
  private batchApi: k8s.BatchV1Api;
  private networkingApi: k8s.NetworkingV1Api;
  private autoscalingApi: k8s.AutoscalingV2Api;
  private exec: k8s.Exec;

  constructor() {
    this.kc = new k8s.KubeConfig();
    
    // Load configuration from default location (~/.kube/config)
    // This handles authentication and context automatically
    try {
      this.kc.loadFromDefault();
      console.log('Kubeconfig loaded successfully');
      console.log('Current context:', this.kc.getCurrentContext());
      console.log('Available contexts:', this.kc.getContexts().map(c => c.name));
    } catch (error) {
      // If loading fails, we'll handle it in isClusterAvailable
      console.error('Failed to load kubeconfig:', error);
    }

    // Initialize API clients
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.batchApi = this.kc.makeApiClient(k8s.BatchV1Api);
    this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
    this.autoscalingApi = this.kc.makeApiClient(k8s.AutoscalingV2Api);
    this.exec = new k8s.Exec(this.kc);
  }

  /**
   * Check if the Kubernetes cluster is available and accessible.
   * Validates: Requirements 6.1, 6.3, 6.4
   */
  async isClusterAvailable(): Promise<boolean> {
    try {
      // Try to list namespaces as a simple health check
      // This verifies both cluster availability and authentication
      await this.k8sApi.listNamespace();
      return true;
    } catch (error) {
      console.error('Cluster availability check failed:', error);
      return false;
    }
  }

  /**
   * Get a specific Kubernetes resource by type, name, and namespace.
   * Validates: Requirements 6.3
   * 
   * @param type - Resource type (e.g., 'pod', 'deployment', 'service', 'configmap', 'secret', 'pvc', 'hpa')
   * @param name - Resource name
   * @param namespace - Kubernetes namespace
   * @returns The resource object or null if not found
   */
  async getResource(type: string, name: string, namespace: string): Promise<any> {
    try {
      const resourceType = type.toLowerCase();
      
      switch (resourceType) {
        case 'pod':
          const podResponse = await this.k8sApi.readNamespacedPod(name, namespace);
          return podResponse.body;
        
        case 'deployment':
          const deploymentResponse = await this.appsApi.readNamespacedDeployment(name, namespace);
          return deploymentResponse.body;
        
        case 'service':
          const serviceResponse = await this.k8sApi.readNamespacedService(name, namespace);
          return serviceResponse.body;
        
        case 'configmap':
          const configMapResponse = await this.k8sApi.readNamespacedConfigMap(name, namespace);
          return configMapResponse.body;
        
        case 'secret':
          const secretResponse = await this.k8sApi.readNamespacedSecret(name, namespace);
          return secretResponse.body;
        
        case 'persistentvolumeclaim':
        case 'pvc':
          const pvcResponse = await this.k8sApi.readNamespacedPersistentVolumeClaim(name, namespace);
          return pvcResponse.body;
        
        case 'namespace':
          const namespaceResponse = await this.k8sApi.readNamespace(name);
          return namespaceResponse.body;
        
        case 'horizontalpodautoscaler':
        case 'hpa':
          const hpaResponse = await this.autoscalingApi.readNamespacedHorizontalPodAutoscaler(name, namespace);
          return hpaResponse.body;
        
        case 'statefulset':
          const statefulSetResponse = await this.appsApi.readNamespacedStatefulSet(name, namespace);
          return statefulSetResponse.body;
        
        case 'daemonset':
          const daemonSetResponse = await this.appsApi.readNamespacedDaemonSet(name, namespace);
          return daemonSetResponse.body;
        
        case 'job':
          const jobResponse = await this.batchApi.readNamespacedJob(name, namespace);
          return jobResponse.body;
        
        case 'ingress':
          const ingressResponse = await this.networkingApi.readNamespacedIngress(name, namespace);
          return ingressResponse.body;
        
        default:
          throw new Error(`Unsupported resource type: ${type}`);
      }
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List Kubernetes resources by type and optionally by namespace.
   * Validates: Requirements 6.3
   * 
   * @param type - Resource type (e.g., 'pod', 'deployment', 'service')
   * @param namespace - Optional namespace filter. If not provided, lists across all namespaces
   * @returns Array of resource objects
   */
  async listResources(type: string, namespace?: string): Promise<any[]> {
    try {
      const resourceType = type.toLowerCase();
      
      switch (resourceType) {
        case 'pod':
          if (namespace) {
            const response = await this.k8sApi.listNamespacedPod(namespace);
            return response.body.items;
          } else {
            const response = await this.k8sApi.listPodForAllNamespaces();
            return response.body.items;
          }
        
        case 'deployment':
          if (namespace) {
            const response = await this.appsApi.listNamespacedDeployment(namespace);
            return response.body.items;
          } else {
            const response = await this.appsApi.listDeploymentForAllNamespaces();
            return response.body.items;
          }
        
        case 'service':
          if (namespace) {
            const response = await this.k8sApi.listNamespacedService(namespace);
            return response.body.items;
          } else {
            const response = await this.k8sApi.listServiceForAllNamespaces();
            return response.body.items;
          }
        
        case 'configmap':
          if (namespace) {
            const response = await this.k8sApi.listNamespacedConfigMap(namespace);
            return response.body.items;
          } else {
            const response = await this.k8sApi.listConfigMapForAllNamespaces();
            return response.body.items;
          }
        
        case 'secret':
          if (namespace) {
            const response = await this.k8sApi.listNamespacedSecret(namespace);
            return response.body.items;
          } else {
            const response = await this.k8sApi.listSecretForAllNamespaces();
            return response.body.items;
          }
        
        case 'persistentvolumeclaim':
        case 'pvc':
          if (namespace) {
            const response = await this.k8sApi.listNamespacedPersistentVolumeClaim(namespace);
            return response.body.items;
          } else {
            const response = await this.k8sApi.listPersistentVolumeClaimForAllNamespaces();
            return response.body.items;
          }
        
        case 'namespace':
          const namespaceResponse = await this.k8sApi.listNamespace();
          return namespaceResponse.body.items;
        
        case 'horizontalpodautoscaler':
        case 'hpa':
          if (namespace) {
            const response = await this.autoscalingApi.listNamespacedHorizontalPodAutoscaler(namespace);
            return response.body.items;
          } else {
            const response = await this.autoscalingApi.listHorizontalPodAutoscalerForAllNamespaces();
            return response.body.items;
          }
        
        case 'statefulset':
          if (namespace) {
            const response = await this.appsApi.listNamespacedStatefulSet(namespace);
            return response.body.items;
          } else {
            const response = await this.appsApi.listStatefulSetForAllNamespaces();
            return response.body.items;
          }
        
        case 'daemonset':
          if (namespace) {
            const response = await this.appsApi.listNamespacedDaemonSet(namespace);
            return response.body.items;
          } else {
            const response = await this.appsApi.listDaemonSetForAllNamespaces();
            return response.body.items;
          }
        
        case 'job':
          if (namespace) {
            const response = await this.batchApi.listNamespacedJob(namespace);
            return response.body.items;
          } else {
            const response = await this.batchApi.listJobForAllNamespaces();
            return response.body.items;
          }
        
        case 'ingress':
          if (namespace) {
            const response = await this.networkingApi.listNamespacedIngress(namespace);
            return response.body.items;
          } else {
            const response = await this.networkingApi.listIngressForAllNamespaces();
            return response.body.items;
          }
        
        default:
          throw new Error(`Unsupported resource type: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to list resources of type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Execute a command in a running pod.
   * 
   * @param podName - Name of the pod
   * @param namespace - Kubernetes namespace
   * @param command - Command to execute as an array of strings
   * @returns Command output as a string
   */
  async executeCommand(podName: string, namespace: string, command: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      this.exec.exec(
        namespace,
        podName,
        '',  // container name (empty string means first container)
        command,
        process.stdout,
        process.stderr,
        process.stdin,
        false,  // tty
        (status) => {
          if (status.status === 'Success') {
            resolve(output);
          } else {
            reject(new Error(`Command failed: ${errorOutput}`));
          }
        }
      ).then((conn) => {
        conn.on('data', (data) => {
          output += data.toString();
        });
        conn.on('error', (data) => {
          errorOutput += data.toString();
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /**
   * Get the current Kubernetes context name.
   * Validates: Requirements 6.4
   */
  getCurrentContext(): string {
    return this.kc.getCurrentContext();
  }

  /**
   * Get all available contexts from kubeconfig.
   * Validates: Requirements 6.4
   */
  getContexts(): k8s.Context[] {
    return this.kc.getContexts();
  }

  /**
   * Switch to a different Kubernetes context.
   * Validates: Requirements 6.4
   */
  setCurrentContext(contextName: string): void {
    this.kc.setCurrentContext(contextName);
    
    // Reinitialize API clients with new context
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.batchApi = this.kc.makeApiClient(k8s.BatchV1Api);
    this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
    this.autoscalingApi = this.kc.makeApiClient(k8s.AutoscalingV2Api);
    this.exec = new k8s.Exec(this.kc);
  }
}
