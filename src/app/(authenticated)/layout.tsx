import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { AuthProvider } from '@/components/auth-context';
import { BudgetProvider } from '@/components/budget-context';
import { SystemDataProvider } from '@/components/system-data-context';
import { ClientLayout } from '@/components/layout/client-layout';

// This layout runs on the server — iron-session verifies the cookie.
// No valid session = immediate server-side redirect to /.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireSession();
  } catch {
    redirect('/');
  }

  return (
    <AuthProvider>
      <SystemDataProvider>
        <BudgetProvider>
          <ClientLayout>{children}</ClientLayout>
        </BudgetProvider>
      </SystemDataProvider>
    </AuthProvider>
  );
}
