import React, { useState } from 'react';
import { PizzaState } from '../types/pizza';
import { getDefaultBakeTime, calculateRecipe } from '../utils/calculations';
import CalculatorControls from './CalculatorControls';
import RecipeDisplay from './RecipeDisplay';
import { useLang } from '../hooks/useLang';

const T = {
  sv: { title: 'Pizzadegskalkylator', subtitle: 'Mjöl, vatten, salt, jäst.' },
  en: { title: 'Pizza Dough Calculator', subtitle: 'Flour, water, salt, yeast.' },
} as const;

const PizzaCalculator: React.FC = () => {
  const [state, setState] = useState<PizzaState>({
    doughBallWeight: 265,
    numPizzas: 6,
    bakeTime: getDefaultBakeTime(),
    roomTemp: 20,
    moreWater: false,
    testTubeDough: false,
    desiredDoughTemp: 20,
    frictionFactor: 0.8,
    waterPercent: 66,
    saltPercent: 2.8,
    isColdFerment: false,
    coldFermentHours: 24,
    fridgeTemp: 4,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const t = T[useLang()];

  const updateState = (updates: Partial<PizzaState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  const recipe = calculateRecipe(state);

  return (
    <div className="container mx-auto max-w-4xl p-8 md:p-12 pt-20 md:pt-12">
      <header className="text-center mb-12">
        <p className="mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-brand-600 dark:text-brand-300">
          Farina · Acqua · Sale · Lievito
        </p>
        <h1 className="font-display text-5xl font-bold mb-3 text-ink dark:text-char-100">{t.title}</h1>
        <p className="font-display text-xl font-normal italic text-ink-muted dark:text-char-400">{t.subtitle}</p>
        <div className="mx-auto mt-6 h-[5px] w-16 border-y border-ink/50 dark:border-char-400/50" aria-hidden="true" />
      </header>

      <div className="md:grid md:grid-cols-2 md:gap-16">
        <CalculatorControls
          state={state}
          onUpdate={updateState}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((v) => !v)}
        />
        <RecipeDisplay state={state} recipe={recipe} showAdvanced={showAdvanced} />
      </div>
    </div>
  );
};

export default PizzaCalculator;
