# Kubernetes Training Lessons

This directory contains comprehensive lesson content for the Kubernetes Training Application, organized by difficulty level.

## Beginner Lessons (4 lessons)

1. **beginner-pods.json** - Introduction to Pods
   - Concepts: pods, containers, kubectl
   - Prerequisites: None

2. **beginner-deployments.json** - Deployments and ReplicaSets
   - Concepts: deployments, replicasets, scaling, rolling-updates
   - Prerequisites: beginner-pods

3. **beginner-services.json** - Services and Networking
   - Concepts: services, networking, service-types, endpoints
   - Prerequisites: beginner-deployments

4. **beginner-kubectl-basics.json** - kubectl Command Line Basics
   - Concepts: kubectl, cli, commands, debugging
   - Prerequisites: beginner-services

## Intermediate Lessons (7 lessons)

1. **intermediate-configmaps.json** - ConfigMaps and Configuration Management
   - Concepts: configmaps, configuration, environment-variables
   - Prerequisites: beginner-pods

2. **intermediate-secrets.json** - Secrets and Sensitive Data Management
   - Concepts: secrets, security, sensitive-data, encryption
   - Prerequisites: intermediate-configmaps

3. **intermediate-volumes.json** - Persistent Volumes and Storage
   - Concepts: persistent-volumes, persistent-volume-claims, storage, stateful-apps
   - Prerequisites: intermediate-configmaps

4. **intermediate-namespaces.json** - Namespaces and Resource Organization
   - Concepts: namespaces, resource-organization, multi-tenancy, isolation
   - Prerequisites: intermediate-secrets

5. **intermediate-resource-limits.json** - Resource Requests and Limits
   - Concepts: resource-management, requests, limits, qos
   - Prerequisites: intermediate-namespaces

6. **intermediate-health-checks.json** - Health Checks and Probes
   - Concepts: liveness-probes, readiness-probes, startup-probes, health-checks
   - Prerequisites: intermediate-resource-limits

7. **intermediate-hpa.json** - Horizontal Pod Autoscaling
   - Concepts: autoscaling, hpa, metrics, scaling-policies
   - Prerequisites: intermediate-health-checks

## Advanced Lessons (7 lessons)

1. **advanced-operators.json** - Kubernetes Operators and Custom Resources
   - Concepts: operators, custom-resources, crds
   - Prerequisites: intermediate-configmaps

2. **advanced-statefulsets.json** - StatefulSets for Stateful Applications
   - Concepts: statefulsets, stateful-apps, persistent-identity, ordered-deployment
   - Prerequisites: intermediate-volumes, intermediate-hpa

3. **advanced-daemonsets.json** - DaemonSets for Node-Level Services
   - Concepts: daemonsets, node-agents, system-services, node-selectors
   - Prerequisites: advanced-statefulsets

4. **advanced-ingress.json** - Ingress Controllers and HTTP Routing
   - Concepts: ingress, http-routing, tls, load-balancing
   - Prerequisites: advanced-daemonsets

5. **advanced-network-policies.json** - Network Policies and Security
   - Concepts: network-policies, security, pod-isolation, traffic-control
   - Prerequisites: advanced-ingress

6. **advanced-rbac.json** - Role-Based Access Control (RBAC)
   - Concepts: rbac, security, authorization, service-accounts
   - Prerequisites: advanced-network-policies

7. **advanced-crds.json** - Custom Resource Definitions (CRDs)
   - Concepts: crds, custom-resources, api-extensions, controllers
   - Prerequisites: advanced-operators

## Content Structure

Each lesson file follows this JSON structure:

```json
{
  "id": "lesson-id",
  "title": "Lesson Title",
  "level": "beginner|intermediate|advanced",
  "order": 1,
  "concepts": ["concept1", "concept2"],
  "content": {
    "introduction": "Introduction text",
    "sections": [
      {
        "title": "Section Title",
        "content": "Section content",
        "codeExamples": [
          {
            "language": "yaml|bash|go",
            "code": "code content",
            "explanation": "explanation"
          }
        ],
        "diagrams": ["diagram-file.png"]
      }
    ],
    "summary": "Summary text"
  },
  "exercises": ["exercise-id"],
  "prerequisites": ["prerequisite-lesson-id"]
}
```

## Coverage

The lessons cover all topics specified in Requirements 7.2, 7.3, and 7.4:

### Beginner Topics ✓
- Pods
- Deployments
- Services
- kubectl basics

### Intermediate Topics ✓
- ConfigMaps
- Secrets
- Persistent Volumes
- Namespaces
- Resource Limits
- Health Checks
- Horizontal Pod Autoscaling (HPA)

### Advanced Topics ✓
- StatefulSets
- DaemonSets
- Ingress Controllers
- Network Policies
- RBAC
- Operators
- Custom Resource Definitions (CRDs)
