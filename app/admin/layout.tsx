import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { checkAdmin } from '@/lib/admin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const adminCheck = await checkAdmin(token);
  if (!adminCheck.isAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}

