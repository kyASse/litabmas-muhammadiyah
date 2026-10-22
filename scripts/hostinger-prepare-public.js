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

export function ensureHtaccess(targetDir, rootDir = process.cwd()) {
    const htaccessPath = path.resolve(targetDir, '.htaccess');
    if (fs.existsSync(htaccessPath)) {
        return { created: false, path: htaccessPath };
    }

    const publicHtaccess = path.resolve(rootDir, 'public', '.htaccess');
    const rootHtaccess = path.resolve(rootDir, '.htaccess');

    if (fs.existsSync(publicHtaccess)) {
        fs.copyFileSync(publicHtaccess, htaccessPath);
        return { created: true, source: 'public', path: htaccessPath };
    }

    if (fs.existsSync(rootHtaccess)) {
        fs.copyFileSync(rootHtaccess, htaccessPath);
        return { created: true, source: 'root', path: htaccessPath };
    }

    const defaultHtaccess = `<IfModule mod_negotiation.c>
    Options -MultiViews -Indexes
</IfModule>

<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/css .css
    AddType image/svg+xml .svg
</IfModule>

<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
`;
    fs.writeFileSync(htaccessPath, defaultHtaccess, 'utf8');
    return { created: true, source: 'generated', path: htaccessPath };
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

    const htaccessResult = ensureHtaccess(targetDir);
    if (htaccessResult.created) {
        console.log(`[INFO] Successfully ensured .htaccess in ${targetDir} (from ${htaccessResult.source}).`);
    } else {
        console.log(`[INFO] Verified .htaccess is present in ${targetDir}.`);
    }
}

if (process.argv[1] && process.argv[1].endsWith('hostinger-prepare-public.js')) {
    runCli();
}

