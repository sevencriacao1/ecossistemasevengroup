import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Company, useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  company?: Company;
}

export function ProtectedRoute({ children, requireAdmin = false, company }: ProtectedRouteProps) {
  const { session, profile, isLoading, canAccessCompany } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  if (company && !canAccessCompany(company)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
