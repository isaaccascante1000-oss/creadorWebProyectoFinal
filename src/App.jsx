import { AppRouter } from './routes/AppRouter';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { SelectionProvider } from './context/SelectionProvider';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <SelectionProvider>
          <AppRouter />
        </SelectionProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;