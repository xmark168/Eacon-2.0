// Currency conversion utilities
// Current exchange rate: 1 USD = 26,050 VND (as of June 2025)

export const USD_TO_VND_RATE = 26050;

export function convertUSDToVND(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_VND_RATE);
}

export function convertVNDToUSD(vndAmount: number): number {
  return Math.round((vndAmount / USD_TO_VND_RATE) * 100) / 100;
}

export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VNĐ';
}

export function formatUSD(amount: number): string {
  return '$' + amount.toFixed(2);
}

export function getTokensForUSD(usdAmount: number): number {
  // 400 tokens = $1 USD
  return Math.floor(usdAmount * 200);
}

export function getUSDForTokens(tokens: number): number {
  // 400 tokens = $1 USD
  return Math.round((tokens / 400) * 100) / 100;
}

export function formatCurrencyDisplay(usdAmount: number) {
  const vndAmount = convertUSDToVND(usdAmount);
  return {
    usd: formatUSD(usdAmount),
    vnd: formatVND(vndAmount),
    vndRaw: vndAmount,
    usdRaw: usdAmount
  };
} 