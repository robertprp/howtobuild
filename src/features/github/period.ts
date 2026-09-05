export type TrendingPeriod = 'week' | 'month' | 'seven-weeks'
export const periodLabel = {
  week: 'Last 7 days',
  month: 'Last 30 days',
  'seven-weeks': 'Last 7 weeks',
} as const
export const periodDelta = {
  week: 'absolute7d',
  month: 'absolute30d',
  'seven-weeks': 'absolute49d',
} as const
export const periodStart = {
  week: 'weeklyWindowStart',
  month: 'monthlyWindowStart',
  'seven-weeks': 'sevenWeekWindowStart',
} as const
