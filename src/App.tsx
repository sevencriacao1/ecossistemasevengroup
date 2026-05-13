import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { GuidePage } from './pages/GuidePage';
import { AdminUsers } from './pages/admin/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/home"
            element={(
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/guia/seven"
            element={(
              <ProtectedRoute company="Seven">
                <GuidePage guideId="seven" />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/guia/arqo"
            element={(
              <ProtectedRoute company="ARQO">
                <GuidePage guideId="arqo" />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/guia/nexa"
            element={(
              <ProtectedRoute company="Nexa">
                <GuidePage guideId="nexa" />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/usuarios"
            element={(
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            )}
          />

          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/modulos" element={<Navigate to="/home" replace />} />
          <Route path="/onboarding" element={<Navigate to="/home" replace />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
