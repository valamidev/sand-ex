# SandEx

SandEx allow you to backtest your trading strategies and order execution in a simple way, or replay your trades based on OHLCV input.

#### Basic Usage:

```
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

// Update Exchange with OHLCV candleStick
Exchange.update([1569160500000, 9977.09, 9992.3, 9972.63, 9986.24, 56.127912]);
// or
// If you have CandleData[] as input you can replay tick to tick
Exchange.nextTick();


// Get Balance
Exchange.getBalance();

// Create new order
Exchange.createNewOrder({
side: 'BUY',
type: 'LIMIT,
price: 10000,
quantity: 0.8,
});

// Cancel order
Exchange.cancelOrder(1);

// Get All Orders (New,Filled,Canceled)
Exchange.getOrders();

```
