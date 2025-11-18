import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname);

function buildProject() {
    console.log('Building project...');
    const child = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true,
        cwd: PROJECT_DIR
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log('Project built successfully.');
        } else {
            console.error(`Project build failed, exit code ${code}`);
        }
        process.exit(code);
    });

    child.on('error', (err) => {
        console.error('Failed to start build process:', err);
        process.exit(1);
    });
}

buildProject();