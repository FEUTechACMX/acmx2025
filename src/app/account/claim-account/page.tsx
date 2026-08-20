import AccountRequestForm from "@/components/account/AccountRequestForm";

export const dynamic = "force-dynamic";

export default function ClaimAccountPage() {
  return <AccountRequestForm kind="claim" />;
}
