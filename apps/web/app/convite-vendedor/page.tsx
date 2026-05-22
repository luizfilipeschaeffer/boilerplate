import { SellerInviteClient } from "@/components/seller-invite-client";

export default function ConviteVendedorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <SellerInviteClient tokenPromise={searchParams.then((p) => p.token ?? "")} />
  );
}
