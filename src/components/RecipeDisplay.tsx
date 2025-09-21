import React from 'react';
import { RecipeResult } from '../types/pizza';

interface RecipeDisplayProps {
  numPizzas: number;
  recipe: RecipeResult;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ numPizzas, recipe }) => {
  return (
    <div className="recipe mt-12 md:mt-0">
      <h2 className="font-display text-3xl font-bold mb-6">
        Your Recipe for <span>{numPizzas}</span> Pizza{numPizzas !== 1 ? 's' : ''}
      </h2>
      
      <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
        <div className="flex justify-between items-baseline">
          <span className="text-lg text-gray-600">Flour</span>
          <p className="font-bold text-4xl text-orange-600">
            {recipe.flour.toFixed(0)}g
          </p>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-lg text-gray-600">Water</span>
          <p className="font-bold text-4xl text-orange-600">
            {recipe.water.toFixed(0)}g
          </p>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-lg text-gray-600">Salt</span>
          <p className="font-bold text-4xl text-orange-600">
            {recipe.salt.toFixed(0)}g
          </p>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-lg text-gray-600">Fresh Yeast</span>
          <p className="font-bold text-4xl text-orange-600">
            {recipe.yeast.toFixed(2)}g
          </p>
        </div>
      </div>
      
      <div className="mt-8 bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
        <p className="text-lg font-semibold text-orange-800">Mix with water at</p>
        <p className="font-display text-5xl font-bold text-orange-900">
          {recipe.requiredWaterTemp.toFixed(1)}°C
        </p>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          Fermentation Time: <span className="font-bold">{recipe.fermentationTime.toFixed(1)}</span> hours
        </p>
      </div>
    </div>
  );
};

export default RecipeDisplay;