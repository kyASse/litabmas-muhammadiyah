import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export function resolveRelativeCorePath(corePath, publicPath) {
    if (!corePath) {
        return '../litabmas_core';
    }
    // If corePath is a simple folder name without slashes, treat as sibling folder
    if (!corePath.includes('/') && !corePath.includes('\\')) {
        return `../${corePath.replace(/^[/\\]+|[/\\]+$/g, '')}`;
    }

    const normCore = corePath.replace(/\\/g, '/').replace(/\/+$/, '');
    if (!publicPath) {
        return `../${path.posix.basename(normCore)}`;
    }

    const normPublic = publicPath.replace(/\\/g, '/').replace(/\/+$/, '');
    const rel = path.posix.relative(normPublic, normCore);
    return rel;
}

export function generateHostingerIndexPhp(content, relativeOrCoreDir = 'litabmas_core') {
    let relPath = relativeOrCoreDir.trim().replace(/\\/g, '/');
    if (!relPath.startsWith('.')) {
        relPath = `../${relPath.replace(/^\/+|\/+$/g, '')}`;
    } else {
        relPath = relPath.replace(/\/+$/, '');
    }

    return content.replace(
        /__DIR__\s*\.\s*(['"])\/\.\.\/(storage|vendor|bootstrap)\//g,
        (_match, quote, folder) => `__DIR__.${quote}/${relPath}/${folder}/`
    );
}

function runCli() {
    const args = process.argv.slice(2);
    const targetDir = args[0] || 'public_dist';
    const corePathParam = args[1] || 'litabmas_core';
    const publicPathParam = args[2] || '';

    const relativeCore = resolveRelativeCorePath(corePathParam, publicPathParam);

    const indexPhpPath = path.resolve(targetDir, 'index.php');
    if (!fs.existsSync(indexPhpPath)) {
        console.error(`[ERROR] File index.php not found at ${indexPhpPath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(indexPhpPath, 'utf8');
    const updated = generateHostingerIndexPhp(content, relativeCore);
    fs.writeFileSync(indexPhpPath, updated, 'utf8');
    console.log(`[INFO] Successfully prepared ${indexPhpPath} targeting core path '${relativeCore}'.`);
}

if (process.argv[1] && process.argv[1].endsWith('hostinger-prepare-public.js')) {
    runCli();
}

