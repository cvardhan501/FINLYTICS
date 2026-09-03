import { NextResponse } from 'next/server';

const defaultCategories = [
  { id: 'cat_1', name: 'Food', type: 'expense', icon: 'utensils', color: '#187A4E' },
  { id: 'cat_2', name: 'Transport', type: 'expense', icon: 'car', color: '#0284C7' },
  { id: 'cat_3', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#D97706' },
  { id: 'cat_4', name: 'Bills', type: 'expense', icon: 'file-text', color: '#DC2626' },
  { id: 'cat_5', name: 'Entertainment', type: 'expense', icon: 'film', color: '#9333EA' },
  { id: 'cat_6', name: 'Health', type: 'expense', icon: 'heart-pulse', color: '#16A34A' },
  { id: 'cat_7', name: 'Salary', type: 'income', icon: 'briefcase', color: '#16A34A' },
  { id: 'cat_8', name: 'Freelance', type: 'income', icon: 'laptop', color: '#0284C7' },
  { id: 'cat_9', name: 'Gift', type: 'income', icon: 'gift', color: '#D97706' },
  { id: 'cat_10', name: 'Other', type: 'expense', icon: 'tag', color: '#6B7280' },
];

export async function GET() {
  return NextResponse.json({ categories: defaultCategories });
}
