import fs from 'node:fs';
import path from 'node:path';

export function generateHostingerIndexPhp(content, coreDirName = 'litabmas_core') {
    const cleanCoreDir = coreDirName.replace(/^[\/\\]+|[\/\\]+$/g, '');
    return content.replace(
        /__DIR__\s*\.\s*(['"])\/\.\.\/(storage|vendor|bootstrap)\//g,
        (_match, quote, folder) => `__DIR__.${quote}/../${cleanCoreDir}/${folder}/`
    );
}

function runCli() {
    const args = process.argv.slice(2);
    const targetDir = args[0] || 'public_dist';
    const coreDir = args[1] || 'litabmas_core';
    const cleanCoreDir = coreDir.replace(/^[\/\\]+|[\/\\]+$/g, '');

    const indexPhpPath = path.resolve(targetDir, 'index.php');
    if (!fs.existsSync(indexPhpPath)) {
        console.error(`[ERROR] File index.php not found at ${indexPhpPath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(indexPhpPath, 'utf8');
    const updated = generateHostingerIndexPhp(content, cleanCoreDir);
    fs.writeFileSync(indexPhpPath, updated, 'utf8');
    console.log(`[INFO] Successfully prepared ${indexPhpPath} targeting core directory '${cleanCoreDir}'.`);
}

if (process.argv[1] && process.argv[1].endsWith('hostinger-prepare-public.js')) {
    runCli();
}
