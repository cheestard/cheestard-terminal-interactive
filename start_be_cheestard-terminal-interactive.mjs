import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname);

// Load environment variables from .env file
function loadEnvConfig() {
  const envPath = path.join(__dirname, '.env');
  const defaultConfig = {
    MCP_PORT: 1106,
    FRONTEND_PORT: 1107
  };
  
  try {
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const envLines = envContent.split('\n');
      const config = { ...defaultConfig };
      
      envLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            config[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
      
      return config;
    }
  } catch (error) {
    console.warn('Warning: Could not load .env file, using default ports:', error.message);
  }
  
  return defaultConfig;
}

const config = loadEnvConfig();
const PORT = parseInt(config.MCP_PORT) || 1106;

// Execute command helper function
function execCommand(command) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, [], {
            shell: true,
            stdio: 'pipe',
            encoding: 'utf8'
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Command execution failed, exit code: ${code}\nError: ${stderr}`));
            }
        });
        
        child.on('error', (err) => {
            reject(err);
        });
    });
}

// Find and terminate backend related processes
async function killBackendProcesses() {
    try {
        console.log('Searching for backend processes occupying the port...');
        
        // Get current process ID to avoid killing ourselves
        const currentPid = process.pid;
        
        // Use wmic to find all node.exe processes and their command lines
        const wmicOutput = await execCommand('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv');
        
        // Parse output, find related backend processes
        const lines = wmicOutput.split('\n').filter(line => line.trim());
        const processes = [];
        
        // Skip header lines, only process data lines containing commas
        const dataLines = lines.filter(line => !line.includes('Node,CommandLine,ProcessId') && line.includes(','));
        
        for (const line of dataLines) {
            // CSV format: Node,CommandLine,ProcessId
            const parts = line.split(',');
            if (parts.length >= 3) {
                const commandLine = parts[1];
                const processId = parts[2].trim();
                
                // Find backend-related processes, but exclude current process
                if (commandLine && parseInt(processId) !== currentPid && (
                    commandLine.includes('dist/index.js') ||
                    commandLine.includes('node') && commandLine.includes('dist/index.js') ||
                    commandLine.includes('start_be_cheestard-terminal-interactive.mjs') ||
                    commandLine.includes(`:${PORT}`) ||
                    commandLine.includes('cheestard-terminal-interactive')
                )) {
                    processes.push({
                        pid: parseInt(processId),
                        commandLine: commandLine
                    });
                }
            }
        }
        
        if (processes.length > 0) {
            console.log(`Found ${processes.length} related processes, terminating...`);
            
            for (const process of processes) {
                try {
                    console.log(`Terminating process PID: ${process.pid}`);
                    console.log(`Command line: ${process.commandLine.substring(0, 100)}...`);
                    
                    await execCommand(`taskkill /PID ${process.pid} /F`);
                    console.log(`Process ${process.pid} terminated successfully`);
                } catch (error) {
                    console.error(`Failed to terminate process ${process.pid}:`, error.message);
                }
            }
            
            // Wait a moment for processes to fully exit
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            console.log('No related processes found occupying the port');
        }
        
    } catch (error) {
        console.error('Error finding or terminating processes:', error.message);
    }
}

async function startBackend() {
  try {
    // Terminate old backend processes
    await killBackendProcesses();
    
    console.log('Starting backend server...');

    // Start the backend server
    const backendProcess = spawn('node', ['dist/index.js'], {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        MCP_PORT: PORT,
      }
    });

    backendProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Backend server stopped successfully.');
      } else {
        console.error(`Backend server exited with code ${code}`);
      }
      process.exit(code);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend server:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
}

startBackend().catch(console.error);