import { AppRouter } from './routes/AppRouter';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { SelectionProvider } from './context/SelectionProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AccessibilityProvider>
          <SelectionProvider>
            <AppRouter />
          </SelectionProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;