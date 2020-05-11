export const DEFAULT_RADIX = 10;

export const addPrecision = (number: number, precision: number): bigint => {
  return BigInt(Math.floor(number * DEFAULT_RADIX ** precision));
};

export const removePrecision = (bigInt: bigint, precision: number): number => {
  return Number(bigInt.toString()) / DEFAULT_RADIX ** precision;
};

export const toPrecision = (number: number, precision: number): number => {
  return removePrecision(addPrecision(number, precision), precision);
};

export const mulWithPrecision = (number1: number, number2: number, precision: number): number => {
  const resultString = toPrecision(number1 * number2, precision)
    .toString()
    .split('.');

  if (resultString[1]) {
    if (resultString[1].indexOf('e') === -1) {
      resultString[1] = resultString[1].slice(0, -1);
    } else {
      const resultStringScience = resultString[1].split('e');

      if (resultStringScience[0].length > 2) {
        resultStringScience[0] = resultStringScience[0].slice(0, -1);
      }

      resultString[1] = resultStringScience.join('e');
    }
  }

  return Number(resultString.join('.'));
};

export const divWithPrecision = (number1: number, number2: number, precision: number): number => {
  const resultString = toPrecision(number1 / number2, precision)
    .toString()
    .split('.');

  if (resultString[1]) {
    if (resultString[1].indexOf('e') === -1) {
      resultString[1] = resultString[1].slice(0, -1);
    } else {
      const resultStringScience = resultString[1].split('e');

      if (resultStringScience[0].length > 2) {
        resultStringScience[0] = resultStringScience[0].slice(0, -1);
      }

      resultString[1] = resultStringScience.join('e');
    }
  }

  return Number(resultString.join('.'));
};
