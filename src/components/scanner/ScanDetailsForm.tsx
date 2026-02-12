"use client";

import React from "react";

export interface ScanResult {
  payload?: {
    studentID: string;
    firstName: string;
    middleName: string;
    lastName: string;
    yearLevel: string;
    degreeProgram: string;
  };
  user?: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

type ScanDetailsFormProps = {
  loading?: boolean;
  error?: string | null;
  result?: ScanResult | null;
  successMessage?: string | null;
};

export default function ScanDetailsForm({
  loading = false,
  error = null,
  result = null,
  successMessage = null,
}: ScanDetailsFormProps) {
  // Empty state
  if (!loading && !error && !result && !successMessage) {
    return (
      <div className="border-2 border-white/10 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-white/40 font-['supermolot'] text-sm uppercase tracking-wider text-center">
          Scan a QR code to view details
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="border-2 border-[#CD78EC]/30 p-6 min-h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#CD78EC] border-t-transparent animate-spin" />
          <p className="text-[#CD78EC] font-['supermolot'] text-sm uppercase tracking-wider">
            Processing...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border-2 border-red-500/30 bg-red-500/5 p-6 min-h-[200px]">
        <div className="flex flex-col gap-2">
          <span className="text-red-400 font-['supermolot'] text-xs uppercase tracking-wider">
            Error
          </span>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Success message
  if (successMessage) {
    return (
      <div className="border-2 border-emerald-500/30 bg-emerald-500/5 p-6 min-h-[200px]">
        <div className="flex flex-col items-center justify-center gap-2 h-full">
          <div className="w-12 h-12 border-2 border-emerald-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-emerald-400 font-['supermolot'] text-sm uppercase tracking-wider text-center">
            {successMessage}
          </p>
        </div>
      </div>
    );
  }

  // Result display
  const { payload, user } = result || {};
  const displayData = user || payload;

  if (!displayData) {
    return (
      <div className="border-2 border-white/10 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-white/40 font-['supermolot'] text-sm uppercase tracking-wider">
          No data available
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#CD78EC]/30 bg-[#CD78EC]/5 p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CD78EC]/20 pb-3">
          <span className="text-[#CD78EC] font-['supermolot'] text-xs uppercase tracking-wider">
            Scanned Details
          </span>
          {user?.role && (
            <span className="px-2 py-1 bg-[#CD78EC]/20 text-[#CD78EC] text-xs uppercase font-['supermolot']">
              {user.role}
            </span>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <DetailItem
            label="Student ID"
            value={user?.studentId || payload?.studentID}
          />
          <DetailItem
            label="Name"
            value={
              displayData.firstName && displayData.lastName
                ? `${displayData.firstName} ${displayData.lastName}`
                : undefined
            }
          />
          {payload?.yearLevel && (
            <DetailItem label="Year Level" value={payload.yearLevel} />
          )}
          {payload?.degreeProgram && (
            <DetailItem label="Program" value={payload.degreeProgram} />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-white/40 text-xs uppercase tracking-wider font-['supermolot']">
        {label}
      </span>
      <span className="text-white text-sm">{value}</span>
    </div>
  );
}
