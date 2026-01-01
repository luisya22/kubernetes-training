# kubectl Command Cheat Sheet

## Quick Reference Guide for Kubernetes Command Line

---

## Basic Commands

### Cluster Information
```bash
kubectl cluster-info                    # Display cluster info
kubectl version                         # Show kubectl and cluster version
kubectl config view                     # Show kubeconfig settings
kubectl config current-context          # Display current context
kubectl config use-context <context>    # Switch to a different context
```

### Getting Resources
```bash
kubectl get nodes                       # List all nodes
kubectl get pods                        # List pods in current namespace
kubectl get pods -A                     # List pods in all namespaces
kubectl get pods -o wide                # List pods with more details
kubectl get deployments                 # List deployments
kubectl get services                    # List services
kubectl get all                         # List all resources
```

---

## Working with Pods

### Creating and Managing Pods
```bash
kubectl run <name> --image=<image>      # Create a pod
kubectl apply -f pod.yaml               # Create pod from YAML file
kubectl delete pod <name>               # Delete a pod
kubectl delete -f pod.yaml              # Delete pod using YAML file
```

### Inspecting Pods
```bash
kubectl describe pod <name>             # Show detailed pod info
kubectl logs <pod-name>                 # View pod logs
kubectl logs -f <pod-name>              # Follow pod logs (stream)
kubectl logs <pod> -c <container>       # Logs from specific container
kubectl logs --previous <pod>           # Logs from previous instance
```

### Interacting with Pods
```bash
kubectl exec -it <pod> -- /bin/bash     # Execute shell in pod
kubectl exec <pod> -- <command>         # Execute command in pod
kubectl port-forward <pod> 8080:80      # Forward local port to pod
kubectl cp <pod>:/path /local/path      # Copy files from pod
kubectl cp /local/path <pod>:/path      # Copy files to pod
```

---

## Working with Deployments

### Creating and Managing Deployments
```bash
kubectl create deployment <name> --image=<image>    # Create deployment
kubectl apply -f deployment.yaml                    # Create from YAML
kubectl delete deployment <name>                    # Delete deployment
kubectl rollout restart deployment <name>           # Restart deployment
```

### Scaling
```bash
kubectl scale deployment <name> --replicas=3        # Scale to 3 replicas
kubectl autoscale deployment <name> --min=2 --max=10 --cpu-percent=80
```

### Rollouts and Updates
```bash
kubectl set image deployment/<name> <container>=<image>:<tag>
kubectl rollout status deployment/<name>            # Check rollout status
kubectl rollout history deployment/<name>           # View rollout history
kubectl rollout undo deployment/<name>              # Rollback to previous
kubectl rollout undo deployment/<name> --to-revision=2  # Rollback to specific
```

---

## Working with Services

### Creating Services
```bash
kubectl expose deployment <name> --port=80 --type=ClusterIP
kubectl expose deployment <name> --port=80 --type=NodePort
kubectl expose deployment <name> --port=80 --type=LoadBalancer
kubectl apply -f service.yaml                       # Create from YAML
```

### Inspecting Services
```bash
kubectl get services                                # List all services
kubectl describe service <name>                     # Service details
kubectl get endpoints <service>                     # Show service endpoints
```

---

## Namespaces

```bash
kubectl get namespaces                              # List all namespaces
kubectl create namespace <name>                     # Create namespace
kubectl delete namespace <name>                     # Delete namespace
kubectl get pods -n <namespace>                     # List pods in namespace
kubectl config set-context --current --namespace=<name>  # Set default namespace
```

---

## ConfigMaps and Secrets

### ConfigMaps
```bash
kubectl create configmap <name> --from-literal=key=value
kubectl create configmap <name> --from-file=config.txt
kubectl get configmaps                              # List ConfigMaps
kubectl describe configmap <name>                   # ConfigMap details
kubectl delete configmap <name>                     # Delete ConfigMap
```

### Secrets
```bash
kubectl create secret generic <name> --from-literal=password=secret
kubectl create secret generic <name> --from-file=./secret.txt
kubectl get secrets                                 # List secrets
kubectl describe secret <name>                      # Secret details (no values)
kubectl get secret <name> -o yaml                   # View secret (base64)
```

---

## Debugging and Troubleshooting

### Describe and Logs
```bash
kubectl describe <resource> <name>                  # Detailed resource info
kubectl logs <pod>                                  # View pod logs
kubectl logs <pod> --all-containers                 # Logs from all containers
kubectl logs -l app=myapp                           # Logs from labeled pods
```

