import SiteLayout from "@/components/layout/SiteLayout";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout variant="shop">{children}</SiteLayout>
}
