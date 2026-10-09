import { useCallback, useState } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ConfirmTone } from "../components/ui/ConfirmDialog";

export type ConfirmRequest = {
  title: string;
  message: string;
  tone?: ConfirmTone;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
};

/**
 * Drives a ConfirmDialog: call showConfirm() anywhere a native Alert was
 * used, render the returned dialog props into <ConfirmDialog />, and the
 * sheet animates in/out around the callbacks.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const showConfirm = useCallback((next: ConfirmRequest) => {
    setRequest(next);
  }, []);

  const hideConfirm = useCallback(() => {
    setRequest(null);
  }, []);

  return {
    dialog: {
      visible: request !== null,
      title: request?.title ?? "",
      message: request?.message ?? "",
      tone: request?.tone ?? ("info" as ConfirmTone),
      icon: request?.icon,
      confirmLabel: request?.confirmLabel ?? "",
      cancelLabel: request?.cancelLabel,
      destructive: request?.destructive ?? false,
      onConfirm: () => {
        const callback = request?.onConfirm;
        setRequest(null);
        callback?.();
      },
      onCancel: hideConfirm,
    },
    showConfirm,
    hideConfirm,
  };
}
