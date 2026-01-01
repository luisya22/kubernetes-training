# Kubernetes Training Application - Design Document

## Overview

The Kubernetes Training Application is a cross-platform desktop application that provides an interactive learning environment for developers to master Kubernetes from beginner to advanced levels. The application combines educational content with hands-on exercises, automated validation, and real-world microservice deployment scenarios.

The system architecture follows a modular design with clear separation between the UI layer, lesson content management, exercise validation engine, and Kubernetes/Docker interaction layer. This separation ensures maintainability and allows for easy extension of content and validation capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer (Electron)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Lesson     │  │   Exercise   │  │   Progress   │      │
│  │   Viewer     │  │   Interface  │  │   Dashboard  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Application Core Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Content    │  │  Validation  │  │   Progress   │      │
│  │   Manager    │  │    Engine    │  │   Tracker    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Kubernetes  │  │    Docker    │  │      OS      │      │
│  │   Client     │  │   Client     │  │   Adapter    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Electron + React for cross-platform desktop UI
- **Backend**: Node.js for application logic
- **Kubernetes Client**: Official Kubernetes JavaScript client (@kubernetes/client-node)
- **Docker Client**: Dockerode for Docker API interaction
- **Storage**: Local JSON files for progress tracking and content
- **Testing**: Jest for unit tests, property-based testing library for validation

## Components and Interfaces

### 1. Content Manager

Manages lesson content, exercise definitions, and sample microservices.

**Responsibilities:**
- Load and parse lesson content from structured files
- Provide lesson metadata and content to UI
- Manage exercise definitions and validation criteria
- Serve sample microservice code and Dockerfiles

**Interface:**
```typescript
interface ContentManager {
  getLessons(level: DifficultyLevel): Lesson[];
  getLesson(id: string): Lesson;
  getExercise(id: string): Exercise;
  getSampleMicroservice(id: string): Microservice;
}

interface Lesson {
  id: string;
  title: string;
  level: DifficultyLevel;
  content: string;
  concepts: string[];
  exercises: string[];
}

interface Exercise {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  steps: ExerciseStep[];
  validationCriteria: ValidationCriteria[];
}

interface ExerciseStep {
  id: string;
  instruction: string;
  expectedOutcome: string;
  hints: string[];
}
```

### 2. Validation Engine

Executes validation commands and verifies exercise completion.

**Responsibilities:**
- Execute kubectl commands to verify Kubernetes resources
- Execute Docker commands to verify image builds
- Make HTTP requests to validate deployed services
- Run test harness checks for comprehensive validation
- Adapt commands for different operating systems

**Interface:**
```typescript
interface ValidationEngine {
  validateStep(stepId: string, criteria: ValidationCriteria): Promise<ValidationResult>;
  validateKubernetesResource(resourceType: string, name: string, namespace: string): Promise<boolean>;
  validateDockerImage(imageName: string, expectedTags: string[]): Promise<boolean>;
  validateServiceEndpoint(url: string, expectedResponse: ExpectedResponse): Promise<boolean>;
  validateServiceCommunication(fromService: string, toService: string): Promise<boolean>;
}

interface ValidationCriteria {
  type: 'kubernetes' | 'docker' | 'http' | 'custom';
  checks: ValidationCheck[];
}

interface ValidationCheck {
  command?: string;
  expectedOutput?: string;
  httpRequest?: HttpRequestSpec;
  customValidator?: (context: any) => Promise<boolean>;
}

interface ValidationResult {
  success: boolean;
  message: string;
  details: string[];
  suggestions: string[];
}
```

### 3. Progress Tracker

Tracks learner progress through lessons and exercises.

**Responsibilities:**
- Record lesson and exercise completion
- Persist progress to local storage
- Determine which content is unlocked
- Provide progress statistics

**Interface:**
```typescript
interface ProgressTracker {
  recordCompletion(itemId: string, itemType: 'lesson' | 'exercise'): void;
  getProgress(): Progress;
  isUnlocked(itemId: string): boolean;
  resetProgress(scope: 'all' | 'exercise', itemId?: string): void;
}

interface Progress {
  completedLessons: string[];
  completedExercises: string[];
  currentLevel: DifficultyLevel;
  timestamps: Map<string, Date>;
}
```

### 4. Kubernetes Client

Wraps the Kubernetes API client for cluster interaction.

**Responsibilities:**
- Initialize connection to local Kubernetes cluster
- Execute kubectl-equivalent operations programmatically
- Query resource status and configuration
- Handle authentication and context switching

