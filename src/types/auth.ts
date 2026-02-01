export type safeUser =
  | {
      studentId: string;
      name: string;
      email: string;
      role: "ADMIN" | "JUNIOR_OFFICER" | "MEMBER" | "EXECUTIVES";
      points: number;
    }
  | undefined;
