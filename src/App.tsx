import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PizzaCalculator from './components/PizzaCalculator';
import PartyMode from './components/PartyMode';
import Navigation from './components/Navigation';
import PrivacyPage from './components/PrivacyPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen page-grain bg-paper-linen dark:bg-char-900 text-ink dark:text-char-100 antialiased transition-colors duration-200">
            <Navigation />
            <Routes>
              <Route path="/" element={<PizzaCalculator />} />
              <Route path="/party-mode" element={<PartyMode />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
