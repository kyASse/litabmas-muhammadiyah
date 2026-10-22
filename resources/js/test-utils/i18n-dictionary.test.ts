import { dictionaries, en, id } from '@/lang';
import { describe, expect, it } from 'vitest';

describe('i18n Dictionary Integrity', () => {
    it('contains en as default and id as optional', () => {
        expect(dictionaries.en).toBeDefined();
        expect(dictionaries.id).toBeDefined();
    });

    it('guarantees complete key parity between en and id', () => {
        const getKeys = (obj: Record<string, any>, prefix = ''): string[] => {
            return Object.keys(obj).flatMap((key) => {
                const path = prefix ? `${prefix}.${key}` : key;
                return typeof obj[key] === 'object' && obj[key] !== null ? getKeys(obj[key], path) : [path];
            });
        };

        const enKeys = getKeys(en).sort();
        const idKeys = getKeys(id).sort();

        expect(enKeys).toEqual(idKeys);
    });

    it('strictly adheres to the Zero Emoji Invariant', () => {
        const emojiRegex = /\p{Extended_Pictographic}/u;
        const allStrings = (obj: any): string[] => {
            return Object.values(obj).flatMap((val) => (typeof val === 'string' ? [val] : allStrings(val)));
        };

        const enTexts = allStrings(en);
        const idTexts = allStrings(id);

        for (const text of [...enTexts, ...idTexts]) {
            expect(emojiRegex.test(text)).toBe(false);
        }
    });

    it('defines all 14 research workflow statuses in English and Indonesian', () => {
        const requiredStatuses = [
            'Draft',
            'Submitted',
            'In_Review',
            'Lolos_Didanai',
            'Ditolak',
            'Revisi',
            'Contracted',
            'Disbursed_T1',
            'Disbursed_T2',
            'Monev_Approved',
            'Monev_Locked',
            'Output_Verified',
            'Completed_SKTS',
            'Terminated',
        ];

        for (const status of requiredStatuses) {
            expect((en.statuses as any)[status]).toBeDefined();
            expect((id.statuses as any)[status]).toBeDefined();
        }
    });
});
