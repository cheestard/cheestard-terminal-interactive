import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// 检查并设置 Node.js 版本
function checkAndSetNodeVersion() {
  const requiredVersion = '20.19.5';
  const currentVersion = process.version;
  
  if (currentVersion !== `v${requiredVersion}`) {
    console.log(`当前 Node.js 版本: ${currentVersion}，需要版本: v${requiredVersion}`);
    console.log('正在切换到正确的 Node.js 版本...');
    
    // 使用 spawn 而不是 execSync 来避免创建额外的 Node.js 进程
    const fnmProcess = spawn('fnm', ['use', requiredVersion], {
      stdio: 'inherit',
      shell: true
    });
    
    fnmProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`已切换到 Node.js v${requiredVersion}`);
        // 重新启动脚本以使用新的 Node.js 版本
        const newProcess = spawn(process.argv[0], process.argv.slice(1), {
          stdio: 'inherit',
          shell: true
        });
        newProcess.on('close', (code) => {
          process.exit(code);
        });
      } else {
        console.error(`切换 Node.js 版本失败，退出码: ${code}`);
        process.exit(1);
      }
    });
    
    // 等待 fnm 命令完成
    return false;
  }
  
  return true;
}

// 只有版本正确时才继续执行
if (!checkAndSetNodeVersion()) {
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.resolve(__dirname, 'frontend');

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
const PORT = parseInt(config.FRONTEND_PORT) || 5173;

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

// Find and terminate frontend related processes
async function killFrontendProcesses() {
    try {
        console.log('Searching for frontend processes occupying the port...');
        
        // Get current process ID to avoid killing ourselves
        const currentPid = process.pid;
        
        // Use wmic to find all node.exe processes and their command lines
        const wmicOutput = await execCommand('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv');
        
        // Parse output, find related frontend processes
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
                
                // Find frontend-related processes, but exclude current process
                if (commandLine && parseInt(processId) !== currentPid && (
                    commandLine.includes('vite') ||
                    commandLine.includes('dev') ||
                    commandLine.includes('frontend') ||
                    commandLine.includes(`:${PORT}`) ||
                    commandLine.includes('start_fe_cheestard-terminal-interactive.mjs')
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

async function startFrontend() {
  try {
    // Terminate old frontend processes
    await killFrontendProcesses();
    
    console.log('Starting frontend server...');

    // Start the frontend development server
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: PORT,
      }
    });

    frontendProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Frontend server stopped successfully.');
      } else {
        console.error(`Frontend server exited with code ${code}`);
      }
      process.exit(code);
    });

    frontendProcess.on('error', (err) => {
      console.error('Failed to start frontend server:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
}

startFrontend().catch(console.error);