**Interface:**
```typescript
interface KubernetesClient {
  isClusterAvailable(): Promise<boolean>;
  getResource(type: string, name: string, namespace: string): Promise<any>;
  listResources(type: string, namespace?: string): Promise<any[]>;
  executeCommand(podName: string, namespace: string, command: string[]): Promise<string>;
}
```

### 5. Docker Client

Wraps Docker API for image and container operations.

**Responsibilities:**
- Build Docker images from Dockerfiles
- List and inspect images
- Stream build output to UI
- Verify image existence and properties

**Interface:**
```typescript
interface DockerClient {
  buildImage(contextPath: string, dockerfile: string, tag: string): Promise<BuildResult>;
  getImage(nameOrId: string): Promise<ImageInfo>;
  listImages(filters?: any): Promise<ImageInfo[]>;
  streamBuildOutput(buildStream: any, callback: (output: string) => void): Promise<void>;
}

interface BuildResult {
  success: boolean;
  imageId: string;
  output: string[];
}
```

### 6. OS Adapter

Adapts commands and paths for different operating systems.

**Responsibilities:**
- Detect current operating system
- Translate commands to OS-specific syntax
- Handle path separators and environment variables
- Provide OS-specific installation instructions

**Interface:**
```typescript
interface OSAdapter {
  getOS(): 'windows' | 'macos' | 'linux';
  adaptCommand(command: string): string;
  getInstallationInstructions(): string;
  getShellType(): 'cmd' | 'powershell' | 'bash' | 'zsh';
}
```

## Data Models

### Lesson Content Structure

Lessons are stored as structured JSON files with the following schema:

```typescript
interface LessonContent {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  concepts: string[];
  content: {
    introduction: string;
    sections: ContentSection[];
    summary: string;
  };
  exercises: string[];
  prerequisites: string[];
}

interface ContentSection {
  title: string;
  content: string;
  codeExamples?: CodeExample[];
  diagrams?: string[];
}

interface CodeExample {
  language: string;
  code: string;
  explanation: string;
}
```

### Exercise Definition Structure

```typescript
interface ExerciseDefinition {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: ExerciseStepDefinition[];
  resources: ExerciseResource[];
}

interface ExerciseStepDefinition {
  id: string;
  order: number;
  instruction: string;
  expectedOutcome: string;
  hints: string[];
  validation: ValidationCriteria;
}

interface ExerciseResource {
  type: 'microservice' | 'yaml' | 'dockerfile';
  name: string;
  content: string;
  path?: string;
}
```

### Sample Microservices

The application includes several sample microservices:

1. **hello-service**: Simple HTTP server returning "Hello World" (Node.js)
2. **counter-service**: Stateful service with persistent counter (Python + Redis)
3. **api-gateway**: Service that routes requests to other services (Go)
4. **data-processor**: Service that processes data from queue (Java)

Each microservice includes:
- Source code
- Dockerfile
- Kubernetes manifests (deployment, service, configmap)
- README with explanation

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, I've identified properties that can be combined and redundancies that can be eliminated. Many validation-related properties follow similar patterns and can be consolidated into more comprehensive properties.

### Property 1: Lesson content completeness
*For any* lesson that has code examples or diagrams defined in its content structure, the rendered lesson view should include those code examples and diagrams.
**Validates: Requirements 1.3**

### Property 2: Exercise unlocking
*For any* lesson, marking it as complete should unlock all associated exercises for that lesson.
**Validates: Requirements 1.4**

### Property 3: Exercise step display completeness
*For any* exercise, the UI should display instructions and expected outcomes for all defined steps.
**Validates: Requirements 2.1, 2.2**

### Property 4: Sequential step progression
*For any* exercise with multiple steps, completing step N should enable step N+1 and prevent access to step N+2.
**Validates: Requirements 2.3**

### Property 5: Hint availability
*For any* exercise step that has hints defined, requesting help should display all available hints for that step.
**Validates: Requirements 2.4**

### Property 6: Validation execution on completion
*For any* exercise step with validation criteria, marking it as complete should trigger execution of all validation checks.
**Validates: Requirements 3.1**

### Property 7: Validation success marking
*For any* validation that passes all checks, the corresponding step status should be marked as complete.
**Validates: Requirements 3.2**

### Property 8: Validation failure feedback
*For any* failed validation check, error messages should be displayed indicating which specific criteria failed.
**Validates: Requirements 3.3, 8.1, 8.2**

