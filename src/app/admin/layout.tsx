export const dynamic = "force-dynamic";

import { AuthProvider } from "@/lib/firebase/auth-context";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin — STL Yard Games",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
