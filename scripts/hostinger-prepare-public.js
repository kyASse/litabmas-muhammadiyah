import fs from 'node:fs';
import path from 'node:path';

export function generateHostingerIndexPhp(content, coreDirName = 'litabmas_core') {
    const cleanCoreDir = coreDirName.replace(/^[\/\\]+|[\/\\]+$/g, '');
    return content
        .replace(/__DIR__\s*\.\s*'\/\.\.\/storage\//g, `__DIR__.'/../${cleanCoreDir}/storage/`)
        .replace(/__DIR__\s*\.\s*'\/\.\.\/vendor\//g, `__DIR__.'/../${cleanCoreDir}/vendor/`)
        .replace(/__DIR__\s*\.\s*'\/\.\.\/bootstrap\//g, `__DIR__.'/../${cleanCoreDir}/bootstrap/`);
}

function runCli() {
    const args = process.argv.slice(2);
    const targetDir = args[0] || 'public_dist';
    const coreDir = args[1] || 'litabmas_core';

    const indexPhpPath = path.resolve(targetDir, 'index.php');
    if (!fs.existsSync(indexPhpPath)) {
        return;
    }

    const content = fs.readFileSync(indexPhpPath, 'utf8');
    const updated = generateHostingerIndexPhp(content, coreDir);
    fs.writeFileSync(indexPhpPath, updated, 'utf8');
}

if (process.argv[1] && process.argv[1].endsWith('hostinger-prepare-public.js')) {
    runCli();
}
