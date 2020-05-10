export const DEFAULT_RADIX = 10;

export const addPrecision = (number: number, precision: number): bigint => {
  return BigInt(Math.floor(number * DEFAULT_RADIX ** precision));
};

export const removePrecision = (bigInt: bigint, precision: number): number => {
  return Number(bigInt.toString()) / DEFAULT_RADIX ** precision;
};

export const mulWithPrecision = (number1: number, number2: number, precision: number): number => {
  const resultString = removePrecision(addPrecision(number1 * number2, precision), 12)
    .toString()
    .split('.');

  if (resultString[1]) {
    resultString[1] = resultString[1].slice(0, -1);
  }

  const result = Number(resultString.join('.'));

  return Number(result);
};

export const divWithPrecision = (number1: number, number2: number, precision: number): number => {
  const resultString = removePrecision(addPrecision(number1 / number2, precision), 12)
    .toString()
    .split('.');

  if (resultString[1]) {
    resultString[1] = resultString[1].slice(0, -1);
  }

  const result = Number(resultString.join('.'));

  return Number(result);
};
