import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PizzaCalculator from './components/PizzaCalculator';
import PartyMode from './components/PartyMode';
import Navigation from './components/Navigation';
import PrivacyPage from './components/PrivacyPage';
import Footer from './components/Footer';
import Community from './components/Community';
import PizzaPage from './components/PizzaPage';
import AdminPage from './components/AdminPage';
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
              <Route path="/community" element={<Community />} />
              <Route path="/pizza/:id" element={<PizzaPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
