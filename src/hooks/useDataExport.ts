import { useCallback, useState } from "react";
import { exportBackup } from "../services/exportService";

type UseDataExportOptions = {
  dialogTitle: string;
  onExported?: (exported: boolean) => void;
  onError?: (error: unknown) => void;
};

export const useDataExport = ({
  dialogTitle,
  onExported,
  onError,
}: UseDataExportOptions) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async (): Promise<boolean> => {
    setIsExporting(true);
    try {
      const exported = await exportBackup({ dialogTitle });
      onExported?.(exported);
      return exported;
    } catch (error) {
      onError?.(error);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [dialogTitle, onExported, onError]);

  return { isExporting, exportData };
};
