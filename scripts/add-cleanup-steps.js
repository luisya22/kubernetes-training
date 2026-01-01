#!/usr/bin/env node

/**
 * Script to add cleanup steps to exercises that don't have them
 */

const fs = require('fs');
const path = require('path');

const exercisesDir = path.join(__dirname, '..', 'content', 'exercises');

// Define cleanup steps for each exercise
const cleanupSteps = {
  'exercise-create-deployment': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the deployment. This will also delete all pods created by the deployment.',
    expectedOutcome: 'Deployment and its pods should be deleted successfully',
    hints: [
      'Use: kubectl delete deployment web-app',
      'Wait a few seconds for the deletion to complete',
      'Verify deletion: kubectl get deployments',
      'All pods created by the deployment will also be deleted'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get deployment web-app 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-create-service': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the service and deployment to free up cluster resources.',
    expectedOutcome: 'Service and deployment should be deleted successfully',
    hints: [
      'Delete the service: kubectl delete service echo-service',
      'Delete the deployment: kubectl delete deployment echo-server',
      'Verify deletion: kubectl get services,deployments',
      'Always clean up resources after exercises to keep your cluster tidy'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get service echo-service 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        },
        {
          command: 'kubectl get deployment echo-server 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-kubectl-basics': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the test pod.',
    expectedOutcome: 'Pod should be deleted successfully',
    hints: [
      'Use: kubectl delete pod test-pod',
      'Verify deletion: kubectl get pods'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get pod test-pod 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-namespaces': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting both namespaces. This will also delete all resources within them.',
    expectedOutcome: 'Both namespaces and their resources should be deleted',
    hints: [
      'Delete namespaces: kubectl delete namespace development production',
      'Deleting a namespace automatically deletes all resources within it',
      'Verify deletion: kubectl get namespaces',
      'This may take a few moments as Kubernetes cleans up all resources'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get namespace development 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        },
        {
          command: 'kubectl get namespace production 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-configmap': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the ConfigMap and any pods using it.',
    expectedOutcome: 'ConfigMap and pods should be deleted',
    hints: [
      'Delete the ConfigMap: kubectl delete configmap app-config',
      'Delete any pods: kubectl delete pod --all',
      'Verify: kubectl get configmaps,pods'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get configmap app-config 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-secrets': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the Secret and any pods using it.',
    expectedOutcome: 'Secret and pods should be deleted',
    hints: [
      'Delete the Secret: kubectl delete secret db-credentials',
      'Delete any pods: kubectl delete pod --all',
      'Verify: kubectl get secrets,pods'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get secret db-credentials 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-volumes': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the pod and PersistentVolumeClaim.',
    expectedOutcome: 'Pod and PVC should be deleted',
    hints: [
      'Delete the pod first: kubectl delete pod data-pod',
      'Delete the PVC: kubectl delete pvc data-pvc',
      'Verify: kubectl get pods,pvc'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get pvc data-pvc 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-health-checks': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the deployment with health checks.',
    expectedOutcome: 'Deployment should be deleted',
    hints: [
      'Delete the deployment: kubectl delete deployment healthy-app',
      'Verify: kubectl get deployments'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get deployment healthy-app 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-hpa': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the HorizontalPodAutoscaler and deployment.',
    expectedOutcome: 'HPA and deployment should be deleted',
    hints: [
      'Delete the HPA: kubectl delete hpa php-apache',
      'Delete the deployment: kubectl delete deployment php-apache',
      'Verify: kubectl get hpa,deployments'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get hpa php-apache 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-ingress': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the Ingress, Service, and Deployment.',
    expectedOutcome: 'All resources should be deleted',
    hints: [
      'Delete the Ingress: kubectl delete ingress web-ingress',
      'Delete the Service: kubectl delete service web-service',
      'Delete the Deployment: kubectl delete deployment web-app',
      'Verify: kubectl get ingress,services,deployments'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get ingress web-ingress 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-rbac': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the Role, RoleBinding, and ServiceAccount.',
    expectedOutcome: 'All RBAC resources should be deleted',
    hints: [
      'Delete the RoleBinding: kubectl delete rolebinding pod-reader-binding',
      'Delete the Role: kubectl delete role pod-reader',
      'Delete the ServiceAccount: kubectl delete serviceaccount pod-reader-sa',
      'Verify: kubectl get roles,rolebindings,serviceaccounts'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get role pod-reader 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-network-policies': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the NetworkPolicy and test pods.',
    expectedOutcome: 'NetworkPolicy and pods should be deleted',
    hints: [
      'Delete the NetworkPolicy: kubectl delete networkpolicy deny-all',
      'Delete test pods: kubectl delete pod --all',
      'Verify: kubectl get networkpolicies,pods'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get networkpolicy deny-all 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-statefulsets': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the StatefulSet and its associated resources.',
    expectedOutcome: 'StatefulSet should be deleted',
    hints: [
      'Delete the StatefulSet: kubectl delete statefulset web',
      'Delete the Service: kubectl delete service nginx',
      'Note: PVCs may need to be deleted separately if you want to remove all data',
      'Verify: kubectl get statefulsets,services'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get statefulset web 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-daemonsets': {
    id: 'step-2',
    order: 2,
    instruction: 'Clean up by deleting the DaemonSet.',
    expectedOutcome: 'DaemonSet should be deleted',
    hints: [
      'Delete the DaemonSet: kubectl delete daemonset node-exporter',
      'This will remove the pod from all nodes',
      'Verify: kubectl get daemonsets'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get daemonset node-exporter 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-resource-limits': {
    id: 'step-2',
    order: 2,
    instruction: 'Clean up by deleting the pod with resource limits.',
    expectedOutcome: 'Pod should be deleted',
    hints: [
      'Delete the pod: kubectl delete pod limited-pod',
      'Verify: kubectl get pods'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get pod limited-pod 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-crds': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the custom resource and CRD.',
    expectedOutcome: 'Custom resource and CRD should be deleted',
    hints: [
      'Delete custom resources first: kubectl delete crontab my-cron',
      'Delete the CRD: kubectl delete crd crontabs.stable.example.com',
      'Verify: kubectl get crds'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get crd crontabs.stable.example.com 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  },
  'exercise-operators': {
    id: 'step-3',
    order: 3,
    instruction: 'Clean up by deleting the operator and its resources.',
    expectedOutcome: 'Operator resources should be deleted',
    hints: [
      'Delete custom resources first',
      'Delete the operator deployment',
      'Delete CRDs last',
      'Verify: kubectl get all,crds'
    ],
    validation: {
      type: 'kubernetes',
      checks: [
        {
          command: 'kubectl get deployment sample-operator 2>&1 | grep -q "NotFound" && echo "deleted" || echo "exists"',
          expectedOutput: 'deleted'
        }
      ]
    }
  }
};

// Process each exercise file
const files = fs.readdirSync(exercisesDir).filter(f => f.endsWith('.json') && f !== '.gitkeep');

let updatedCount = 0;
let skippedCount = 0;

files.forEach(file => {
  const filePath = path.join(exercisesDir, file);
  const exerciseId = file.replace('.json', '');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exercise = JSON.parse(content);
    
    // Skip if already has cleanup (check last step for cleanup keywords)
    const lastStep = exercise.steps[exercise.steps.length - 1];
    if (lastStep && (
      lastStep.instruction.toLowerCase().includes('clean') ||
      lastStep.instruction.toLowerCase().includes('delete')
    )) {
      console.log(`✓ ${file} - Already has cleanup step`);
      skippedCount++;
      return;
    }
    
    // Skip deploy-microservice as it has 4 steps and is more complex
    if (exerciseId === 'exercise-deploy-microservice') {
      console.log(`⊘ ${file} - Skipped (complex exercise)`);
      skippedCount++;
      return;
    }
    
    // Add cleanup step if defined
    if (cleanupSteps[exerciseId]) {
      exercise.steps.push(cleanupSteps[exerciseId]);
      fs.writeFileSync(filePath, JSON.stringify(exercise, null, 2) + '\n');
      console.log(`✓ ${file} - Added cleanup step`);
      updatedCount++;
    } else {
      console.log(`⊘ ${file} - No cleanup step defined`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`✗ ${file} - Error: ${error.message}`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`Updated: ${updatedCount}`);
console.log(`Skipped: ${skippedCount}`);
console.log(`Total: ${files.length}`);
