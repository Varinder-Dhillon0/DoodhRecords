import { useDoodhContext } from "../context/DoodhContext";
import { DoodhContextType } from "../types";

export function useDoodhData(): DoodhContextType {
  return useDoodhContext();
}
