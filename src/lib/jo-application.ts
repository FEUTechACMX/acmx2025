import { randomBytes } from "crypto";
import { check, hasErrors, integerBetween, oneOf, required, str, type Validated } from "@/lib/validation";

export function newShareToken(): string {
  return randomBytes(12).toString("hex");
}

export function validateJOApplication(
  input: Record<string, unknown>,
  questionIds: string[],
  committeeIds: string[]
): Validated<{ targetCommitteeId: string; answers: { questionId: string; value: number }[] }> {
  const targetErrors = check(
    { targetCommitteeId: input.targetCommitteeId },
    { targetCommitteeId: [required("Target committee"), oneOf("Target committee", committeeIds)] }
  );
  if (hasErrors(targetErrors)) return { ok: false, errors: targetErrors };

  const raw = input.answers && typeof input.answers === "object" && !Array.isArray(input.answers)
    ? (input.answers as Record<string, unknown>)
    : {};

  const answers: { questionId: string; value: number }[] = [];
  const errors: Record<string, string> = {};
  for (const id of questionIds) {
    const result = check(
      { value: raw[id] },
      { value: [required("Answer"), integerBetween("Answer", 1, 7)] }
    );
    if (result.value) {
      errors[id] = result.value;
      continue;
    }
    answers.push({ questionId: id, value: Number(raw[id]) });
  }
  if (hasErrors(errors)) return { ok: false, errors };
  if (answers.length !== questionIds.length) {
    return { ok: false, errors: { answers: "Answer every statement." } };
  }

  return {
    ok: true,
    value: { targetCommitteeId: str(input.targetCommitteeId), answers },
  };
}
