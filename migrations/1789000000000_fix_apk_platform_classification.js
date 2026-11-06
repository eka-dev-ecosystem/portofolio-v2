export const shorthands = undefined;

export const up = async (pgm) => {
  // 1. Correct misclassified releases in apk_releases
  // Winmix companion zip or dmg should be macos
  pgm.sql(`
    UPDATE apk_releases
    SET platform = 'macos'
    WHERE original_filename ILIKE '%winmix%' AND platform = 'windows';
  `);

  // Extension-based corrections
  pgm.sql(`
    UPDATE apk_releases
    SET platform = 'macos'
    WHERE (original_filename ILIKE '%.dmg' OR original_filename ILIKE '%.pkg') AND platform != 'macos';
  `);

  pgm.sql(`
    UPDATE apk_releases
    SET platform = 'windows'
    WHERE (original_filename ILIKE '%.exe' OR original_filename ILIKE '%.msi') AND platform != 'windows';
  `);

  pgm.sql(`
    UPDATE apk_releases
    SET platform = 'android'
    WHERE (original_filename ILIKE '%.apk' OR original_filename ILIKE '%.aab') AND platform != 'android';
  `);

  pgm.sql(`
    UPDATE apk_releases
    SET platform = 'linux'
    WHERE (original_filename ILIKE '%.appimage' OR original_filename ILIKE '%.deb' OR original_filename ILIKE '%.rpm') AND platform != 'linux';
  `);

  // 2. Change default supported_platforms on apk_apps to empty array instead of defaulting to ['android']
  pgm.alterColumn('apk_apps', 'supported_platforms', {
    default: pgm.func("ARRAY[]::text[]")
  });

  // 3. Dynamically recompute supported_platforms for all apps based on distinct platforms in apk_releases
  pgm.sql(`
    UPDATE apk_apps a
    SET supported_platforms = COALESCE(
      (SELECT array_agg(DISTINCT rel.platform) FROM apk_releases rel WHERE rel.app_id = a.id AND rel.platform IS NOT NULL AND rel.platform != 'unknown'),
      ARRAY[]::text[]
    ),
    updated_at = current_timestamp;
  `);
};

export const down = async (pgm) => {
  // Revert default to ['android']
  pgm.alterColumn('apk_apps', 'supported_platforms', {
    default: pgm.func("ARRAY['android']::text[]")
  });
};

