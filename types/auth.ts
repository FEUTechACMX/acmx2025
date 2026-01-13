export type safeUser =
  | {
      studentId: string;
      name: string;
      email: string;
      role: string;
      points: number;
    }
  | undefined;
