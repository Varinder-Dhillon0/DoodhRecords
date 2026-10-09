import { useCallback, useState } from "react";
import {
  saveMonthlyReportPdf,
  type MonthlyReportSaveResult,
} from "../services/monthlyReportService";

type UseMonthlyReportOptions = {
  onSaved?: (location: "downloads" | "files") => void;
  onCancelled?: () => void;
  onError?: (error: unknown) => void;
};

export const useMonthlyReport = ({
  onSaved,
  onCancelled,
  onError,
}: UseMonthlyReportOptions) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const saveReport = useCallback(
    async (html: string, fileName: string): Promise<MonthlyReportSaveResult> => {
      setIsGenerating(true);
      try {
        const result = await saveMonthlyReportPdf({ html, fileName });
        if (result.status === "saved") {
          onSaved?.(result.location);
        } else {
          onCancelled?.();
        }
        return result;
      } catch (error) {
        onError?.(error);
        return { status: "cancelled" };
      } finally {
        setIsGenerating(false);
      }
    },
    [onSaved, onCancelled, onError],
  );

  return { isGenerating, saveReport };
};
