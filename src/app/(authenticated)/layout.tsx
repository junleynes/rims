import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { AuthProvider } from '@/components/auth-context';
import { BudgetProvider } from '@/components/budget-context';
import { SystemDataProvider } from '@/components/system-data-context';
import { ClientLayout } from '@/components/layout/client-layout';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let sessionUser;
  try {
    sessionUser = await requireSession();
  } catch {
    redirect('/');
  }

  return (
    <AuthProvider initialUser={sessionUser}>
      <SystemDataProvider>
        <BudgetProvider>
          <ClientLayout>{children}</ClientLayout>
        </BudgetProvider>
      </SystemDataProvider>
    </AuthProvider>
  );
}
