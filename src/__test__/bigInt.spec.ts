
import {addPrecision, removePrecision, mulWithPrecision, divWithPrecision} from '../utils'

describe('BigInt', () => {

    const number= 4324.32423141234123123;
    const precision = 12;

    it('should add Precision', () => {
      // Act
      const numberInt=  addPrecision(number, precision);

      // Assert
      expect(numberInt.toString()).toBe(`4324324231412341`);
    });

    it('should remove Precision', () => {
       // Act
       const numberInt=  addPrecision(number, precision);
       const numberFloat = removePrecision(numberInt, precision);

       // Assert
       expect(numberFloat).toBe(4324.324231412341);
     });


     it('should keep safe rounding', () => {


        // Act
        for (let i = 0; i < 1000; i++) {
          
          const num1 = 1 * Math.random();
          const num2 = 1 * Math.random();

          const safeDiv = divWithPrecision(num1,num2, precision);
          const safeMull =  mulWithPrecision(num1,num2,precision);
         
          const floatDiv = num1 / num2 ;
          const floatMull =  num1 * num2;


          // Assert
          expect(safeDiv).toBeLessThanOrEqual(floatDiv);
          expect(safeMull).toBeLessThanOrEqual(floatMull);
        }

        for (let i = 0; i < 1000; i++) {
          
          const num1 = 3245123 * Math.random();
          const num2 = 5231512 * Math.random();


          const safeDiv = divWithPrecision(num1,num2, precision);
          const safeMull =  mulWithPrecision(num1,num2,precision);
         
          const floatDiv = num1 / num2 ;
          const floatMull =  num1 * num2;


          // Assert
          expect(safeDiv).toBeLessThanOrEqual(floatDiv);
          expect(safeMull).toBeLessThanOrEqual(floatMull);
        }


      });
  

});