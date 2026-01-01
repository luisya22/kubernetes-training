// Mock for @kubernetes/client-node to avoid ES module issues in Jest

export class KubeConfig {
  loadFromDefault() {}
  getCurrentContext() {
    return 'default';
  }
  getContexts() {
    return [{ name: 'default' }];
  }
  setCurrentContext(context: string) {}
  makeApiClient(apiClientType: any) {
    return {};
  }
}

export class CoreV1Api {
  listNamespacedPod() {
    return Promise.resolve({ body: { items: [] } });
  }
  readNamespacedPod() {
    return Promise.resolve({ body: {} });
  }
  listNamespacedService() {
    return Promise.resolve({ body: { items: [] } });
  }
  readNamespacedService() {
    return Promise.resolve({ body: {} });
  }
}

export class AppsV1Api {
  listNamespacedDeployment() {
    return Promise.resolve({ body: { items: [] } });
  }
  readNamespacedDeployment() {
    return Promise.resolve({ body: {} });
  }
}

export class Exec {
  exec() {
    return Promise.resolve();
  }
}
