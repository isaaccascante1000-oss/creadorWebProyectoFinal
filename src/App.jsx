import { AppRouter } from './routes/AppRouter';
import { AccessibilityProvider } from './context/AccessibilityContext';
import './App.css';

function App() {
  return (
    <AccessibilityProvider>
      <AppRouter />
    </AccessibilityProvider>
  );
}

export default App;