"use client";

import React from "react";
import { Field } from "@/components/ds";
import type { MembershipPersonInput } from "@/lib/membership";
import {
  SCHOOL_EMAIL_DOMAIN,
  composeSchoolEmail,
  schoolEmailLocalPart,
} from "@/lib/school-email";
import { PASSWORD_MIN } from "@/lib/validation";
import { useDS } from "@/components/ds";
import { type as t } from "@/styles/design-system";

const EMPTY: MembershipPersonInput = {
  studentId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  yearLevel: 1,
  degreeProgram: "",
  schoolEmail: "",
  personalEmail: "",
  contactNumber: "",
  facebookLink: "",
  discordName: "",
  password: "",
};

export function emptyPerson(): MembershipPersonInput {
  return { ...EMPTY };
}

export function PersonFields({
  idPrefix,
  value,
  errors,
  onChange,
  includePassword = true,
}: {
  idPrefix: string;
  value: MembershipPersonInput;
  errors: Record<string, string | undefined>;
  onChange: (next: MembershipPersonInput) => void;
  includePassword?: boolean;
}) {
  const { c } = useDS();
  const set = (key: keyof MembershipPersonInput, v: string | number) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1.25rem" }}>
      <Field
        id={`${idPrefix}-studentId`}
        label="Student number"
        variant="boxed"
        value={value.studentId}
        error={errors.studentId}
        onChange={(e) => set("studentId", e.target.value)}
      />
      <Field
        id={`${idPrefix}-yearLevel`}
        label="Year level"
        variant="boxed"
        type="number"
        min={1}
        max={8}
        value={String(value.yearLevel)}
        error={errors.yearLevel}
        onChange={(e) => set("yearLevel", Number(e.target.value))}
      />
      <Field
        id={`${idPrefix}-firstName`}
        label="First name"
        variant="boxed"
        value={value.firstName}
        error={errors.firstName}
        onChange={(e) => set("firstName", e.target.value)}
      />
      <Field
        id={`${idPrefix}-middleName`}
        label="Middle name"
        variant="boxed"
        value={value.middleName}
        error={errors.middleName}
        hint="Optional"
        onChange={(e) => set("middleName", e.target.value)}
      />
      <Field
        id={`${idPrefix}-lastName`}
        label="Last name"
        variant="boxed"
        value={value.lastName}
        error={errors.lastName}
        onChange={(e) => set("lastName", e.target.value)}
      />
      <Field
        id={`${idPrefix}-suffix`}
        label="Suffix"
        variant="boxed"
        value={value.suffix}
        error={errors.suffix}
        hint="Optional"
        onChange={(e) => set("suffix", e.target.value)}
      />
      <Field
        id={`${idPrefix}-degreeProgram`}
        label="Degree program"
        variant="boxed"
        value={value.degreeProgram}
        error={errors.degreeProgram}
        onChange={(e) => set("degreeProgram", e.target.value)}
      />
      <Field
        id={`${idPrefix}-contactNumber`}
        label="Contact number"
        variant="boxed"
        value={value.contactNumber}
        error={errors.contactNumber}
        onChange={(e) => set("contactNumber", e.target.value)}
      />
      <Field
        id={`${idPrefix}-schoolEmail`}
        label="School email"
        variant="boxed"
        value={schoolEmailLocalPart(value.schoolEmail)}
        error={errors.schoolEmail}
        hint={`Always ${SCHOOL_EMAIL_DOMAIN} — local part only.`}
        trailing={
          <span style={{ ...t.bodySmall, color: c.muted, whiteSpace: "nowrap" }}>
            {SCHOOL_EMAIL_DOMAIN}
          </span>
        }
        onChange={(e) => set("schoolEmail", composeSchoolEmail(e.target.value))}
        autoComplete="off"
        inputMode="text"
      />
      <Field
        id={`${idPrefix}-personalEmail`}
        label="Personal email"
        variant="boxed"
        type="email"
        value={value.personalEmail}
        error={errors.personalEmail}
        onChange={(e) => set("personalEmail", e.target.value)}
      />
      <Field
        id={`${idPrefix}-facebookLink`}
        label="Facebook link"
        variant="boxed"
        value={value.facebookLink}
        error={errors.facebookLink}
        onChange={(e) => set("facebookLink", e.target.value)}
      />
      <Field
        id={`${idPrefix}-discordName`}
        label="Discord username"
        variant="boxed"
        value={value.discordName}
        error={errors.discordName}
        hint="Optional"
        onChange={(e) => set("discordName", e.target.value)}
      />
      {includePassword && (
        <Field
          id={`${idPrefix}-password`}
          label="Password"
          variant="boxed"
          type="password"
          value={value.password}
          error={errors.password}
          hint={`At least ${PASSWORD_MIN} characters, with a mix of letter cases, numbers, or symbols. Used after an officer approves you.`}
          onChange={(e) => set("password", e.target.value)}
        />
      )}
    </div>
  );
}