### Property 9: Exercise completion condition
*For any* exercise, if and only if all steps pass validation, the exercise should be marked as complete.
**Validates: Requirements 3.4**

### Property 10: OS-specific command adaptation
*For any* command and any detected operating system, the adapted command should use syntax appropriate for that OS's shell.
**Validates: Requirements 4.1, 4.4**

### Property 11: Progress persistence round-trip
*For any* progress state, saving it to storage and then loading it should restore an equivalent progress state with the same completed items and timestamps.
**Validates: Requirements 5.3**

### Property 12: Progress recording
*For any* completable item (lesson or exercise), marking it complete should create a progress record with a timestamp.
**Validates: Requirements 5.1**

### Property 13: Level unlocking
*For any* difficulty level, completing all exercises in that level should unlock the next difficulty level.
**Validates: Requirements 5.4, 7.5**

### Property 14: Lesson organization by difficulty
*For any* set of lessons, they should be organized into beginner, intermediate, and advanced groups with no lesson appearing in multiple groups.
**Validates: Requirements 7.1**

### Property 15: Validation retry execution
*For any* exercise step, retrying validation should re-execute all validation commands as if attempting for the first time.
**Validates: Requirements 8.4, 9.4**

### Property 16: Validation failure suggestions
*For any* validation failure, the system should provide at least one troubleshooting suggestion or common solution.
**Validates: Requirements 8.3**

### Property 17: Exercise reset clears completion
*For any* exercise, resetting it should clear its completion status and all step completion statuses while preserving the exercise definition.
**Validates: Requirements 9.1**

### Property 18: Progress reset preserves content
*For any* reset operation (exercise or full), lesson and exercise definitions should remain unchanged while completion timestamps are cleared.
**Validates: Requirements 9.3**

### Property 19: Microservice exercise resources
*For any* deployment exercise, it should include sample microservice source code and a Dockerfile.
**Validates: Requirements 10.1, 10.2**

### Property 20: Docker build validation
*For any* Docker build exercise, after building an image, the test harness should verify the image exists in the local registry with expected tags.
**Validates: Requirements 11.2, 11.3, 11.4**

### Property 21: Deployment pod verification
*For any* microservice deployment, the test harness should verify that all expected pods are in running state.
**Validates: Requirements 12.1**

### Property 22: Service accessibility verification
*For any* deployment with exposed services, the test harness should verify services are accessible via their endpoints.
**Validates: Requirements 12.2**

### Property 23: API endpoint validation
*For any* microservice with API endpoints, the test harness should execute HTTP requests and validate both response status codes and content match expectations.
**Validates: Requirements 12.3, 12.4**

### Property 24: API validation completion
*For any* deployment exercise, successful API validation should mark the exercise as complete.
**Validates: Requirements 12.5**

### Property 25: Comprehensive deployment validation
*For any* deployment validation, the test harness should check resource creation, configuration correctness, pod health, service connectivity, and resource limits.
**Validates: Requirements 13.1, 13.2, 13.3**

### Property 26: Validation failure reporting
*For any* test harness execution with failures, the report should identify which specific checks failed and provide reasons.
**Validates: Requirements 13.4**

### Property 27: Validation success summary
*For any* test harness execution where all checks pass, a summary of all validated components should be provided.
**Validates: Requirements 13.5**

### Property 28: Docker build output streaming
*For any* Docker build operation, the build command and real-time output should be displayed in the UI, and upon completion, the image ID and size should be shown.
**Validates: Requirements 14.1, 14.2, 14.3**

### Property 29: Docker build error highlighting
*For any* failed Docker build, errors in the build output should be highlighted in the UI.
**Validates: Requirements 14.4**

### Property 30: Exercise status indicators
*For any* exercise, the UI should display appropriate status indicators (completed, in-progress, or locked) based on its current state.
**Validates: Requirements 15.3**

### Property 31: Validation progress indication
*For any* validation command execution, progress indicators should be displayed in the UI during execution.
**Validates: Requirements 15.4**

### Property 32: Multi-service exercise composition
*For any* multi-service exercise, it should include at least two microservices with defined communication paths between them.
**Validates: Requirements 16.1**

### Property 33: Service-to-service communication validation
*For any* multi-service deployment, the test harness should verify that service A can successfully call service B's API and that DNS resolution works between services.
**Validates: Requirements 16.2, 16.3, 16.4**

