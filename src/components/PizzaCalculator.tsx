import React, { useState, useEffect } from 'react';
import { PizzaState } from '../types/pizza';
import { getDefaultBakeTime, calculateRecipe } from '../utils/calculations';
import CalculatorControls from './CalculatorControls';
import RecipeDisplay from './RecipeDisplay';

const PizzaCalculator: React.FC = () => {
  const [state, setState] = useState<PizzaState>({
    doughBallWeight: 265,
    numPizzas: 6,
    bakeTime: getDefaultBakeTime(),
    roomTemp: 20,
    moreWater: false,
    testTubeDough: false,
    desiredDoughTemp: 20,
    frictionFactor: 0.8
  });

  const updateState = (updates: Partial<PizzaState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  const recipe = calculateRecipe(state);

  return (
    <div className="container mx-auto max-w-4xl p-8 md:p-12 pt-20 md:pt-12">
      <header className="text-center mb-12">
        <h1 className="font-display text-5xl font-bold mb-2 text-gray-900 dark:text-white">Pizza Dough Calculator</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">Flour, water, salt, yeast.</p>
      </header>

      <div className="md:grid md:grid-cols-2 md:gap-16">
        <CalculatorControls state={state} onUpdate={updateState} />
        <RecipeDisplay numPizzas={state.numPizzas} recipe={recipe} />
      </div>
    </div>
  );
};

export default PizzaCalculator;
