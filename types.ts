
export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export type AppTab = 'home' | 'stats' | 'settings';

export interface Budget {
  limit: number;
  period: string;
}
