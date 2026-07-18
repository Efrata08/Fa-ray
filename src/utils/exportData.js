import { File, Paths, StorageAccessFramework } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKUP_FILENAME = 'faray-backup.json';
const DOWNLOADS_FILE_URI_KEY = 'faray_downloads_backup_file_uri';

function buildPayload({ pharmacyName, medicines }) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    pharmacyName: pharmacyName || '',
    medicines,
  }, null, 2);
}

// Paths.document persists across app restarts and isn't cleared under OS
// storage pressure (unlike Paths.cache) — but it IS wiped on uninstall, same
// as AsyncStorage. This protects against in-app data loss / corruption, not
// against losing the phone; getting a copy off the device still needs either
// the manual share action or the Downloads backup below.
function writeBackupFile({ pharmacyName, medicines }) {
  const json = buildPayload({ pharmacyName, medicines });
  const file = new File(Paths.document, BACKUP_FILENAME);
  file.create({ overwrite: true });
  file.write(json);
  return file;
}

// Called automatically whenever inventory/sales data changes — no user
// interaction, no share sheet, just keeps an on-device snapshot current.
export function autoSaveBackup(medicines) {
  try {
    writeBackupFile({ medicines });
  } catch {
    // Best-effort only — an auto-save failure shouldn't interrupt the user.
  }
}

// Manual action: share the current backup file off the device (email,
// Drive, Bluetooth, etc.) — the only way this data survives a lost/reset phone
// if the Downloads backup below hasn't been turned on.
export async function exportStoreData({ pharmacyName, medicines }) {
  const file = writeBackupFile({ pharmacyName, medicines });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Fa-Ray data',
  });
}

export async function isDownloadsBackupEnabled() {
  const uri = await AsyncStorage.getItem(DOWNLOADS_FILE_URI_KEY);
  return !!uri;
}

// One-time setup: asks the pharmacist to pick a folder (Android's system
// picker — point them at Downloads) and grants persistent write access to
// it. The granted permission and the created file's URI are saved so every
// future write is silent — no repeat prompts.
export async function enableDownloadsBackup({ pharmacyName, medicines }) {
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }
  const fileUri = await StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    BACKUP_FILENAME.replace('.json', ''),
    'application/json'
  );
  await StorageAccessFramework.writeAsStringAsync(fileUri, buildPayload({ pharmacyName, medicines }));
  await AsyncStorage.setItem(DOWNLOADS_FILE_URI_KEY, fileUri);
  return true;
}

// Called automatically alongside autoSaveBackup — silent no-op until the
// pharmacist has run enableDownloadsBackup() once.
export async function autoSaveToDownloads(medicines) {
  try {
    const fileUri = await AsyncStorage.getItem(DOWNLOADS_FILE_URI_KEY);
    if (!fileUri) return;
    await StorageAccessFramework.writeAsStringAsync(fileUri, buildPayload({ medicines }));
  } catch {
    // Best-effort only — permission may have been revoked from Settings;
    // don't interrupt the user over a background backup failing.
  }
}