### Events and Status
```bash
kubectl get events                                  # List cluster events
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl top nodes                                   # Node resource usage
kubectl top pods                                    # Pod resource usage
```

### Debugging Pods
```bash
kubectl run debug --image=busybox -it --rm -- sh    # Temporary debug pod
kubectl debug <pod> -it --image=busybox             # Debug existing pod
kubectl attach <pod> -it                            # Attach to running pod
```

---

## Resource Management

### Editing Resources
```bash
kubectl edit <resource> <name>                      # Edit resource in editor
kubectl patch <resource> <name> -p '{"spec":{"replicas":3}}'
kubectl replace -f <file.yaml>                      # Replace resource
```

### Labels and Selectors
```bash
kubectl label pods <pod> env=prod                   # Add label
kubectl label pods <pod> env-                       # Remove label
kubectl get pods -l env=prod                        # Filter by label
kubectl get pods -l 'env in (prod,dev)'             # Multiple values
```

### Annotations
```bash
kubectl annotate pods <pod> description="My pod"    # Add annotation
kubectl annotate pods <pod> description-            # Remove annotation
```

---

## Advanced Commands

### Apply and Diff
```bash
kubectl apply -f <file.yaml>                        # Apply configuration
kubectl apply -f <directory>/                       # Apply all in directory
kubectl diff -f <file.yaml>                         # Show diff before apply
kubectl apply -f <file.yaml> --dry-run=client       # Dry run (client-side)
kubectl apply -f <file.yaml> --dry-run=server       # Dry run (server-side)
```

### Resource Quotas and Limits
```bash
kubectl describe resourcequota -n <namespace>       # View quotas
kubectl describe limitrange -n <namespace>          # View limits
```

### RBAC
```bash
kubectl auth can-i create pods                      # Check permissions
kubectl auth can-i delete deployments --as=user     # Check as another user
kubectl get roles                                   # List roles
kubectl get rolebindings                            # List role bindings
kubectl describe role <name>                        # Role details
```

---

## Output Formatting

```bash
kubectl get pods -o wide                            # Additional columns
kubectl get pods -o yaml                            # YAML format
kubectl get pods -o json                            # JSON format
kubectl get pods -o name                            # Just names
kubectl get pods -o jsonpath='{.items[*].metadata.name}'  # JSONPath
kubectl get pods --sort-by=.metadata.creationTimestamp    # Sort output
kubectl get pods --field-selector=status.phase=Running    # Filter by field
```

---

## Useful Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
alias kga='kubectl get all'
alias kdp='kubectl describe pod'
alias kds='kubectl describe service'
alias kdd='kubectl describe deployment'
alias kl='kubectl logs'
alias klf='kubectl logs -f'
alias kex='kubectl exec -it'
alias kaf='kubectl apply -f'
alias kdel='kubectl delete'
```

---

## Tips and Tricks

1. **Use tab completion**: Enable kubectl completion for your shell
   ```bash
   source <(kubectl completion bash)  # For bash
   source <(kubectl completion zsh)   # For zsh
   ```

2. **Watch resources**: Use `-w` or `--watch` to monitor changes
   ```bash
   kubectl get pods --watch
   ```

3. **Multiple resources**: Operate on multiple resource types
   ```bash
   kubectl get pods,services,deployments
   ```

4. **All namespaces**: Use `-A` or `--all-namespaces`
   ```bash
   kubectl get pods -A
   ```

5. **Context switching**: Quickly switch between clusters
   ```bash
   kubectl config get-contexts
   kubectl config use-context <context-name>
   ```

6. **Explain resources**: Get documentation for any resource
   ```bash
   kubectl explain pods
   kubectl explain pods.spec.containers
   ```

---

## Common Patterns

### Create a deployment and expose it
```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=LoadBalancer
```

### Scale and update
```bash
kubectl scale deployment nginx --replicas=3
kubectl set image deployment/nginx nginx=nginx:1.19
```

### Debug a failing pod
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>
```

### Clean up resources
```bash
kubectl delete deployment <name>
kubectl delete service <name>
kubectl delete all -l app=myapp
```

---

**Remember**: Always check the official Kubernetes documentation for the most up-to-date information!

**Quick Help**: Use `kubectl <command> --help` for detailed help on any command.
