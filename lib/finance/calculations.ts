export type InterestType = 'simple' | 'compound';
export type CompoundingFrequency = 'annual' | 'half_yearly' | 'quarterly' | 'monthly';

export interface InterestCalculationResult {
  principal: number;
  rate: number;
  durationYears: number;
  interestType: InterestType;
  compoundingFrequency?: CompoundingFrequency;
  interestAmount: number;
  totalAmount: number;
}

export function calculateInterest(params: {
  principal: number;
  rate: number; // percentage e.g. 12 for 12%
  durationYears: number;
  interestType: InterestType;
  compoundingFrequency?: CompoundingFrequency;
}): InterestCalculationResult {
  const { principal, rate, durationYears, interestType, compoundingFrequency = 'annual' } = params;
  
  if (principal <= 0 || rate < 0 || durationYears <= 0) {
    return {
      principal: Math.max(0, principal),
      rate: Math.max(0, rate),
      durationYears: Math.max(0, durationYears),
      interestType,
      compoundingFrequency,
      interestAmount: 0,
      totalAmount: Math.max(0, principal),
    };
  }

  let totalAmount = 0;
  let interestAmount = 0;

  if (interestType === 'simple') {
    interestAmount = (principal * rate * durationYears) / 100;
    totalAmount = principal + interestAmount;
  } else {
    // Compound interest
    let n = 1; // times per year
    switch (compoundingFrequency) {
      case 'monthly':
        n = 12;
        break;
      case 'quarterly':
        n = 4;
        break;
      case 'half_yearly':
        n = 2;
        break;
      case 'annual':
      default:
        n = 1;
        break;
    }

    const r = rate / 100;
    totalAmount = principal * Math.pow(1 + r / n, n * durationYears);
    interestAmount = totalAmount - principal;
  }

  return {
    principal: Number(principal.toFixed(2)),
    rate: Number(rate.toFixed(2)),
    durationYears: Number(durationYears.toFixed(2)),
    interestType,
    compoundingFrequency,
    interestAmount: Number(interestAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

export function calculateBudgetStatus(spent: number, budgetAmount: number, warningThresholdPercent: number = 80) {
  if (budgetAmount <= 0) {
    return {
      spent,
      budgetAmount,
      remaining: 0,
      percentage: 100,
      isOverBudget: true,
      isWarning: true,
    };
  }

  const remaining = budgetAmount - spent;
  const percentage = Math.min(999, Math.round((spent / budgetAmount) * 100));
  const isOverBudget = spent > budgetAmount;
  const isWarning = percentage >= warningThresholdPercent && !isOverBudget;

  return {
    spent: Number(spent.toFixed(2)),
    budgetAmount: Number(budgetAmount.toFixed(2)),
    remaining: Number(remaining.toFixed(2)),
    percentage,
    isOverBudget,
    isWarning,
  };
}

export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const symbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    CAD: 'CA$',
  };
  
  const symbol = symbolMap[currencyCode] || `${currencyCode} `;
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formattedNumber}`;
}