### Property 34: Configuration resource validation
*For any* ConfigMap or Secret creation, the test harness should verify the resource exists, contains expected key-value pairs, and for Secrets, data is base64 encoded.
**Validates: Requirements 17.2, 17.3**

### Property 35: Configuration mounting validation
*For any* pod with mounted ConfigMaps or Secrets, the test harness should verify the pod can access the values via environment variables or volume mounts.
**Validates: Requirements 17.4, 17.5**

### Property 36: Storage persistence validation
*For any* pod with a mounted PersistentVolumeClaim, writing data to the volume then deleting and recreating the pod should preserve the data.
**Validates: Requirements 18.3, 18.4**

### Property 37: PVC binding verification
*For any* PersistentVolumeClaim creation, the test harness should verify the claim is bound to a volume.
**Validates: Requirements 18.2**

### Property 38: Namespace isolation
*For any* resource deployed to a namespace, the test harness should verify it is not accessible from other namespaces without explicit configuration.
**Validates: Requirements 19.3, 19.4**

### Property 39: Namespace existence verification
*For any* namespace creation, the test harness should verify the namespace exists in the cluster.
**Validates: Requirements 19.2**

### Property 40: Health probe configuration verification
*For any* pod with configured liveness or readiness probes, the test harness should verify the probes are defined in the pod specification.
**Validates: Requirements 20.2**

### Property 41: Readiness probe traffic control
*For any* pod with a readiness probe, the test harness should verify the pod only receives traffic when the probe succeeds.
**Validates: Requirements 20.3**

### Property 42: Liveness probe restart behavior
*For any* pod with a liveness probe, if the probe fails, Kubernetes should restart the container.
**Validates: Requirements 20.4**

### Property 43: Manual scaling verification
*For any* deployment scaling operation, the test harness should verify the actual number of running replicas matches the requested count.
**Validates: Requirements 21.2**

### Property 44: HPA resource verification
*For any* horizontal pod autoscaler configuration, the test harness should verify the HorizontalPodAutoscaler resource exists.
**Validates: Requirements 21.3**

### Property 45: Resource specification verification
*For any* pod with configured resource requests or limits, the test harness should verify the pod specification includes the correct CPU and memory values.
**Validates: Requirements 22.2, 22.3**

### Property 46: Resource-based scheduling
*For any* pod with resource requirements, the test harness should verify the pod is scheduled on a node that satisfies those requirements.
**Validates: Requirements 22.4**

## Error Handling

### Validation Errors

The system must handle various validation failure scenarios:

1. **Kubernetes Resource Not Found**: When a required resource doesn't exist
   - Display clear message indicating which resource is missing
   - Provide the expected resource name and namespace
   - Suggest kubectl commands to check resource status

2. **Docker Image Build Failures**: When image building fails
   - Stream full build output to UI
   - Highlight the specific error line
   - Suggest common fixes (missing dependencies, syntax errors in Dockerfile)

3. **API Endpoint Failures**: When service endpoints don't respond correctly
   - Display HTTP status code and response body
   - Check if service is running and pods are healthy
   - Verify service port configuration

4. **Service Communication Failures**: When services can't communicate
   - Verify DNS resolution between services
   - Check network policies
   - Validate service selectors match pod labels

### System Errors

1. **Kubernetes Cluster Unavailable**: When kubectl cannot connect
   - Detect if cluster is running
   - Provide OS-specific instructions to start cluster
   - Verify kubeconfig is properly configured

2. **Docker Daemon Unavailable**: When Docker is not running
   - Detect Docker installation
   - Provide OS-specific instructions to start Docker
   - Check Docker socket permissions

3. **File System Errors**: When reading/writing progress or content
   - Gracefully handle missing files
   - Create directories as needed
   - Provide clear error messages for permission issues

### Recovery Strategies

- **Automatic Retry**: For transient network errors, retry up to 3 times with exponential backoff
- **Graceful Degradation**: If validation fails, allow learner to continue but mark step as incomplete
- **State Recovery**: Persist progress frequently to prevent data loss
- **Rollback**: Allow learners to reset exercises to clean state

## Testing Strategy

### Unit Testing

Unit tests will verify individual components in isolation:

1. **Content Manager Tests**
   - Loading and parsing lesson content
   - Retrieving exercises by ID
   - Filtering lessons by difficulty level

2. **Progress Tracker Tests**
   - Recording completions
   - Checking unlock status
   - Resetting progress

