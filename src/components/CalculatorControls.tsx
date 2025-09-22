import React from 'react';
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
        <select
          id="roomTemp"
          value={state.roomTemp}
          onChange={(e) => onUpdate({ roomTemp: parseInt(e.target.value, 10) })}
          className="w-full bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white"
        >
          {Array.from({ length: 8 }, (_, i) => i + 19).map(temp => (
            <option key={temp} value={temp}>{temp}°C</option>
          ))}
        </select>
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
          <label htmlFor="frictionFactor" className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Mixer Friction Factor
          </label>
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
    </div>
  );
};

export default CalculatorControls;