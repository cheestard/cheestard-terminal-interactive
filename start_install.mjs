import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname);

// Display usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage:
  node start_install.mjs [options]

Options:
  --force, -f    Force delete node_modules and reinstall without confirmation
  --help, -h     Display this help information

Examples:
  node start_install.mjs          # Interactive installation
  node start_install.mjs --force  # Force reinstall
`);
    process.exit(0);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function deleteDependencies() {
    console.log('Deleting node_modules and package-lock.json...');
    try {
        const nodeModulesPath = path.join(PROJECT_DIR, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
            // Use Node.js built-in method to delete directory
            await fs.promises.rm(nodeModulesPath, { recursive: true, force: true });
            console.log('node_modules has been deleted.');
        }
        
        const packageLockPath = path.join(PROJECT_DIR, 'package-lock.json');
        if (fs.existsSync(packageLockPath)) {
            await fs.promises.unlink(packageLockPath);
            console.log('package-lock.json has been deleted.');
        }
        
        console.log('Old dependencies have been successfully cleaned up.');
    } catch (error) {
        console.error('Error deleting dependencies:', error);
        process.exit(1);
    }
}

function installDependencies() {
    console.log('Installing project dependencies...');
    const child = spawn('npm', ['install'], {
        stdio: 'inherit',
        shell: true,
        cwd: PROJECT_DIR
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log('Project dependencies installed successfully.');
        } else {
            console.error(`Project dependency installation failed, exit code ${code}`);
        }
        process.exit(code);
    });

    child.on('error', (err) => {
        console.error('Failed to start installation process:', err);
        process.exit(1);
    });
}

async function main() {
    const nodeModulesExists = fs.existsSync(path.join(PROJECT_DIR, 'node_modules'));
    const forceReinstall = process.argv.includes('--force') || process.argv.includes('-f');

    if (nodeModulesExists) {
        if (forceReinstall) {
            console.log('Detected --force parameter, directly deleting and reinstalling dependencies...');
            await deleteDependencies();
            installDependencies();
        } else {
            rl.question('Detected installed dependencies (node_modules). Do you want to delete and reinstall? (y/N): ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                    await deleteDependencies();
                    installDependencies();
                } else {
                    console.log('Operation cancelled.');
                    rl.close();
                }
            });
        }
    } else {
        installDependencies();
    }
}

main().catch(console.error);