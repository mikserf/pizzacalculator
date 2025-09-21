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
}

export interface RecipeResult {
  flour: number;
  water: number;
  salt: number;
  yeast: number;
  requiredWaterTemp: number;
  fermentationTime: number;
}