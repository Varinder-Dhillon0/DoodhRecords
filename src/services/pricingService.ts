import type { Animal, OperationResult, PricingConfig } from "../types";
import { pricingRepository, runRepository } from "../data/repositories";
import { mergePricingConfig } from "../domain/pricing";

export const loadPricing = (): Promise<OperationResult<PricingConfig>> =>
  runRepository(async () => {
    const savedPricing = await pricingRepository.load();
    return mergePricingConfig(savedPricing);
  });

export const getRateForRecord = (
  animal: Animal,
  dateString: string,
): Promise<OperationResult<number>> =>
  runRepository(() => pricingRepository.rateForEntry(animal, dateString));

export const saveRate = (
  year: string,
  month: string,
  animal: Animal,
  price: number,
): Promise<OperationResult<void>> =>
  runRepository(() => pricingRepository.save(year, month, animal, price));
