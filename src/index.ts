import { SandExOptions, OHLCV, CandlePrice, Order, OrderStatus, OrderSide, NewOrderOptions } from './types';
import { toPrecision, mulWithPrecision } from './utils';

const DEFAULT_PRECISION = 12;

export default class SandEx {
  private readonly candleData: OHLCV[] | undefined;
  private _balanceAsset: number;
  private _balanceQuote: number;
  readonly feeMaker: number;
  readonly feeTaker: number;
  readonly candlePrice: CandlePrice;
  private _orders: Order[];
  private tick: number;
  private orderId: number;
  private time: number;
  private readonly precision: number;

  constructor(options: SandExOptions) {
    this._orders = [];
    this.tick = 0;
    this.time = 0;
    this.orderId = 1;
    this._balanceAsset = options.balanceAsset;
    this._balanceQuote = options.balanceQuote;
    this.feeMaker = options.feeMaker || options.fee;
    this.feeTaker = options.feeTaker || options.fee;
    this.candlePrice = options.candlePrice || CandlePrice.CLOSE;
    this.precision = options.precision || DEFAULT_PRECISION;

    if (options.candleData) {
      this.candleData = options.candleData;
    }
  }

  getBalance(): Record<string, number> {
    return {
      balanceAsset: this._balanceAsset,
      balanceQuote: this._balanceQuote,
    };
  }

  getOrders(): Order[] {
    return this._orders;
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
    this._orders = this._orders.map((order) => {
      // Skip finished orders
      if (order.status !== OrderStatus.NEW || order.time === this.time) {
        return order;
      }

      if (order.side === OrderSide.BUY && currentPrice <= order.price) {
        const { origQty } = order;
        const fixedOrigQty = toPrecision(origQty, this.precision);

        this._balanceAsset =
          this._balanceAsset + fixedOrigQty - mulWithPrecision(fixedOrigQty, this.feeTaker, this.precision);

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
        const { origQty, price } = order;
        const amountOfQuote = mulWithPrecision(origQty, price, this.precision);

        this._balanceQuote =
          this._balanceQuote + amountOfQuote - mulWithPrecision(amountOfQuote, this.feeTaker, this.precision);

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
        const totalQuotePrice = mulWithPrecision(price, quantity, this.precision);
        this._checkAvailableQuoteBalance(totalQuotePrice);

        this._balanceQuote -= totalQuotePrice;

        this._orders.push({
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
        this._balanceAsset -= quantity;

        this._orders.push({
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

      return this._orders.find((order) => order.orderId === orderId) as Order;
    } catch (err) {
      throw new Error(err);
    }
  }

  cancelOrder(orderId: number): Error | boolean {
    if (!this._orders.find((order) => order.orderId === orderId)) {
      throw new Error(`Order is not exist, OrderId: ${orderId}`);
    }

    this._orders = this._orders.map((order) => {
      if (order.orderId === orderId && order.side === OrderSide.SELL) {
        const { origQty, executedQty } = order;
        this._balanceAsset += origQty - executedQty;

        return { ...order, ...{ status: OrderStatus.CANCELED, updateTime: this.time } };
      }

      if (order.orderId === orderId && order.side === OrderSide.BUY) {
        const { origQty, executedQty, price } = order;
        const totalQuotePrice = mulWithPrecision(price, origQty - executedQty, this.precision);
        this._balanceQuote += totalQuotePrice;

        return { ...order, ...{ status: OrderStatus.CANCELED, updateTime: this.time } };
      }

      return order;
    });

    return true;
  }

  private _checkAvailableAssetBalance(reqAsset: number): void | Error {
    const check = this._balanceAsset - reqAsset;

    if (check < 0) {
      throw new Error(`Insufficient balance, missing: Asset , ${check}`);
    }
  }

  private _checkAvailableQuoteBalance(reqQuote: number): void | Error {
    const check = this._balanceQuote - reqQuote;

    if (check < 0) {
      throw new Error(`Insufficient balance, missing: Quote , ${check}`);
    }
  }
}
