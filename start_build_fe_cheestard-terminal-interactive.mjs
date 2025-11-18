import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.resolve(__dirname, 'frontend');

async function buildFrontend() {
  console.log('Building frontend with Vite...');
  
  const buildProcess = spawn('npx', ['vite', 'build'], {
    cwd: projectDir,
    shell: true,
    stdio: 'inherit'
  });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Frontend build completed successfully!');
      console.log('Built files are in frontend/dist/');
    } else {
      console.error(`Frontend build failed with code ${code}`);
    }
  });

  buildProcess.on('error', (err) => {
    console.error('Failed to start frontend build:', err);
  });
}

buildFrontend();