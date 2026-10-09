export const MAX_MILK_QUANTITY = 500;
export const MAX_FAT_PERCENTAGE = 25;

export type FormValidationError = {
  titleKey: string;
  messageKey: string;
};

export const validateMilkQuantity = (
  quantity: number,
): FormValidationError | null => {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_MILK_QUANTITY) {
    return {
      titleKey: "entryForm.invalidMilkTitle",
      messageKey: "entryForm.invalidMilkMessage",
    };
  }
  return null;
};

export const validateFatPercentage = (
  fat: number,
): FormValidationError | null => {
  if (!Number.isFinite(fat) || fat <= 0 || fat > MAX_FAT_PERCENTAGE) {
    return {
      titleKey: "entryForm.invalidFatTitle",
      messageKey: "entryForm.invalidFatMessage",
    };
  }
  return null;
};

export const validateEntryInput = (
  milkQuantity: number,
  fatPercentage: number,
): FormValidationError | null =>
  validateMilkQuantity(milkQuantity) ?? validateFatPercentage(fatPercentage);

export const validateAnimalPrice = (price: number): boolean =>
  Number.isFinite(price) && price > 0;
