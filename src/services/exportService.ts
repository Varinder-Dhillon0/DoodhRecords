import { exportDataFile } from "../utils/dataExport";

export const exportBackup = (options: { dialogTitle?: string } = {}): Promise<boolean> =>
  exportDataFile(options);
