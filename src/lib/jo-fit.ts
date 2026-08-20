/** Sum Likert answers per committee. Three questions × 1..7 = max 21. */
export type FitQuestion = { id: string; committeeId: string };

export type FitScore = { committeeId: string; total: number };

export function computeBestFit(
  answers: Record<string, number>,
  questions: FitQuestion[]
): FitScore[] {
  const totals = new Map<string, number>();
  for (const q of questions) {
    const v = answers[q.id];
    if (!Number.isInteger(v) || v < 1 || v > 7) continue;
    totals.set(q.committeeId, (totals.get(q.committeeId) ?? 0) + v);
  }
  return [...totals.entries()]
    .map(([committeeId, total]) => ({ committeeId, total }))
    .sort((a, b) => b.total - a.total);
}
