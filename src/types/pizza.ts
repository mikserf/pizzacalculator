export interface YeastData {
  a: number;
  b: number;
}

export interface PizzaState {
  doughBallWeight: number;
  numPizzas: number;
  bakeTime: string;
  roomTemp: number;
  moreWater: boolean;
  testTubeDough: boolean;
  desiredDoughTemp: number;
  frictionFactor: number;
  waterPercent: number; // hydration percentage, e.g. 66 means 66%
  saltPercent: number; // salt percentage, e.g. 2.8 means 2.8%
}

export interface RecipeResult {
  flour: number;
  water: number;
  salt: number;
  yeast: number;
  requiredWaterTemp: number;
  fermentationTime: number;
}
