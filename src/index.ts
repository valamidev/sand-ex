import { SandExOptions, OHLCV, CandlePrice, Order, OrderStatus, OrderSide, NewOrderOptions } from './types';

export default class SandEx {
  private readonly candleData: OHLCV[] | undefined;
  balanceAsset: number;
  balanceQuote: number;
  readonly feeMaker: number;
  readonly feeTaker: number;
  readonly candlePrice: CandlePrice;
  orders: Order[];
  private tick: number;
  private orderId: number;
  time: number;

  constructor(options: SandExOptions) {
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

    if (options.candleData) {
      this.candleData = options.candleData;
    }

    this.candlePrice = CandlePrice.CLOSE;

    if (options.candlePrice) {
      this.candlePrice = options.candlePrice;
    }

    this.orders = [];
    this.tick = 0;
    this.time = 0;
    this.orderId = 1;
  }

  update(candleData: OHLCV): void {
    const candlePrice = candleData[this.candlePrice];
    const candleTime = candleData[0];

    if (this.time >= candleTime) {
      return;
    }

    this.time = candleTime;
    this._updateOrders(candlePrice);
  }

  nextTick(): OHLCV | boolean {
    if (!this.candleData) {
      throw new Error('CandleData[] not exist');
    }

    const currentTick = this.tick;
    this.tick += 1;

    if (!this.candleData[currentTick]) {
      return false;
    }

    const currentCandle = this.candleData[currentTick];

    this.update(currentCandle);

    return currentCandle;
  }

  private _updateOrders(currentPrice: number): void {
    this.orders = this.orders.map((order) => {
      // Skip finished orders
      if (order.status !== OrderStatus.NEW || order.time === this.time) {
        return order;
      }

      if (order.side === OrderSide.BUY && currentPrice <= order.price) {
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

      if (order.side === OrderSide.SELL && currentPrice >= order.price) {
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

    try {
      if (side === OrderSide.BUY) {
        const totalQuotePrice = price * quantity;
        this._checkAvailableQuoteBalance(totalQuotePrice);
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
        this._checkAvailableAssetBalance(quantity);
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
    } catch (err) {
      throw new Error(err);
    }
  }

  cancelOrder(orderId: number): Error | boolean {
    if (!this.orders.find((order) => order.orderId === orderId)) {
      throw new Error(`Order is not exist, OrderId: ${orderId}`);
    }

    this.orders = this.orders.map((order) => {
      if (order.orderId === orderId && order.side === OrderSide.SELL) {
        this.balanceAsset += order.origQty - order.executedQty;

        return { ...order, ...{ status: OrderStatus.CANCELED, updateTime: this.time } };
      }

      if (order.orderId === orderId && order.side === OrderSide.BUY) {
        const totalQuotePrice = order.price * (order.origQty - order.executedQty);
        this.balanceQuote += totalQuotePrice;

        return { ...order, ...{ status: OrderStatus.CANCELED, updateTime: this.time } };
      }

      return order;
    });

    return true;
  }

  private _checkAvailableAssetBalance(reqAsset: number): void | Error {
    const check = this.balanceAsset - reqAsset;

    if (check < 0) {
      throw new Error(`Insufficient balance, missing: Asset , ${check}`);
    }
  }

  private _checkAvailableQuoteBalance(reqQuote: number): void | Error {
    const check = this.balanceQuote - reqQuote;

    if (check < 0) {
      throw new Error(`Insufficient balance, missing: Quote , ${check}`);
    }
  }
}
