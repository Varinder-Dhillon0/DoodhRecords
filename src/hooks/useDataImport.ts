import { useCallback, useState } from "react";
import {
  importMonthData,
  type MonthImportSummary,
} from "../services/importService";

type UseDataImportOptions = {
  onImported?: (summary: MonthImportSummary) => void;
  onError?: (error: unknown) => void;
};

export const useDataImport = ({
  onImported,
  onError,
}: UseDataImportOptions = {}) => {
  const [isImporting, setIsImporting] = useState(false);

  const importData = useCallback(
    async (
      rawText: string,
      monthKey: string,
    ): Promise<MonthImportSummary | null> => {
      setIsImporting(true);
      try {
        const result = await importMonthData(rawText, monthKey);
        if (!result.ok) throw result.error;
        onImported?.(result.value);
        return result.value;
      } catch (error) {
        onError?.(error);
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    [onImported, onError],
  );

  return { isImporting, importData };
};
