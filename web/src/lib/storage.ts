import { HistoricalBalances } from './taxCalculator';

const STORAGE_KEY_BALANCES = 'sat_toolkit_historical_balances';

export const DEFAULT_BALANCES_2026: HistoricalBalances = {
  previousIncome: 110361.0,
  previousDeductions: 88173.0,
  previousWithheldIsr: 8623.0,
  previousProvisionalPayments: 592.0,
  previousVatFavorableBalance: 5326.0,
};

export function loadHistoricalBalances(): HistoricalBalances {
  if (typeof window === 'undefined') return DEFAULT_BALANCES_2026;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BALANCES);
    if (!raw) return DEFAULT_BALANCES_2026;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading balances from localStorage:', e);
    return DEFAULT_BALANCES_2026;
  }
}

export function saveHistoricalBalances(balances: HistoricalBalances): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_BALANCES, JSON.stringify(balances));
  } catch (e) {
    console.error('Error saving balances to localStorage:', e);
  }
}

