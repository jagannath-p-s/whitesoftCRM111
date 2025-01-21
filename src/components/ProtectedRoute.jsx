// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();

  const checkAuth = () => {
    const session = localStorage.getItem('session');
    if (!session) {
      return false;
    }

    try {
      const parsedSession = JSON.parse(session);
      if (new Date(parsedSession.expiresAt) > new Date()) {
        return true;
      }
      // Session expired
      localStorage.removeItem('session');
      localStorage.removeItem('userPermissions');
      return false;
    } catch {
      // Invalid session data
      localStorage.removeItem('session');
      localStorage.removeItem('userPermissions');
      return false;
    }
  };

  if (!checkAuth()) {
    // Redirect to login with the attempted path
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default ProtectedRoute;