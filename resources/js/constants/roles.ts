/**
 * Role name constants
 * Strictly contains the 5 standard research roles
 * @see App\Models\Role
 */
export const ROLE_NAMES = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_KAMPUS: 'Admin Kampus',
    ADMIN_KEUANGAN: 'Admin Keuangan',
    REVIEWER: 'Reviewer',
    PENELITI: 'Peneliti',
} as const;

/**
 * Type for role names
 */
export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
