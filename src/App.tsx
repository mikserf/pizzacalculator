import React from 'react';
import PizzaCalculator from './components/PizzaCalculator';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#F8F7F4] dark:bg-gray-900 text-[#333333] dark:text-gray-100 antialiased transition-colors duration-200">
        <ThemeToggle />
        <PizzaCalculator />
      </div>
    </ThemeProvider>
  );
}

export default App;