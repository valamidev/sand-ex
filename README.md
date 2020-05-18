# SandEx

![npm](https://img.shields.io/npm/v/sand-ex)
[![DeepScan grade](https://deepscan.io/api/teams/6761/projects/11214/branches/164979/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=6761&pid=11214&bid=164979)
[![Coverage Status](https://coveralls.io/repos/github/valamidev/sand-ex/badge.svg?branch=master)](https://coveralls.io/github/valamidev/sand-ex?branch=master)

SandEx allow you to backtest your trading strategies and order execution in a simple way, or replay your trades based on OHLCV input.

#### Basic Usage:

```javascript
import SandExchange from 'sand-ex';

const exchangeOptions = {
  balanceAsset: 1.0,
  balanceQuote: 20000.0,
  fee: 0.00075,
 // feeMaker: 0.00075, // Optional
 // feeTaker: 0.00075, // Optional
 // candleData: OHLCV[]; // Optional
 // candlePrice?: CandlePrice; // Optional , Default: Close
};

const Exchange = new SandExchange(exchangeOptions);
```

#### Update([time,open,high,low,close]):

Update Exchange with OHLCV candleStick

```javascript
Exchange.update([1569160500000, 9977.09, 9992.3, 9972.63, 9986.24, 56.127912]);
```

#### nextTick():

If you have CandleData[] as input you can replay tick to tick

```javascript
Exchange.nextTick();
```

#### getBalance():

```javascript
Exchange.getBalance();
```

#### createNewOrder({orderDetails}):

```javascript
Exchange.createNewOrder({
side: 'BUY',
type: 'LIMIT,
price: 10000,
quantity: 0.8,
});
```

#### cancelOrder(orderId):

```javascript
Exchange.cancelOrder(1);
```

#### getOrders():

Get All Orders (New,Filled,Canceled)

```javascript
Exchange.getOrders();

```
