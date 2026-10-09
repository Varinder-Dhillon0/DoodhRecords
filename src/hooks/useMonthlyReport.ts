import { useCallback, useState } from "react";
import { shareMonthlyReportPdf } from "../services/monthlyReportService";

type UseMonthlyReportOptions = {
  dialogTitle: string;
  onShared?: (shared: boolean) => void;
  onError?: (error: unknown) => void;
};

export const useMonthlyReport = ({
  dialogTitle,
  onShared,
  onError,
}: UseMonthlyReportOptions) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const shareReport = useCallback(
    async (html: string, fileName: string): Promise<boolean> => {
      setIsGenerating(true);
      try {
        const shared = await shareMonthlyReportPdf({
          html,
          fileName,
          dialogTitle,
        });
        onShared?.(shared);
        return shared;
      } catch (error) {
        onError?.(error);
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [dialogTitle, onShared, onError],
  );

  return { isGenerating, shareReport };
};
