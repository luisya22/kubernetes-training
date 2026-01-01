import React, { useState, useEffect, useRef } from 'react';
import { BuildResult, ImageInfo } from '../../types';

interface DockerBuildInterfaceProps {
  contextPath: string;
  dockerfile: string;
  tag: string;
  dockerClient?: any;
  onBuildComplete?: (result: BuildResult) => void;
}

const DockerBuildInterface: React.FC<DockerBuildInterfaceProps> = ({
  contextPath,
  dockerfile,
  tag,
  dockerClient,
  onBuildComplete
}) => {
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildOutput, setBuildOutput] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [buildCommand, setBuildCommand] = useState<string>('');
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate the build command display
    const cmd = `docker build -t ${tag} -f ${dockerfile} ${contextPath}`;
    setBuildCommand(cmd);
  }, [contextPath, dockerfile, tag]);

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (outputEndRef.current && outputEndRef.current.scrollIntoView) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [buildOutput]);

  const handleBuildTrigger = async () => {
    if (!dockerClient || isBuilding) return;

    setIsBuilding(true);
    setBuildOutput([]);
    setBuildResult(null);
    setImageInfo(null);

    try {
      // Use the dockerClient's buildImage method directly
      const result = await dockerClient.buildImage(contextPath, dockerfile, tag);
      
      setBuildOutput(result.output);
      setBuildResult(result);
      
      // If build was successful, fetch image info to get size
      if (result.success && result.imageId && dockerClient.getImage) {
        try {
          const info = await dockerClient.getImage(tag);
          if (info) {
            setImageInfo(info);
          }
        } catch (err) {
          // If we can't get image info, continue without it
          console.warn('Could not fetch image info:', err);
        }
      }
      
      if (onBuildComplete) {
        onBuildComplete(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = [`ERROR: ${errorMessage}`];
      
      const result: BuildResult = {
        success: false,
        imageId: '',
        output: errorOutput
      };

      setBuildOutput(errorOutput);
      setBuildResult(result);
      
      if (onBuildComplete) {
        onBuildComplete(result);
      }
    } finally {
      setIsBuilding(false);
    }
  };

  const isErrorLine = (line: string): boolean => {
    return line.toLowerCase().includes('error') || 
           line.startsWith('ERROR:') ||
           line.includes('failed') ||
           line.includes('FAILED');
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="docker-build-interface" style={{ padding: '20px' }}>
      <h3>Docker Build</h3>

      {/* Build Command Display */}
      <div
        className="build-command"
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
      >
        <strong>Build Command:</strong>
        <div style={{ marginTop: '8px', color: '#333' }}>
          {buildCommand}
        </div>
      </div>

      {/* Build Trigger Button */}
      <button
        onClick={handleBuildTrigger}
        disabled={isBuilding || !dockerClient}
        style={{
          padding: '12px 24px',
          backgroundColor: isBuilding ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isBuilding || !dockerClient ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {isBuilding ? 'Building...' : 'Build Image'}
      </button>

      {/* Build Output Streaming Display */}
      {buildOutput.length > 0 && (
        <div
          className="build-output"
          style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            border: '1px solid #333',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '13px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          <strong style={{ color: '#4CAF50', display: 'block', marginBottom: '10px' }}>
            Build Output:
          </strong>
          {buildOutput.map((line, index) => (
            <div
              key={index}
              className={isErrorLine(line) ? 'error-line' : 'output-line'}
              style={{
                padding: '2px 0',
                color: isErrorLine(line) ? '#f44336' : '#d4d4d4',
                backgroundColor: isErrorLine(line) ? '#3d1f1f' : 'transparent',
                fontWeight: isErrorLine(line) ? 'bold' : 'normal'
              }}
            >
              {line}
            </div>
          ))}
          <div ref={outputEndRef} />
        </div>
      )}

      {/* Build Completion Summary */}
      {buildResult && !isBuilding && (
        <div
          className="build-result"
          style={{
            padding: '20px',
            backgroundColor: buildResult.success ? '#e8f5e9' : '#ffebee',
            border: `2px solid ${buildResult.success ? '#4CAF50' : '#f44336'}`,
            borderRadius: '8px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}
          >
            <span style={{ fontSize: '32px' }}>
              {buildResult.success ? '✓' : '✗'}
            </span>
            <h4
              style={{
                margin: 0,
                color: buildResult.success ? '#2e7d32' : '#c62828',
                fontSize: '20px'
              }}
            >
              {buildResult.success ? 'Build Successful' : 'Build Failed'}
            </h4>
          </div>

          {buildResult.success && buildResult.imageId && (
            <div style={{ marginTop: '15px' }}>
              <div
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <strong>Image ID:</strong>
                <div
                  style={{
                    marginTop: '5px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#333',
                    wordBreak: 'break-all'
                  }}
                >
                  {buildResult.imageId}
                </div>
              </div>

              {imageInfo && (
                <div
                  style={{
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <strong>Image Size:</strong>
                  <div
                    style={{
                      marginTop: '5px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      color: '#333'
                    }}
                  >
                    {formatSize(imageInfo.size)}
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <strong>Tag:</strong>
                <div
                  style={{
                    marginTop: '5px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#333'
                  }}
                >
                  {tag}
                </div>
              </div>
            </div>
          )}

          {!buildResult.success && (
            <div
              style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px'
              }}
            >
              <strong style={{ color: '#856404' }}>
                💡 Check the build output above for error details
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DockerBuildInterface;
