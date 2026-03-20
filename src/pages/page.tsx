import { useOutletContext, Navigate } from 'react-router';

export default function HomePage() {
  const { accessToken } = useOutletContext<{ accessToken: string }>();

  if (accessToken) {
    return <Navigate to="/infra-management/monitoring-dashboard" />;
  }

  return <Navigate to="/login" />;
}
