/** One officer as the public page sees them. */
export type OfficerDTO = {
  id: string;
  /** The raw enum value — used for ranking, not for display. */
  role: string;
  /** The human label, e.g. "VP · Internal". */
  roleTitle: string;
  name: string;
  tagline: string | null;
  photo: string | null;
  /** Composed from the account's degree programme and year. */
  /** The account degree programme, verbatim. */
  course: string;
  /** 1-4, from the account. Rendered as "3rd Year".*/
  yearLevel: number;
  since: string | null;
  email: string;
  instagram: string | null;
  linkedin: string | null;
  order: number;
};