3. **OS Adapter Tests**
   - OS detection
   - Command adaptation for different platforms
   - Path handling

4. **Validation Engine Tests**
   - Parsing validation criteria
   - Executing individual validation checks
   - Formatting error messages

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using **fast-check** (JavaScript property-based testing library). Each test will run a minimum of 100 iterations.

**Test Configuration:**
```typescript
import * as fc from 'fast-check';

// Configure to run 100 iterations minimum
const testConfig = { numRuns: 100 };
```

**Property Test Examples:**

1. **Progress Persistence Round-Trip** (Property 11)
   - Generate random progress states
   - Save and load each state
   - Verify loaded state equals original

2. **Exercise Completion Condition** (Property 9)
   - Generate random exercises with varying step counts
   - Mark random subsets of steps as complete
   - Verify exercise is complete if and only if all steps are complete

3. **OS Command Adaptation** (Property 10)
   - Generate random commands
   - For each OS type, verify adapted command uses correct syntax
   - Verify kubectl commands work on target OS

4. **Validation Execution** (Property 6)
   - Generate random exercise steps with validation criteria
   - Mark steps as complete
   - Verify validation is triggered for each

5. **Storage Persistence** (Property 36)
   - Generate random data
   - Write to volume, delete pod, recreate pod
   - Verify data persists

**Property Test Annotations:**
Each property-based test will be tagged with a comment referencing the design document:
```typescript
// **Feature: kubernetes-training-app, Property 11: Progress persistence round-trip**
test('progress round-trip preserves state', () => {
  fc.assert(fc.property(progressStateArbitrary, (state) => {
    const saved = saveProgress(state);
    const loaded = loadProgress(saved);
    return deepEqual(loaded, state);
  }), testConfig);
});
```

### Integration Testing

Integration tests will verify component interactions:

1. **End-to-End Exercise Flow**
   - Load lesson → complete lesson → unlock exercise → complete steps → validate → mark complete

2. **Docker Build and Deploy Flow**
   - Build image → verify image → deploy to Kubernetes → validate deployment → test API

3. **Multi-Service Communication**
   - Deploy service A → deploy service B → verify A can call B → verify DNS resolution

4. **Progress Persistence**
   - Complete exercises → close app → reopen app → verify progress restored

### Test Harness Validation

The test harness itself will be tested to ensure it correctly validates learner work:

1. **Positive Cases**: Verify test harness passes when conditions are met
2. **Negative Cases**: Verify test harness fails when conditions are not met
3. **Edge Cases**: Empty resources, missing labels, incorrect configurations

### Manual Testing

Manual testing will cover:
- UI/UX flows and visual design
- Cross-platform compatibility (Windows, macOS, Linux)
- Real Kubernetes cluster interactions
- Performance with large lesson sets

## Implementation Notes

### Cross-Platform Considerations

1. **Path Handling**: Use Node.js `path` module for cross-platform path operations
2. **Command Execution**: Use `child_process` with appropriate shell for each OS
3. **File Permissions**: Handle different permission models on Windows vs Unix
4. **Line Endings**: Normalize line endings in content files

### Performance Optimization

1. **Lazy Loading**: Load lesson content on-demand rather than all at once
2. **Caching**: Cache Kubernetes resource queries to reduce API calls
3. **Debouncing**: Debounce validation triggers to prevent excessive execution
4. **Streaming**: Stream Docker build output rather than buffering

### Security Considerations

1. **Command Injection**: Sanitize all user input before executing commands
2. **File Access**: Restrict file operations to application directory
3. **Kubernetes Access**: Use read-only service accounts where possible
4. **Secrets Handling**: Never log or display Secret values in plain text

### Extensibility

The system is designed for easy extension:

1. **New Lessons**: Add JSON files to content directory
2. **New Exercises**: Define in structured format with validation criteria
3. **New Microservices**: Add to samples directory with manifests
4. **Custom Validators**: Implement ValidationCheck interface for specialized validation
5. **New Difficulty Levels**: Add to enum and update UI accordingly

## Deployment and Distribution

The application will be packaged as a standalone desktop application using Electron:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` or `.deb` package

Prerequisites for learners:
- Docker Desktop (includes Kubernetes on Windows/macOS) or Minikube
- kubectl command-line tool
- 4GB RAM minimum, 8GB recommended
- 10GB free disk space

The application will include:
- All lesson content embedded
- Sample microservice code
- Kubernetes manifests
- Validation logic
- No external dependencies beyond Docker and kubectl
