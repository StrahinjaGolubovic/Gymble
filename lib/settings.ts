import db from './db';

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  ).run(key, value);
}

const MAINTENANCE_KEY = 'maintenance_mode';

export function isMaintenanceModeEnabled(): boolean {
  return getSetting(MAINTENANCE_KEY) === '1';
}

export function setMaintenanceModeEnabled(enabled: boolean): void {
  setSetting(MAINTENANCE_KEY, enabled ? '1' : '0');
}


