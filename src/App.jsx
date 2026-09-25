import { AppRouter } from './routes/AppRouter';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppRouter />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;