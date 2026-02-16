import SiteLayout from "@/components/layout/SiteLayout";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout variant="checkout">{children}</SiteLayout>
}
