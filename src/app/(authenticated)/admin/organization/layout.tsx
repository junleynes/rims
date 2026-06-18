import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';

export default async function OrganizationLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await requireSession();
  } catch {
    redirect('/');
  }

  if (user.role !== 'Admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
