import React, { useState } from 'react';
import { PizzaState } from '../types/pizza';

interface CalculatorControlsProps {
  state: PizzaState;
  onUpdate: (updates: Partial<PizzaState>) => void;
}

const CalculatorControls: React.FC<CalculatorControlsProps> = ({ state, onUpdate }) => {
  const handleDoughWeightChange = (delta: number) => {
    const newValue = state.doughBallWeight + delta;
    if (newValue >= 200) {
      onUpdate({ doughBallWeight: newValue });
    }
  };

  const handlePizzaSliderChange = (value: number) => {
    onUpdate({ numPizzas: value });
  };

  const [showFrictionInfo, setShowFrictionInfo] = useState(false);

  return (
    <div className="controls space-y-8">
      <div>
        <label htmlFor="doughBallWeight" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Desired Dough Ball Weight (g)
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDoughWeightChange(-5)}
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            -
          </button>
          <input
            type="number"
            id="doughBallWeight"
            value={state.doughBallWeight}
            onChange={(e) => onUpdate({ doughBallWeight: parseInt(e.target.value, 10) })}
            step="5"
            min="200"
            className="flex-grow bg-white dark:bg-gray-800 rounded-lg p-3 text-center font-bold border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white"
          />
          <button
            type="button"
            onClick={() => handleDoughWeightChange(5)}
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="numPizzas" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          How many pizzas to make?
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            id="numPizzasSlider"
            min="1"
            max="12"
            value={state.numPizzas}
            onChange={(e) => handlePizzaSliderChange(parseInt(e.target.value, 10))}
            className="w-full pizza-slider"
          />
          <input
            type="number"
            id="numPizzas"
            value={state.numPizzas}
            onChange={(e) => onUpdate({ numPizzas: parseInt(e.target.value, 10) })}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 w-20 text-center font-bold border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white"
          />
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />
      
      <h3 className="font-display text-xl font-bold pt-2 dark:text-white">Baking Conditions</h3>

      <div>
        <label htmlFor="bakeTime" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          When do you want to bake?
        </label>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            id="bakeTime"
            value={state.bakeTime}
            onChange={(e) => onUpdate({ bakeTime: e.target.value })}
            className="flex-grow bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white"
          />
          <button
            type="button"
            onClick={() => {
              const currentTime = new Date(state.bakeTime);
              const newTime = new Date(currentTime.getTime() + (24 * 60 * 60 * 1000));
              const year = newTime.getFullYear();
              const month = String(newTime.getMonth() + 1).padStart(2, '0');
              const day = String(newTime.getDate()).padStart(2, '0');
              const hour = String(newTime.getHours()).padStart(2, '0');
              const minute = String(newTime.getMinutes()).padStart(2, '0');
              onUpdate({ bakeTime: `${year}-${month}-${day}T${hour}:${minute}` });
            }}
            className="px-4 py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-semibold whitespace-nowrap"
          >
            +24h
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="roomTemp" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Room Temperature (°C)
        </label>
        <div
          id="roomTemp"
          className="flex gap-2 overflow-x-auto horizontal-scroll py-2"
          role="listbox"
          aria-label="Room Temperature"
        >
          {Array.from({ length: 8 }, (_, i) => i + 19).map((temp) => {
            const selected = state.roomTemp === temp;
            return (
              <button
                key={temp}
                type="button"
                role="option"
                aria-selected={selected}
                aria-pressed={selected}
                onClick={() => onUpdate({ roomTemp: temp })}
                className={[
                  "px-4 py-2 rounded-full border whitespace-nowrap select-none",
                  "min-w-[64px] text-center font-semibold",
                  selected
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600",
                ].join(" ")}
              >
                {temp}°C
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
        <label htmlFor="moreWater" className="font-semibold text-gray-700 dark:text-gray-200">
          High Hydration (69%)
        </label>
        <input
          type="checkbox"
          id="moreWater"
          checked={state.moreWater}
          onChange={(e) => onUpdate({ moreWater: e.target.checked })}
          className="h-6 w-6 rounded text-orange-600 border-gray-300 dark:border-gray-600 focus:ring-orange-500 dark:bg-gray-700"
        />
      </div>
      
      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="space-y-6">
        <h3 className="font-display text-xl font-bold dark:text-white">Advanced Settings</h3>
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
          <label htmlFor="testTubeDough" className="font-semibold text-gray-700 dark:text-gray-200">
            Use 80g dough for test tube
          </label>
          <input
            type="checkbox"
            id="testTubeDough"
            checked={state.testTubeDough}
            onChange={(e) => onUpdate({ testTubeDough: e.target.checked })}
            className="h-6 w-6 rounded text-orange-600 border-gray-300 dark:border-gray-600 focus:ring-orange-500 dark:bg-gray-700"
          />
        </div>
        <div>
          <label htmlFor="desiredDoughTemp" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Desired Final Dough Temp (°C)
          </label>
          <input
            type="number"
            id="desiredDoughTemp"
            value={state.desiredDoughTemp}
            onChange={(e) => onUpdate({ desiredDoughTemp: parseFloat(e.target.value) })}
            className="w-full bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="frictionFactor" className="block text-sm font-semibold text-gray-600 dark:text-gray-300">
              Mixer Friction Factor
            </label>
            <button
              type="button"
              aria-label="What is mixer friction?"
              onClick={() => setShowFrictionInfo(true)}
              className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M11.25 11.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-4.5ZM12 6.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-8.25a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <input
            type="number"
            id="frictionFactor"
            value={state.frictionFactor}
            onChange={(e) => onUpdate({ frictionFactor: parseFloat(e.target.value) })}
            step="0.1"
            className="w-full bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white"
          />
        </div>
      </div>
      {showFrictionInfo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="friction-info-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFrictionInfo(false)} />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 shadow-xl m-0 sm:m-4">
            <div className="flex items-start justify-between gap-4">
              <h2 id="friction-info-title" className="text-lg sm:text-xl font-bold">What is Mixer Friction? 🤔</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowFrictionInfo(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-6">
              <p>Think of it like rubbing your hands together to warm them up. When you mix dough, the friction between the dough, hook, and bowl creates heat. The Mixer Friction Factor is just a number that tells you how much heat your specific mixer creates.</p>
              <div>
                <h3 className="font-semibold">Why Does It Matter?</h3>
                <p>Yeast is picky about temperature. Controlling your final dough temperature is the secret to perfect fermentation and predictable results every time you bake. By knowing your friction factor, you can adjust your water temperature perfectly to hit that "sweet spot" for your dough.</p>
              </div>
              <div>
                <h3 className="font-semibold">How to Find Your Friction Factor (One-Time Test)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-semibold">Measure Temps</span>: Before mixing, get the temperature of your Room, Flour, and Water.</li>
                  <li><span className="font-semibold">Mix</span>: Make your dough as you normally would.</li>
                  <li><span className="font-semibold">Final Dough Temp</span>: As soon as it's done mixing, take the temperature of the dough.</li>
                </ul>
                <div className="mt-3">
                  <h4 className="font-semibold">Calculate</h4>
                  <p>Use this simple formula:</p>
                  <div className="mt-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 font-semibold">
                    Friction Factor = (3 × Final Dough Temp) − (Room Temp + Flour Temp + Water Temp)
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFrictionInfo(false)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorControls;
