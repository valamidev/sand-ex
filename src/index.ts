import { ExchangeOptions, OHLCV, CandlePrice, Order, OrderStatus, OrderSide, NewOrderOptions } from './types';

export class Exchange {
  private readonly candleData: OHLCV[];
  protected balanceAsset: number;
  protected balanceQuote: number;
  readonly feeMaker: number;
  readonly feeTaker: number;
  readonly candlePrice: CandlePrice;
  protected orders: Order[];
  protected tick: number;
  protected orderId: number;
  protected time: number;

  constructor(options: ExchangeOptions) {
    this.balanceAsset = options.balanceAsset;
    this.balanceQuote = options.balanceQuote;

    this.feeMaker = options.fee;
    this.feeTaker = options.fee;

    if (options.feeMaker) {
      this.feeMaker = options.feeMaker;
    }
    if (options.feeTaker) {
      this.feeTaker = options.feeTaker;
    }

    this.candleData = options.candleData;

    this.candlePrice = CandlePrice.CLOSE;

    if (options.candlePrice) {
      this.candlePrice = options.candlePrice;
    }

    this.orders = [];
    this.tick = 0;
    this.time = 0;
    this.orderId = 1;
  }

  nextTick(): OHLCV | boolean {
    if (!this.candleData[this.tick]) {
      return false;
    }

    const currentCandleStick = this.candleData[this.tick];
    this.time = this.candleData[this.tick][0];
    const currentPrice = this.candleData[this.tick][this.candlePrice];

    this._updateOrders(currentPrice);

    return currentCandleStick;
  }

  private _updateOrders(currentPrice: number): void {
    this.orders = this.orders.map((order) => {
      // Skip finished orders
      if (order.status !== OrderStatus.NEW) {
        return order;
      }

      if (order.side === OrderSide.BUY || currentPrice <= order.price) {
        this.balanceAsset += order.origQty - order.origQty * this.feeTaker;

        return {
          ...order,
          ...{
            executedQty: order.origQty,
            cummulativeQuoteQty: order.origQty,
            status: OrderStatus.FILLED,
            updateTime: this.time,
          },
        };
      }

      // Sell
      if (order.side === OrderSide.SELL || currentPrice >= order.price) {
        const amountOfQuote = order.origQty * order.price;
        this.balanceQuote += amountOfQuote - amountOfQuote * this.feeTaker;

        return {
          ...order,
          ...{
            executedQty: order.origQty,
            cummulativeQuoteQty: order.origQty,
            status: OrderStatus.FILLED,
            updateTime: this.time,
          },
        };
      }

      return {
        ...order,
        ...{ updateTime: this.time },
      };
    });
  }

  createNewOrder(options: NewOrderOptions): Order {
    const { orderId, time } = this;
    this.orderId += 1;

    const { side, price, quantity, type } = options;

    if (side === OrderSide.BUY) {
      const totalQuotePrice = price * quantity;
      this.balanceQuote -= totalQuotePrice;

      this.orders.push({
        orderId,
        price,
        origQty: quantity,
        executedQty: 0,
        cummulativeQuoteQty: 0,
        status: OrderStatus.NEW,
        type,
        side,
        time,
        updateTime: time,
      });
    }

    if (side === OrderSide.SELL) {
      this.balanceAsset -= quantity;

      this.orders.push({
        orderId,
        price,
        origQty: quantity,
        executedQty: 0,
        cummulativeQuoteQty: 0,
        status: OrderStatus.NEW,
        type,
        side,
        time,
        updateTime: time,
      });
    }

    return this.orders.find((order) => order.orderId === orderId) as Order;
  }
}
