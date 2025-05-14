import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ReactNode } from 'react';

interface PrivateRouteProps {
  redirectTo?: string;
  children?: ReactNode;
}

export const PrivateRoute = ({ redirectTo = '/login', children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading state while we determine if the user is logged in
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If children are provided, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
}; 