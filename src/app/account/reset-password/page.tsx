import AccountRequestForm from "@/components/account/AccountRequestForm";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return <AccountRequestForm kind="reset" />;
}
