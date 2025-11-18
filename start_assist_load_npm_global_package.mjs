/**
 * WARNING: Do not delete this multi-line comment, these are important principles I wrote.
 * - Please use ES module syntax.
 * 
 * - This script can automatically install when a package is not globally installed.
 *
 * - Caching mechanism: This script implements a cross-platform permanent caching mechanism that permanently caches the result of 'npm root -g' unless the path is incorrect.
 *   - Windows: Cache stored in %TEMP% or %TMP% directory
 *   - Linux/macOS: Cache stored in $TMPDIR or /tmp directory
 *   - Cache file name: npm_global_root_cache.json
 *   - Cache strategy: Permanent cache, unless path does not exist or is incorrect
 *
 *
 * 2. **Must use absolute file path for import**:
 *    To ensure correct resolution from any location, must use `file:///` protocol.

 =====================================================================================
 */
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'fs';

/**
 * Get cross-platform temporary directory path
 * @returns {string} Temporary directory path
 */
function getTempDir() {
    const os = process.platform;
    if (os === 'win32') {
        return process.env.TEMP || process.env.TMP || 'C:\\temp';
    } else {
        return process.env.TMPDIR || '/tmp';
    }
}

/**
 * Get cache file path
 * @returns {string} Full path of the cache file
 */
function getCacheFilePath() {
    const tempDir = getTempDir();
    // Ensure temporary directory exists
    if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
    }
    return join(tempDir, 'npm_global_root_cache.json');
}

/**
 * Check if cache is valid (permanent cache, unless path is wrong)
 * @param {string} cacheFilePath - Cache file path
 * @returns {boolean} Whether cache is valid
 */
function isCacheValid(cacheFilePath) {
    if (!existsSync(cacheFilePath)) {
        return false;
    }
    
    try {
        const cacheData = readFileSync(cacheFilePath, { encoding: 'utf-8' });
        const parsed = JSON.parse(cacheData);
        const globalNpmRoot = parsed.globalNpmRoot;
        
        // Check if path still exists
        return existsSync(globalNpmRoot);
    } catch (error) {
        return false;
    }
}

/**
 * Read global npm root directory from cache
 * @param {string} cacheFilePath - Cache file path
 * @returns {string|null} Cached global npm root directory, return null if invalid
 */
function readGlobalNpmRootFromCache(cacheFilePath) {
    try {
        const cacheData = readFileSync(cacheFilePath, { encoding: 'utf-8' });
        const parsed = JSON.parse(cacheData);
        return parsed.globalNpmRoot || null;
    } catch (error) {
        return null;
    }
}

/**
 * Write global npm root directory to cache
 * @param {string} cacheFilePath - Cache file path
 * @param {string} globalNpmRoot - Global npm root directory
 */
function writeGlobalNpmRootToCache(cacheFilePath, globalNpmRoot) {
    try {
        const cacheData = JSON.stringify({ globalNpmRoot, timestamp: Date.now() });
        writeFileSync(cacheFilePath, cacheData, { encoding: 'utf-8' });
    } catch (error) {
        // Ignore write errors, does not affect main functionality
        console.warn('[Loader] Unable to write cache file:', error.message);
    }
}

/**
 * Get global npm root directory path (with permanent cache)
 * @returns {string} Global npm root directory path
 */
function getGlobalNpmRoot() {
    const cacheFilePath = getCacheFilePath();
    
    // Try to read from cache
    if (isCacheValid(cacheFilePath)) {
        const cachedRoot = readGlobalNpmRootFromCache(cacheFilePath);
        if (cachedRoot) {
            return cachedRoot;
        }
    }
    
    // Cache invalid or does not exist, re-fetch
    const globalNpmRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
    
    // Update cache
    writeGlobalNpmRootToCache(cacheFilePath, globalNpmRoot);
    
    return globalNpmRoot;
}

// Get global npm root directory path (using cached version)
// This is the most reliable, cross-platform way to find global node_modules
const globalNpmRoot = getGlobalNpmRoot();

// Create a require function based on global npm root directory
// The resolution behavior of this require function will be the same as on the command line
const globalRequire = createRequire(globalNpmRoot);

/**
 * Internal helper function: Use the created require function to load modules.
 * @param {string} moduleName - Name of the module to load.
 * @returns {any} Loaded module.
 */
function load(moduleName) {
    try {
        return globalRequire(moduleName);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.warn(`[Loader] Global module '${moduleName}' not found, attempting automatic installation...`);
            try {
                execSync(`npm install -g ${moduleName}`, { stdio: 'inherit' });
                console.log(`[Loader] Module '${moduleName}' successfully installed.`);
                
                // Clear cache after installing new module, because global directory structure may have changed
                try {
                    const cacheFilePath = getCacheFilePath();
                    if (existsSync(cacheFilePath)) {
                        // Delete cache file, force re-fetch next time
                        unlinkSync(cacheFilePath);
                        console.log('[Loader] Cache cleared because global module structure has been updated.');
                    }
                } catch (cacheError) {
                    // Ignore cache clearing errors
                    console.warn('[Loader] Warning when clearing cache:', cacheError.message);
                }
                
                // Try loading again after installation
                return globalRequire(moduleName);
            } catch (installError) {
                console.error(`[Loader] Failed to automatically install module '${moduleName}'.`);
                console.error(`Please manually execute 'npm install -g ${moduleName}' to install.`);
                console.error('Installation error:', installError);
                process.exit(1);
            }
        } else {
            console.error(`[Loader] Unknown error occurred while loading global module '${moduleName}'.`);
            console.error(`Global directory: ${globalNpmRoot}`);
            console.error('Original error:', error);
            process.exit(1);
        }
    }
}

// Define list of modules to load
const modulesToLoad = [
    'axios',
    'simple-git',
    'json5',
    'node-stream-zip',
    'find-process',
    'tree-kill',
    'rimraf'
];

// Dynamically load all modules
const loadedModules = {};
for (const moduleName of modulesToLoad) {
    const loadedModule = load(moduleName);
    // Special handling for find-process, because it may need .default
    if (moduleName === 'find-process') {
        loadedModules['findProcess'] = loadedModule.default || loadedModule;
    } else {
        // Convert module name to camelCase as key
        const camelCaseName = moduleName.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        loadedModules[camelCaseName] = loadedModule;
    }
}

// Export all loaded modules
export const {
    axios,
    simpleGit,
    json5,
    nodeStreamZip,
    findProcess,
    treeKill,
    rimraf
} = loadedModules;