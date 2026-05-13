import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';

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

          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/modulos" element={<Navigate to="/home" replace />} />
          <Route path="/onboarding" element={<Navigate to="/home" replace />} />
          <Route path="/guia/:guideId" element={<Navigate to="/home" replace />} />
          <Route path="/admin/*" element={<Navigate to="/home" replace />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
