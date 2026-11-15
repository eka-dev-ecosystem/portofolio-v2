export const shorthands = undefined;

export const up = async (pgm) => {
  pgm.sql(`
    ALTER TABLE apk_apps ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
    ALTER TABLE apk_apps ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_apk_apps_slug ON apk_apps(slug);
  `);
};

export const down = async (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_apk_apps_slug;
    ALTER TABLE apk_apps DROP COLUMN IF EXISTS tagline;
    ALTER TABLE apk_apps DROP COLUMN IF EXISTS slug;
  `);
};
