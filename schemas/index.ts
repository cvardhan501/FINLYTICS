import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  currency: z.string().default('INR'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const transactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  account: z.string().default('Bank'),
  paymentMethod: z.string().default('UPI'),
  date: z.string().or(z.date()),
  time: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  amount: z.number().positive('Budget amount must be positive'),
  period: z.enum(['monthly', 'custom']).default('monthly'),
  category: z.string().optional(),
  warningThreshold: z.number().min(50).max(100).default(80),
});

export const loanSchema = z.object({
  personName: z.string().min(1, 'Person name is required'),
  type: z.enum(['given', 'borrowed']),
  principal: z.number().positive('Principal amount must be greater than 0'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').default(0),
  interestType: z.enum(['simple', 'compound']).default('simple'),
  compoundingFrequency: z.enum(['annual', 'half_yearly', 'quarterly', 'monthly']).default('annual'),
  startDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  durationMonths: z.number().positive().default(12),
  notes: z.string().optional(),
});

export const loanPaymentSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.string().default('UPI'),
  notes: z.string().optional(),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be greater than 0'),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().or(z.date()),
  category: z.string().default('General'),
  notes: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const savingsTransactionSchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().or(z.date()),
  goalId: z.string().optional().nullable(),
  paymentMethod: z.string().default('UPI'),
  note: z.string().optional(),
  attachment: z.string().optional(),
});

export const recurringTransactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['expense', 'income']),
  category: z.string().min(1, 'Category is required'),
  account: z.string().default('Bank'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  startDate: z.string().or(z.date()),
  notes: z.string().optional(),
});

export const billSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().or(z.date()),
  isSubscription: z.boolean().default(false),
  frequency: z.enum(['monthly', 'yearly', 'custom']).default('monthly'),
  account: z.string().default('Bank'),
  notes: z.string().optional(),
});

export const logBookEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  date: z.string().or(z.date()),
  category: z.enum(['personal', 'financial', 'loan', 'goal', 'reminder', 'other']).default('financial'),
  linkedTransactionId: z.string().optional(),
  linkedLoanId: z.string().optional(),
  isPrivate: z.boolean().default(true),
});
