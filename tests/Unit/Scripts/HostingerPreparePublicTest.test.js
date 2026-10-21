import { describe, it, expect } from 'vitest';
import { generateHostingerIndexPhp } from '../../../scripts/hostinger-prepare-public.js';

describe('Hostinger Prepare Public Script', () => {
    it('mengubah path bootstrap dan maintenance pada index.php mengarah ke direktori core terisolasi', () => {
        const originalContent = `<?php

use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
`;

        const coreDir = 'litabmas_core';
        const modified = generateHostingerIndexPhp(originalContent, coreDir);

        expect(modified).toContain("__DIR__.'/../litabmas_core/storage/framework/maintenance.php'");
        expect(modified).toContain("__DIR__.'/../litabmas_core/vendor/autoload.php'");
        expect(modified).toContain("__DIR__.'/../litabmas_core/bootstrap/app.php'");
    });

    it('mendukung custom folder name untuk core direktori', () => {
        const originalContent = "require __DIR__.'/../vendor/autoload.php';";
        const modified = generateHostingerIndexPhp(originalContent, 'custom_app_dir');
        expect(modified).toBe("require __DIR__.'/../custom_app_dir/vendor/autoload.php';");
    });
});
