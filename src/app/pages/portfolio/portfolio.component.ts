import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';
import { HoldingWithPnL } from '../../models/stock.model';
import { StockDataService } from '../../services/stock-data.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="portfolio-page">
      <div class="page-content">

        <div class="page-header">
          <h2 class="page-title">My Portfolio</h2>
          <p class="page-sub">Track your Indian stock holdings, P&amp;L, and overall returns. Data is saved locally in your browser.</p>
        </div>

        <!-- Summary Cards -->
        <div class="summary-grid" *ngIf="holdings.length > 0">
          <div class="summary-card">
            <div class="sc-label">Total Invested</div>
            <div class="sc-value">₹{{ summary.totalInvested | number:'1.2-2' }}</div>
          </div>
          <div class="summary-card">
            <div class="sc-label">Current Value</div>
            <div class="sc-value">₹{{ summary.totalCurrentValue | number:'1.2-2' }}</div>
          </div>
          <div class="summary-card" [class.profit]="summary.totalPnL >= 0" [class.loss]="summary.totalPnL < 0">
            <div class="sc-label">Overall P&amp;L</div>
            <div class="sc-value pnl" [class.green]="summary.totalPnL >= 0" [class.red]="summary.totalPnL < 0">
              {{ summary.totalPnL >= 0 ? '+' : '' }}₹{{ summary.totalPnL | number:'1.2-2' }}
            </div>
            <div class="sc-pct" [class.green]="summary.totalPnLPct >= 0" [class.red]="summary.totalPnLPct < 0">
              {{ summary.totalPnLPct >= 0 ? '+' : '' }}{{ summary.totalPnLPct | number:'1.2-2' }}%
            </div>
          </div>
          <div class="summary-card">
            <div class="sc-label">Holdings</div>
            <div class="sc-value">{{ holdings.length }}</div>
          </div>
        </div>

        <!-- Add Holding -->
        <div class="glass-card add-card">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Add / Update Holding
          </div>

          <div class="add-form">
            <div class="form-group">
              <label>Stock Symbol</label>
              <input type="text" [(ngModel)]="newSymbol" placeholder="e.g. TCS" maxlength="20"
                     autocomplete="off" spellcheck="false"
                     list="stock-list" [class.error]="addErrors['symbol']">
              <datalist id="stock-list">
                <option *ngFor="let s of stockData.STOCKS" [value]="s.name">{{ s.fullName }}</option>
              </datalist>
              <span class="field-error" *ngIf="addErrors['symbol']">{{ addErrors['symbol'] }}</span>
            </div>

            <div class="form-group">
              <label>Quantity</label>
              <input type="number" [(ngModel)]="newQty" placeholder="e.g. 10" min="1" step="1"
                     [class.error]="addErrors['qty']">
              <span class="field-error" *ngIf="addErrors['qty']">{{ addErrors['qty'] }}</span>
            </div>

            <div class="form-group">
              <label>Avg Buy Price (₹)</label>
              <input type="number" [(ngModel)]="newAvgPrice" placeholder="e.g. 3400" min="0" step="0.05"
                     [class.error]="addErrors['price']">
              <span class="field-error" *ngIf="addErrors['price']">{{ addErrors['price'] }}</span>
            </div>

            <button class="btn-add" (click)="addHolding()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add to Portfolio
            </button>
          </div>

          <div class="add-success" *ngIf="addSuccess">
            ✅ {{ addSuccess }}
          </div>
        </div>

        <!-- Holdings Table -->
        <div class="glass-card table-card" *ngIf="holdings.length > 0">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>CMP</th>
                  <th>Invested (₹)</th>
                  <th>Value (₹)</th>
                  <th>P&amp;L (₹)</th>
                  <th>P&amp;L (%)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of holdings" class="holding-row">
                  <td>
                    <div class="sym-wrap">
                      <span class="sym-name">{{ h.symbol }}</span>
                    </div>
                  </td>
                  <td class="mono">{{ h.qty }}</td>
                  <td class="mono">₹{{ h.avgPrice | number:'1.2-2' }}</td>
                  <td class="mono">₹{{ h.cmp | number:'1.2-2' }}</td>
                  <td class="mono">₹{{ h.invested | number:'1.2-2' }}</td>
                  <td class="mono">₹{{ h.currentValue | number:'1.2-2' }}</td>
                  <td class="mono" [class.green]="h.pnl >= 0" [class.red]="h.pnl < 0">
                    {{ h.pnl >= 0 ? '+' : '' }}₹{{ h.pnl | number:'1.2-2' }}
                  </td>
                  <td [class.green]="h.pnlPct >= 0" [class.red]="h.pnlPct < 0">
                    {{ h.pnlPct >= 0 ? '+' : '' }}{{ h.pnlPct | number:'1.2-2' }}%
                  </td>
                  <td>
                    <button class="btn-remove" (click)="removeHolding(h.symbol)">Remove</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty state -->
        <div class="empty-portfolio" *ngIf="holdings.length === 0">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
            <rect x="2" y="7" width="20" height="14" rx="2"></rect>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>
          </svg>
          <p>No holdings yet. Add your first stock above to start tracking.</p>
        </div>

        <div class="disclaimer">
          ⚠️ CMP values used are simulated demo prices. Connect a live data feed for real-time P&amp;L.
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  newSymbol   = '';
  newQty: number | null = null;
  newAvgPrice: number | null = null;
  addErrors: Record<string, string> = {};
  addSuccess = '';
  holdings: HoldingWithPnL[] = [];
  summary = { totalInvested: 0, totalCurrentValue: 0, totalPnL: 0, totalPnLPct: 0 };

  constructor(public stockData: StockDataService, private portfolioService: PortfolioService) {}

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.holdings = this.portfolioService.getHoldingsWithPnL();
    this.summary  = this.portfolioService.getSummary();
  }

  addHolding(): void {
    this.addErrors = {};
    this.addSuccess = '';

    if (!this.newSymbol.trim())                                 this.addErrors['symbol'] = 'Symbol is required.';
    if (!this.newQty || this.newQty <= 0)                      this.addErrors['qty']    = 'Enter a valid quantity.';
    if (!this.newAvgPrice || this.newAvgPrice <= 0)            this.addErrors['price']  = 'Enter a valid buy price.';
    if (Object.keys(this.addErrors).length) return;

    this.portfolioService.addHolding(
      this.newSymbol.trim().toUpperCase(),
      this.newQty!,
      this.newAvgPrice!
    );
    this.addSuccess = `${this.newSymbol.toUpperCase()} added to your portfolio.`;
    this.newSymbol = ''; this.newQty = null; this.newAvgPrice = null;
    this.refresh();

    setTimeout(() => this.addSuccess = '', 3000);
  }

  removeHolding(symbol: string): void {
    this.portfolioService.removeHolding(symbol);
    this.refresh();
  }
}
