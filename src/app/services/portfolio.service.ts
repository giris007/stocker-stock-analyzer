import { Injectable } from '@angular/core';
import { Holding, HoldingWithPnL } from '../models/stock.model';
import { StockDataService } from './stock-data.service';

const STORAGE_KEY = 'stocker_portfolio';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  constructor(private stockData: StockDataService) {}

  getHoldings(): Holding[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  addHolding(symbol: string, qty: number, avgPrice: number): void {
    const holdings = this.getHoldings();
    const existingIdx = holdings.findIndex(h => h.symbol === symbol);
    if (existingIdx !== -1) {
      // Average out the position
      const existing = holdings[existingIdx];
      const totalQty = existing.qty + qty;
      const totalCost = (existing.qty * existing.avgPrice) + (qty * avgPrice);
      holdings[existingIdx] = { ...existing, qty: totalQty, avgPrice: totalCost / totalQty };
    } else {
      holdings.push({ symbol, qty, avgPrice, addedAt: Date.now() });
    }
    this.save(holdings);
  }

  removeHolding(symbol: string): void {
    const holdings = this.getHoldings().filter(h => h.symbol !== symbol);
    this.save(holdings);
  }

  getHoldingsWithPnL(): HoldingWithPnL[] {
    return this.getHoldings().map(h => {
      const stock = this.stockData.getStock(h.symbol);
      const cmp   = stock ? stock.cmp : h.avgPrice;
      const invested     = h.qty * h.avgPrice;
      const currentValue = h.qty * cmp;
      const pnl          = currentValue - invested;
      const pnlPct       = (pnl / invested) * 100;
      return { ...h, cmp, invested, currentValue, pnl, pnlPct };
    });
  }

  getSummary(): { totalInvested: number; totalCurrentValue: number; totalPnL: number; totalPnLPct: number } {
    const rows = this.getHoldingsWithPnL();
    const totalInvested     = rows.reduce((s, r) => s + r.invested, 0);
    const totalCurrentValue = rows.reduce((s, r) => s + r.currentValue, 0);
    const totalPnL          = totalCurrentValue - totalInvested;
    const totalPnLPct       = totalInvested ? (totalPnL / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrentValue, totalPnL, totalPnLPct };
  }

  private save(holdings: Holding[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }
}
