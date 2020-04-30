export interface ExchangeOptions {
  balanceAsset: number;
  balanceQuote: number;
  fee: number;
  feeMaker?: number;
  feeTaker?: number;
  candleData: OHLCV[];
  candlePrice?: CandlePrice;
}

// time, open, high, low, close, volume
export type OHLCV = [number, number, number, number, number, number];

export enum CandlePrice {
  OPEN = 1,
  HIGH = 2,
  LOW = 3,
  CLOSE = 4,
}

export enum OrderStatus {
  NEW = 'NEW', // - The order has been accepted by the engine.
  // PARTIALLY_FILLED - A part of the order has been filled.
  FILLED = 'FILLED', // - The order has been completely filled.
  CANCELED = 'CANCELED', //  - The order has been canceled by the user.
}

export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface NewOrderOptions {
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
}

export type Order = {
  symbol?: string;
  orderId: number;
  clientOrderId?: string;
  price: number;
  origQty: number;
  executedQty: number;
  cummulativeQuoteQty: number;
  status: OrderStatus;
  type: OrderType;
  side: OrderSide;
  stopPrice?: number;
  icebergQty?: number;
  time: number;
  updateTime: number;
  isWorking?: true;
  origQuoteOrderQty?: number;
};
