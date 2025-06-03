'use client';

import { redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
