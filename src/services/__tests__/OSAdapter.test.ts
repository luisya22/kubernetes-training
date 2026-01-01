import * as fc from 'fast-check';
import { OSAdapter, OSType } from '../OSAdapter';

describe('OSAdapter', () => {
  let adapter: OSAdapter;

  beforeEach(() => {
    adapter = new OSAdapter();
  });

  describe('Basic functionality', () => {
    test('getOS returns valid OS type', () => {
      const os = adapter.getOS();
      expect(['windows', 'macos', 'linux']).toContain(os);
    });

    test('getShellType returns valid shell type', () => {
      const shell = adapter.getShellType();
      expect(['cmd', 'powershell', 'bash', 'zsh']).toContain(shell);
    });

    test('getInstallationInstructions returns non-empty string', () => {
      const instructions = adapter.getInstallationInstructions();
      expect(instructions.length).toBeGreaterThan(0);
    });

    test('getPathSeparator returns correct separator', () => {
      const separator = adapter.getPathSeparator();
      const os = adapter.getOS();
      if (os === 'windows') {
        expect(separator).toBe('\\');
      } else {
        expect(separator).toBe('/');
      }
    });
  });

  describe('Property-Based Tests', () => {
    // **Feature: kubernetes-training-app, Property 10: OS-specific command adaptation**
    // **Validates: Requirements 4.1, 4.4**
    test('Property 10: adapted commands use OS-appropriate syntax', () => {
      // Create a mock adapter that we can control the OS for
      class TestableOSAdapter extends OSAdapter {
        private mockOS: OSType | null = null;

        setMockOS(os: OSType) {
          this.mockOS = os;
        }

        getOS(): OSType {
          return this.mockOS || super.getOS();
        }
      }

      const testAdapter = new TestableOSAdapter();

      // Test with kubectl commands
      const kubectlCommands = fc.array(
        fc.constantFrom(
          'kubectl get pods',
          'kubectl apply -f deployment.yaml',
          'kubectl describe service my-service',
          'kubectl logs pod-name',
          'kubectl exec -it pod-name -- /bin/bash'
        ),
        { minLength: 1, maxLength: 5 }
      );

      fc.assert(
        fc.property(kubectlCommands, (commands) => {
          // Test for each OS type
          const osTypes: OSType[] = ['windows', 'macos', 'linux'];
          
          for (const os of osTypes) {
            testAdapter.setMockOS(os);
            
            for (const command of commands) {
              const adapted = testAdapter.adaptCommand(command);
              
              // Property: adapted command should be appropriate for the OS
              if (os === 'windows') {
                // Windows should use kubectl.exe for kubectl commands
                if (command.startsWith('kubectl ')) {
                  expect(adapted).toContain('kubectl.exe');
                }
              } else {
                // Unix systems should keep kubectl as-is
                if (command.startsWith('kubectl ')) {
                  expect(adapted).toContain('kubectl');
                }
              }
              
              // Property: adapted command should not be empty
              expect(adapted.length).toBeGreaterThan(0);
            }
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('Property 10: environment variable syntax is OS-specific', () => {
      class TestableOSAdapter extends OSAdapter {
        private mockOS: OSType | null = null;

        setMockOS(os: OSType) {
          this.mockOS = os;
        }

        getOS(): OSType {
          return this.mockOS || super.getOS();
        }
      }

      const testAdapter = new TestableOSAdapter();

      // Generate commands with environment variables
      const envVarCommands = fc.array(
        fc.constantFrom(
          'echo $HOME',
          'echo $PATH',
          'echo $USER',
          'kubectl get pods -n $NAMESPACE'
        ),
        { minLength: 1, maxLength: 5 }
      );

      fc.assert(
        fc.property(envVarCommands, (commands) => {
          const osTypes: OSType[] = ['windows', 'macos', 'linux'];
          
          for (const os of osTypes) {
            testAdapter.setMockOS(os);
            const shell = testAdapter.getShellType();
            
            for (const command of commands) {
              const adapted = testAdapter.adaptCommand(command);
              
              // Property: Windows PowerShell should use $env: syntax
              if (os === 'windows' && shell === 'powershell') {
                if (command.includes('$HOME')) {
                  expect(adapted).toContain('$env:HOME');
                }
                if (command.includes('$PATH')) {
                  expect(adapted).toContain('$env:PATH');
                }
                if (command.includes('$USER')) {
                  expect(adapted).toContain('$env:USER');
                }
                if (command.includes('$NAMESPACE')) {
                  expect(adapted).toContain('$env:NAMESPACE');
                }
              }
              
              // Property: Unix systems should preserve $ syntax
              if (os === 'macos' || os === 'linux') {
                if (command.includes('$HOME')) {
                  expect(adapted).toContain('$HOME');
                }
              }
            }
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('Property 10: path adaptation preserves path structure', () => {
      // Generate various path strings
      const paths = fc.array(
        fc.constantFrom(
          'src/services/OSAdapter.ts',
          'content/lessons/beginner',
          'dist/main/main.js',
          'node_modules/react/index.js'
        ),
        { minLength: 1, maxLength: 5 }
      );

      fc.assert(
        fc.property(paths, (pathList) => {
          for (const path of pathList) {
            const adapted = adapter.adaptPath(path);
            
            // Property: adapted path should have same number of segments
            const originalSegments = path.split(/[\/\\]/).filter(s => s.length > 0);
            const adaptedSegments = adapted.split(/[\/\\]/).filter(s => s.length > 0);
            expect(adaptedSegments.length).toBe(originalSegments.length);
            
            // Property: adapted path should contain same segment names
            for (let i = 0; i < originalSegments.length; i++) {
              expect(adaptedSegments[i]).toBe(originalSegments[i]);
            }
            
            // Property: adapted path should use OS-specific separator
            const separator = adapter.getPathSeparator();
            if (adapted.includes('/') || adapted.includes('\\')) {
              expect(adapted).toContain(separator);
            }
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('Property 10: command adaptation is idempotent for non-special commands', () => {
      // Generate simple commands without special syntax
      const simpleCommands = fc.array(
        fc.constantFrom(
          'kubectl get pods',
          'kubectl get services',
          'kubectl get deployments'
        ),
        { minLength: 1, maxLength: 3 }
      );

      fc.assert(
        fc.property(simpleCommands, (commands) => {
          for (const command of commands) {
            const adapted1 = adapter.adaptCommand(command);
            const adapted2 = adapter.adaptCommand(adapted1);
            
            // Property: adapting twice should give same result as adapting once
            // (for commands that don't have special characters that get transformed)
            expect(adapted2).toBe(adapted1);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    test('handles empty command', () => {
      const result = adapter.adaptCommand('');
      expect(result).toBe('');
    });

    test('handles command with URLs', () => {
      const command = 'curl http://example.com/api/v1/resource';
      const result = adapter.adaptCommand(command);
      // URLs should not have their slashes converted
      expect(result).toContain('http://');
    });

    test('handles empty path', () => {
      const result = adapter.adaptPath('');
      expect(result).toBe('');
    });
  });
});
