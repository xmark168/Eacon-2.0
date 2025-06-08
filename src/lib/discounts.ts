// Discount utility functions
export type AccountType = 'FREE' | 'CREATOR' | 'PRO' | 'PREMIUM';

export interface DiscountInfo {
  discountPercent: number;
  originalAmount: number;
  discountedAmount: number;
  savings: number;
}

export function getDiscountPercent(accountType: AccountType): number {
  switch (accountType) {
    case 'CREATOR':
      return 5; // 5% discount
    case 'PRO': 
      return 7; // 7% discount
    case 'PREMIUM':
      return 10; // 10% discount
    case 'FREE':
    default:
      return 0; // No discount
  }
}

export function calculateDiscount(originalAmount: number, accountType: AccountType): DiscountInfo {
  const discountPercent = getDiscountPercent(accountType);
  const savings = Math.floor(originalAmount * discountPercent / 100);
  const discountedAmount = originalAmount - savings;

  return {
    discountPercent,
    originalAmount,
    discountedAmount,
    savings
  };
}

export function getAccountUpgradeFromPackage(packageType: string): AccountType | null {
  if (packageType.toLowerCase().includes('creator')) {
    return 'CREATOR';
  } else if (packageType.toLowerCase().includes('pro')) {
    return 'PRO';
  } else if (packageType.toLowerCase().includes('premium')) {
    return 'PREMIUM';
  }
  return null; // Custom amount doesn't upgrade account
}

export function getAccountTypeLabel(accountType: AccountType): string {
  switch (accountType) {
    case 'FREE':
      return 'Free Account';
    case 'CREATOR':
      return 'Creator Plan';
    case 'PRO':
      return 'Pro Plan';
    case 'PREMIUM':
      return 'Premium Plan';
    default:
      return 'Unknown Plan';
  }
}

export function getAccountTypeColor(accountType: AccountType): string {
  switch (accountType) {
    case 'FREE':
      return 'text-gray-600 bg-gray-100';
    case 'CREATOR':
      return 'text-blue-600 bg-blue-100';
    case 'PRO':
      return 'text-purple-600 bg-purple-100';
    case 'PREMIUM':
      return 'text-gold-600 bg-gold-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
} 