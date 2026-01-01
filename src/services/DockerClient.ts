import Docker from 'dockerode';
import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar-stream';
import { BuildResult, ImageInfo } from '../types';

export class DockerClient {
  private docker: Docker;

  constructor(dockerOptions?: Docker.DockerOptions) {
    // Initialize Dockerode client with optional configuration
    this.docker = new Docker(dockerOptions);
  }

  /**
   * Build a Docker image from a context directory
   * @param contextPath - Path to the build context directory
   * @param dockerfile - Path to the Dockerfile (relative to context or absolute)
   * @param tag - Tag for the built image
   * @returns BuildResult with success status, image ID, and build output
   */
  async buildImage(contextPath: string, dockerfile: string, tag: string): Promise<BuildResult> {
    try {
      const output: string[] = [];

      // Create a tar stream from the context directory
      const tarStream = await this.createTarStream(contextPath, dockerfile);

      // Build the image
      const stream = await this.docker.buildImage(tarStream, {
        t: tag,
        dockerfile: path.basename(dockerfile)
      });

      // Stream and collect build output
      await this.streamBuildOutput(stream, (line) => {
        output.push(line);
      });

      // Get the built image to extract its ID
      const image = await this.getImage(tag);
      
      if (!image) {
        return {
          success: false,
          imageId: '',
          output
        };
      }

      return {
        success: true,
        imageId: image.id,
        output
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        imageId: '',
        output: [`Error building image: ${errorMessage}`]
      };
    }
  }

  /**
   * Get information about a specific Docker image
   * @param nameOrId - Image name or ID
   * @returns ImageInfo or null if not found
   */
  async getImage(nameOrId: string): Promise<ImageInfo | null> {
    try {
      const image = this.docker.getImage(nameOrId);
      const info = await image.inspect();

      return {
        id: info.Id,
        tags: info.RepoTags || [],
        size: info.Size,
        created: new Date(info.Created)
      };
    } catch (error) {
      // Image not found or other error
      return null;
    }
  }

  /**
   * List Docker images with optional filters
   * @param filters - Optional filters for listing images
   * @returns Array of ImageInfo
   */
  async listImages(filters?: any): Promise<ImageInfo[]> {
    try {
      const images = await this.docker.listImages({ filters });
      
      return images.map(img => ({
        id: img.Id,
        tags: img.RepoTags || [],
        size: img.Size,
        created: new Date(img.Created * 1000) // Docker returns Unix timestamp in seconds
      }));
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }

  /**
   * Stream Docker build output and invoke callback for each line
   * @param buildStream - Docker build stream
   * @param callback - Function to call with each output line
   */
  async streamBuildOutput(buildStream: any, callback: (output: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(
        buildStream,
        (err: Error | null, result: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
        (event: any) => {
          // Parse and format the build output
          if (event.stream) {
            callback(event.stream.trim());
          } else if (event.status) {
            callback(event.status);
          } else if (event.error) {
            callback(`ERROR: ${event.error}`);
          }
        }
      );
    });
  }

  /**
   * Create a tar stream from a directory for Docker build context
   * @param contextPath - Path to the build context directory
   * @param dockerfile - Path to the Dockerfile
   * @returns Readable stream containing the tar archive
   */
  private async createTarStream(contextPath: string, dockerfile: string): Promise<NodeJS.ReadableStream> {
    const pack = tar.pack();
    const files = await this.getAllFiles(contextPath);

    for (const file of files) {
      const filePath = path.join(contextPath, file);
      const stat = await fs.promises.stat(filePath);
      const content = await fs.promises.readFile(filePath);

      pack.entry(
        {
          name: file,
          size: stat.size,
          mode: stat.mode
        },
        content
      );
    }

    pack.finalize();
    return pack;
  }

  /**
   * Recursively get all files in a directory
   * @param dir - Directory path
   * @param baseDir - Base directory for relative paths
   * @returns Array of relative file paths
   */
  private async getAllFiles(dir: string, baseDir: string = dir): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other common directories
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        const subFiles = await this.getAllFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else {
        const relativePath = path.relative(baseDir, fullPath);
        files.push(relativePath);
      }
    }

    return files;
  }
}
