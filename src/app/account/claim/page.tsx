import { Suspense } from "react";
import AccountClaimForm from "@/components/account/AccountClaimForm";
import {
  findAccountTokenByRaw,
  isTokenRedeemable,
} from "@/lib/account-tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AccountClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const row = token ? await findAccountTokenByRaw(token) : null;
  const tokenValid = !!row && isTokenRedeemable(row);

  return (
    <Suspense fallback={null}>
      <AccountClaimForm tokenValid={tokenValid} />
    </Suspense>
  );
}
