import { describe, it, expect } from 'vitest';
import { generateHostingerIndexPhp, resolveRelativeCorePath } from '../../../scripts/hostinger-prepare-public.js';

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

    it('mendukung penulisan path menggunakan tanda petik ganda (double quotes)', () => {
        const originalContent = `<?php

use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__."/../storage/framework/maintenance.php")) {
    require $maintenance;
}

require __DIR__."/../vendor/autoload.php";

(require_once __DIR__."/../bootstrap/app.php")
    ->handleRequest(Request::capture());
`;

        const coreDir = 'litabmas_core';
        const modified = generateHostingerIndexPhp(originalContent, coreDir);

        expect(modified).toContain('__DIR__."/../litabmas_core/storage/framework/maintenance.php"');
        expect(modified).toContain('__DIR__."/../litabmas_core/vendor/autoload.php"');
        expect(modified).toContain('__DIR__."/../litabmas_core/bootstrap/app.php"');
    });

    it('mendukung double quotes dengan custom core folder name', () => {
        const singleLine = 'require __DIR__."/../vendor/autoload.php";';
        expect(generateHostingerIndexPhp(singleLine, 'my_core')).toBe('require __DIR__."/../my_core/vendor/autoload.php";');
    });

    describe('resolveRelativeCorePath', () => {
        it('menghasilkan .. jika core path adalah parent langsung dari public_html (domain root deployment)', () => {
            const core = '/home/u347029080/domains/riset.portalmu.org';
            const pub = '/home/u347029080/domains/riset.portalmu.org/public_html';
            const rel = resolveRelativeCorePath(core, pub);
            expect(rel).toBe('..');

            const content = "require __DIR__.'/../vendor/autoload.php';";
            expect(generateHostingerIndexPhp(content, rel)).toBe("require __DIR__.'/../vendor/autoload.php';");
        });

        it('menghasilkan ../litabmas_core jika core path adalah sibling dari public_html', () => {
            const core = '/home/u347029080/domains/riset.portalmu.org/litabmas_core';
            const pub = '/home/u347029080/domains/riset.portalmu.org/public_html';
            const rel = resolveRelativeCorePath(core, pub);
            expect(rel).toBe('../litabmas_core');

            const content = "require __DIR__.'/../vendor/autoload.php';";
            expect(generateHostingerIndexPhp(content, rel)).toBe("require __DIR__.'/../litabmas_core/vendor/autoload.php';");
        });

        it('menghasilkan ../../../litabmas_core jika core path di root user dan public di domain folder', () => {
            const core = '/home/u347029080/litabmas_core';
            const pub = '/home/u347029080/domains/riset.portalmu.org/public_html';
            const rel = resolveRelativeCorePath(core, pub);
            expect(rel).toBe('../../../litabmas_core');

            const content = "require __DIR__.'/../vendor/autoload.php';";
            expect(generateHostingerIndexPhp(content, rel)).toBe("require __DIR__.'/../../../litabmas_core/vendor/autoload.php';");
        });
    });
});

