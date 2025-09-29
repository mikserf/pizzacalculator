import { YeastData, PizzaState, RecipeResult } from '../types/pizza';

export const yeastData: Record<number, YeastData> = {
  19: { a: 6.8606, b: 0.8928 },
  20: { a: 7.1, b: 0.8828 },
  21: { a: 7.5818, b: 0.8668 },
  22: { a: 7.8, b: 0.8468 },
  23: { a: 7.7213, b: 0.8308 },
  24: { a: 6.2, b: 0.8308 },
  25: { a: 5.2894, b: 0.8204 },
  26: { a: 4, b: 0.8204 }
};

export const getDefaultBakeTime = (): string => {
  const defaultBakeTime = new Date();
  
  const year = defaultBakeTime.getFullYear();
  const month = String(defaultBakeTime.getMonth() + 1).padStart(2, '0');
  const day = String(defaultBakeTime.getDate()).padStart(2, '0');
  const hour = String(defaultBakeTime.getHours()).padStart(2, '0');
  const minute = String(defaultBakeTime.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const calculateRecipe = (state: PizzaState): RecipeResult => {
  const {
    doughBallWeight,
    numPizzas,
    bakeTime,
    roomTemp,
    testTubeDough,
    desiredDoughTemp,
    frictionFactor,
    waterPercent,
    saltPercent
  } = state;

  const bakeDateTime = new Date(bakeTime);
  const currentTime = new Date();
  const fermentationTime = (bakeDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

  // Calculate flour per ball
  const waterPercentage = (typeof waterPercent === 'number' ? waterPercent : 66) / 100;
  const saltPercentage = (typeof saltPercent === 'number' ? saltPercent : 2.8) / 100;
  const totalPercentage = 1 + waterPercentage + saltPercentage;
  const flourPerBall = doughBallWeight / totalPercentage;
  
  // Validation
  if (numPizzas === 0 || roomTemp === 0 || fermentationTime <= 0) {
    return {
      flour: 0,
      water: 0,
      salt: 0,
      yeast: 0,
      requiredWaterTemp: 0,
      fermentationTime: Math.max(0, fermentationTime)
    };
  }
  
  // Main recipe calculation
  let totalFlour = numPizzas * flourPerBall;
  
  // Add test tube dough if selected
  if (testTubeDough) {
    const testDoughWeight = 80;
    const testFlour = testDoughWeight / totalPercentage;
    totalFlour += testFlour;
  }
  
  const totalWater = totalFlour * waterPercentage;
  const totalSalt = totalFlour * saltPercentage;
  
  let yeastGrams = 0;
  if (yeastData[roomTemp]) {
    const { a, b } = yeastData[roomTemp];
    yeastGrams = (a * (b ** fermentationTime)) * totalFlour * 0.001;
  }
  
  const requiredWaterTemp = (desiredDoughTemp * 3) - roomTemp - roomTemp - frictionFactor;
  
  return {
    flour: totalFlour,
    water: totalWater,
    salt: totalSalt,
    yeast: yeastGrams,
    requiredWaterTemp,
    fermentationTime
  };
};
