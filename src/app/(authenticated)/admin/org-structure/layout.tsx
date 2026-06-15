import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';

// Org structure is visible to Admins and Managers (read access for Managers,
// full edit access controlled at the component level)
export default async function OrgStructureLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await requireSession();
  } catch {
    redirect('/');
  }

  if (!['Admin', 'Manager', 'AVP', 'VP'].includes(user.role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
