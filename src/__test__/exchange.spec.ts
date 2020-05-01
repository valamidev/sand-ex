import btcUsdt5min from './fixtures/candlestick';
import { OHLCV, OrderSide, OrderType, OrderStatus } from '../types';
import Exchange from '../index';

const exchangeOptions = {
  balanceAsset: 1.0,
  balanceQuote: 20000.0,
  fee: 0.00075,
  candleData: btcUsdt5min as OHLCV[],
};

describe('Exchange', () => {
  let testExchange: Exchange;

  beforeEach(() => {
    testExchange = new Exchange(exchangeOptions);
  });

  it('should set properties at construct', () => {
    // Assert
    expect(testExchange.feeMaker).toBe(exchangeOptions.fee);
    expect(testExchange.feeTaker).toBe(exchangeOptions.fee);
    expect(testExchange.balanceAsset).toBe(exchangeOptions.balanceAsset);
    expect(testExchange.balanceQuote).toBe(exchangeOptions.balanceQuote);
  });

  it('should tick over candles', () => {
    // Arrange
    const historyLength = btcUsdt5min.length;
    const responses: any[] = [];

    //Act
    for (let i = 0; i < historyLength; i++) {
      responses.push(testExchange.nextTick());
    }

    //Assert
    expect(responses[responses.length - 1]).toBe(btcUsdt5min[btcUsdt5min.length - 1]);
    expect(testExchange.nextTick()).toBe(false);
  });

  it('should Create/Update Buy Orders', () => {
    // Arrange
    const price = 8000;
    const quantity = 1.2;

    //Act
    testExchange.nextTick();
    testExchange.createNewOrder({
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      price,
      quantity,
    });
    testExchange.nextTick();

    //Assert
    expect(testExchange.orders).toHaveLength(1);
    expect(testExchange.orders[0]).toMatchObject({
      orderId: 1,
      price: 8000,
      origQty: 1.2,
      executedQty: 0,
      cummulativeQuoteQty: 0,
      status: 'NEW',
      type: 'LIMIT',
      side: 'BUY',
      time: 1569160500000,
      updateTime: 1569160800000,
    });
    expect(testExchange.balanceQuote).toBe(exchangeOptions.balanceQuote - price * quantity);
    expect((testExchange as any).orderId).toBe(2);
  });

  it('should Create/Update Sell Orders', () => {
    // Arrange
    const price = 15000;
    const quantity = 0.5;

    //Act
    testExchange.nextTick();
    testExchange.createNewOrder({
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      price,
      quantity,
    });
    testExchange.nextTick();

    //Assert
    expect(testExchange.orders).toHaveLength(1);
    expect(testExchange.orders[0]).toMatchObject({
      orderId: 1,
      price: 15000,
      origQty: 0.5,
      executedQty: 0,
      cummulativeQuoteQty: 0,
      status: 'NEW',
      type: 'LIMIT',
      side: 'SELL',
      time: 1569160500000,
      updateTime: 1569160800000,
    });
    expect(testExchange.balanceAsset).toBe(exchangeOptions.balanceAsset - quantity);
    expect((testExchange as any).orderId).toBe(2);
  });

  it('should Cancel Orders', () => {
    // Arrange
    const priceSell = 15000;
    const quantitySell = 0.5;
    const priceBuy = 3970;
    const quantityBuy = 1;

    //Act
    testExchange.nextTick();
    testExchange.createNewOrder({
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      price: priceSell,
      quantity: quantitySell,
    });

    testExchange.createNewOrder({
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      price: priceBuy,
      quantity: quantityBuy,
    });
    testExchange.nextTick();

    //Act
    testExchange.cancelOrder(1);
    testExchange.cancelOrder(2);

    //Assert
    expect(testExchange.orders).toHaveLength(2);
    expect(testExchange.balanceAsset).toBe(exchangeOptions.balanceAsset);
    expect(testExchange.balanceQuote).toBe(exchangeOptions.balanceQuote);

    expect(testExchange.orders[0]).toMatchObject({
      orderId: 1,
      status: OrderStatus.CANCELED,
      updateTime: 1569160800000,
    });
    expect(testExchange.orders[1]).toMatchObject({
      orderId: 2,
      status: OrderStatus.CANCELED,
      updateTime: 1569160800000,
    });
  });

  it('should execute Orders', () => {
    // Arrange
    const historyLength = btcUsdt5min.length;
    const priceSell = 10000;
    const quantitySell = 0.5;
    const priceBuy = 9970;
    const quantityBuy = 1;

    //Act
    testExchange.nextTick();

    testExchange.createNewOrder({
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      price: priceSell,
      quantity: quantitySell,
    });

    testExchange.createNewOrder({
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      price: priceBuy,
      quantity: quantityBuy,
    });

    for (let i = 0; i < historyLength; i++) {
      testExchange.nextTick();
    }

    //Assert
    expect(testExchange.orders).toHaveLength(2);
    expect(testExchange.balanceAsset).toBe(1.49925);
    expect(testExchange.balanceQuote).toBe(15026.25);

    expect(testExchange.orders[0]).toMatchObject({
      orderId: 1,
      price: priceSell,
      origQty: quantitySell,
      executedQty: quantitySell,
      cummulativeQuoteQty: quantitySell,
      status: 'FILLED',
      type: 'LIMIT',
      side: OrderSide.SELL,
      time: 1569160500000,
      updateTime: 1569168000000,
    });
    expect(testExchange.orders[1]).toMatchObject({
      orderId: 2,
      price: 9970,
      origQty: quantityBuy,
      executedQty: quantityBuy,
      cummulativeQuoteQty: quantityBuy,
      status: 'FILLED',
      type: 'LIMIT',
      side: OrderSide.BUY,
      time: 1569160500000,
      updateTime: 1569161100000,
    });
  });

  it('should Sell Order throw balance Errors', () => {
    // Arrange

    const priceSell = 10000;
    const quantitySell = 3;

    //Assert

    expect(() => {
      testExchange.createNewOrder({
        side: OrderSide.SELL,
        type: OrderType.LIMIT,
        price: priceSell,
        quantity: quantitySell,
      });
    }).toThrow('Error: Insufficient balance, missing: Asset');
    expect(testExchange.orders).toHaveLength(0);
  });

  it('should Buy Order throw balance Errors', () => {
    // Arrange

    const priceBuy = 3000;
    const quantityBuy = 50;

    //Assert

    expect(() => {
      testExchange.createNewOrder({
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        price: priceBuy,
        quantity: quantityBuy,
      });
    }).toThrow('Error: Insufficient balance, missing: Quote');
    expect(testExchange.orders).toHaveLength(0);
  });
});