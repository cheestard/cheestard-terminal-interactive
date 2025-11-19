import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
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