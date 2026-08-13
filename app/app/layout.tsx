import { Toaster } from "sonner";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Phase 4 adds sidebar + navbar + auth guard here. The Toaster lives in
  // this group (not the root layout) so sonner never ships to the landing
  // page bundle.
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
