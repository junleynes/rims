import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import type { Role } from '@/lib/types';

// This layout wraps every route under /admin/*, including ones meant for the
// whole management tier (Reports, Org Structure) as well as true admin-only
// sections (User Management, System Updates, Organization, System Settings).
// It only enforces the baseline "must be at least management tier" check.
// The Admin-only sections each have their own nested layout that further
// restricts to role === 'Admin' — see admin/users/layout.tsx etc.
const MANAGEMENT_ROLES: Role[] = ['Admin', 'Manager', 'AVP', 'VP', 'Viewer'];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await requireSession();
  } catch {
    redirect('/');
  }

  if (!MANAGEMENT_ROLES.includes(user.role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
