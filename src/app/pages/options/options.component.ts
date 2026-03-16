import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OptionsEngineService, OptionResult } from '../../services/options-engine.service';
import { StockDataService } from '../../services/stock-data.service';
import { Stock } from '../../models/stock.model';
import { AnalyzerService } from '../../services/analyzer.service';

@Component({
  selector: 'app-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-shell">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      
      <!-- Header -->
      <header class="page-header">
        <div class="header-tag"><span class="dot"></span> Derivatives Analytics</div>
        <h1>Options Pro<br>Trading Desk</h1>
        <p class="header-sub">Advanced Greek calculations, Black-Scholes pricing, and Implied Volatility.</p>
      </header>

      <div class="main-grid split-layout">
        
        <!-- Left Panel: Form Input -->
        <div class="glass-card panel-input">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            Option Setup
          </div>

          <div class="form-group">
            <label>1. Search Asset to Trade</label>
            <div class="symbol-input-wrap">
              <input [(ngModel)]="ticker" type="text" placeholder="e.g. NIFTY, BANKNIFTY, RELIANCE" 
                     (input)="onTickerInput()" list="stock-list" autocomplete="off">
              <datalist id="stock-list">
                <option *ngFor="let s of stockData.STOCKS" [value]="s.name">{{ s.fullName }}</option>
              </datalist>
            </div>
            <div *ngIf="spotPrice" class="spot-price-display">
              Underlying Spot Price: <strong>₹{{ spotPrice | number:'1.2-2' }}</strong>
            </div>
          </div>

          <button class="advanced-toggle" (click)="showAdvanced = !showAdvanced" [class.open]="showAdvanced">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            {{ showAdvanced ? 'Hide Expiry & Volatility Setup' : 'Show Expiry & Volatility Setup' }}
          </button>

          <div class="advanced-panel" *ngIf="showAdvanced">
            <div class="two-col-grid">
              <div class="form-group">
                <label>Days to Expiry (DTE)</label>
                <input [(ngModel)]="dte" type="number" step="1" min="0" (input)="onParamsChange()">
              </div>
              <div class="form-group">
                <label>Implied Volatility (IV) %</label>
                <input [(ngModel)]="iv" type="number" step="0.1" (input)="onParamsChange()">
              </div>
            </div>
            
            <div class="two-col-grid">
              <div class="form-group">
                <label>Risk-Free Rate (r) %</label>
                <input [(ngModel)]="rfr" type="number" step="0.1" (input)="onParamsChange()">
              </div>
              <div class="form-group">
                <label>Dividend Yield (q) %</label>
                <input [(ngModel)]="divYield" type="number" step="0.1" (input)="onParamsChange()">
              </div>
            </div>
          </div>
          
          <div class="divider"></div>

          <!-- OPTION CHAIN UI -->
          <div *ngIf="chainData.length > 0" class="option-chain-container">
            <h3 class="section-title">2. Select an Option from the Chain</h3>
            <p class="section-desc" style="font-size:0.75rem; color:#94a3b8; margin-bottom:1rem;">Click a premium to analyze the trade.</p>
            
            <div class="table-wrap">
              <table class="chain-table">
                <thead>
                  <tr>
                    <th colspan="2" class="call-header">CALLS (CE)</th>
                    <th>STRIKE</th>
                    <th colspan="2" class="put-header">PUTS (PE)</th>
                  </tr>
                  <tr class="sub-header">
                    <th>Delta</th>
                    <th>Premium</th>
                    <th>Price</th>
                    <th>Premium</th>
                    <th>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of chainData" [class.is-atm]="row.isAtm">
                    <!-- Call Side -->
                    <td class="gk-val pos" style="font-size:0.75rem">{{ row.callDelta | number:'1.2-2' }}</td>
                    <td class="clickable call-premium" 
                        [class.selected]="strikePrice === row.strike && isCall"
                        (click)="selectOptionFromChain(row.strike, true)">
                      ₹{{ row.callPrice | number:'1.1-2' }}
                    </td>
                    
                    <!-- Strike Center -->
                    <td class="strike-cell">
                      <strong>{{ row.strike }}</strong>
                      <span *ngIf="row.isAtm" class="atm-badge">ATM</span>
                    </td>
                    
                    <!-- Put Side -->
                    <td class="clickable put-premium" 
                        [class.selected]="strikePrice === row.strike && !isCall"
                        (click)="selectOptionFromChain(row.strike, false)">
                      ₹{{ row.putPrice | number:'1.1-2' }}
                    </td>
                    <td class="gk-val neg" style="font-size:0.75rem">{{ row.putDelta | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <button class="advanced-toggle" (click)="showAdvanced = !showAdvanced" [class.open]="showAdvanced">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            {{ showAdvanced ? 'Hide Advanced Parameters' : 'Show Advanced Parameters' }}
          </button>

          <div class="advanced-panel" *ngIf="showAdvanced">
            <div class="two-col-grid">
              <div class="form-group">
                <label>Days to Expiry (DTE)</label>
                <input [(ngModel)]="dte" type="number" step="1" min="0" (input)="recalculate()">
              </div>
              <div class="form-group">
                <label>Implied Volatility (IV) %</label>
                <input [(ngModel)]="iv" type="number" step="0.1" (input)="recalculate()">
              </div>
            </div>
            
            <div class="two-col-grid">
              <div class="form-group">
                <label>Risk-Free Rate (r) %</label>
                <input [(ngModel)]="rfr" type="number" step="0.1" (input)="recalculate()">
              </div>
              <div class="form-group">
                <label>Dividend Yield (q) %</label>
                <input [(ngModel)]="divYield" type="number" step="0.1" (input)="recalculate()">
              </div>
            </div>
          </div>

        </div>

        <!-- Right Panel: Theoretical Output & Greeks -->
        <div class="glass-card panel-results">
          <div class="status-empty" *ngIf="!isValid()">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>Select an asset and option type to see the AI analysis, expected premium ranges, and payoff chart.</p>
          </div>

          <div class="results-layout" *ngIf="isValid() && result">
            <div class="res-head">
              <div class="contract-name">
                {{ ticker || 'Unknown' }} {{ strikePrice }}{{ isCall ? 'CE' : 'PE' }}
              </div>
              <div class="contract-status" [ngClass]="moneynessClass()">
                {{ moneynessText() }}
              </div>
            </div>

            <!-- Price Chips -->
            <div class="price-chips compact">
              <div class="price-chip primary">
                <div class="pc-label">Theoretical Price</div>
                <div class="pc-val">₹{{ result.theoreticalPrice | number:'1.2-2' }}</div>
              </div>
              <div class="price-chip pop">
                <div class="pc-label">POP (Prob. of Profit)</div>
                <div class="pc-val">{{ result.pop | number:'1.1-1' }}%</div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- AI Projected Upside / Downside -->
            <div *ngIf="projectedTargetPrem !== null">
              <h3 class="section-title">AI Projected Options Range</h3>
              <p class="section-desc" style="font-size:0.8rem; color:#94a3b8; margin-bottom:1rem;">Based on multi-algorithm analysis of the underlying asset.</p>
              
              <div class="two-col-grid" style="margin-bottom: 2rem;">
                <div class="greek-card" style="border-color: rgba(52, 211, 153, 0.3);">
                  <div class="gk-head">
                    <span class="gk-symbol">🎯</span> <span class="gk-name">Projected Upside</span>
                  </div>
                  <div class="gk-val pos">₹{{ projectedTargetPrem | number:'1.2-2' }}</div>
                  <div class="gk-desc">
                    If underlying hits target (₹{{ underlyingTarget | number:'1.0-2' }}). <br>
                    <strong>+{{ targetUpsidePct | number:'1.1-1' }}% return</strong>
                  </div>
                </div>

                <div class="greek-card" style="border-color: rgba(248, 113, 113, 0.3);">
                  <div class="gk-head">
                    <span class="gk-symbol">🛡️</span> <span class="gk-name">Probable Downside Limit</span>
                  </div>
                  <div class="gk-val neg">₹{{ projectedSLPrem | number:'1.2-2' }}</div>
                  <div class="gk-desc">
                    If underlying hits Stop Loss (₹{{ underlyingSL | number:'1.0-2' }}). <br>
                    <strong>{{ slDownsidePct | number:'1.1-1' }}% risk</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- The Greeks (Hidden by default) -->
            <button class="advanced-toggle" style="margin: 2rem 0 1rem;" (click)="showGreeks = !showGreeks">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              {{ showGreeks ? 'Hide Advanced Greeks' : 'Show Advanced Greeks (Delta, Theta, etc)' }}
            </button>

            <div *ngIf="showGreeks">
              <div class="greeks-grid">
                
                <!-- Delta -->
                <div class="greek-card">
                  <div class="gk-head">
                    <span class="gk-symbol">Δ</span> <span class="gk-name">Delta</span>
                  </div>
                  <div class="gk-val" [ngClass]="{'pos': result.greeks.delta > 0, 'neg': result.greeks.delta < 0}">
                    {{ result.greeks.delta | number:'1.3-3' }}
                  </div>
                  <div class="gk-desc">Rate of change in premium per ₹1 change in spot.</div>
                </div>

                <!-- Gamma -->
                <div class="greek-card">
                  <div class="gk-head">
                    <span class="gk-symbol">Γ</span> <span class="gk-name">Gamma</span>
                  </div>
                  <div class="gk-val">{{ result.greeks.gamma | number:'1.4-4' }}</div>
                  <div class="gk-desc">Rate of change of Delta per ₹1 change in spot.</div>
                </div>

                <!-- Theta -->
                <div class="greek-card">
                  <div class="gk-head">
                    <span class="gk-symbol">Θ</span> <span class="gk-name">Theta</span>
                  </div>
                  <div class="gk-val neg">{{ result.greeks.theta | number:'1.2-2' }}</div>
                  <div class="gk-desc">Daily time decay in premium (value lost per day).</div>
                </div>

                <!-- Vega -->
                <div class="greek-card">
                  <div class="gk-head">
                    <span class="gk-symbol">ν</span> <span class="gk-name">Vega</span>
                  </div>
                  <div class="gk-val pos">{{ result.greeks.vega | number:'1.2-2' }}</div>
                  <div class="gk-desc">Change in premium per 1% change in Implied Volatility.</div>
                </div>

                <!-- Rho -->
                <div class="greek-card">
                  <div class="gk-head">
                    <span class="gk-symbol">ρ</span> <span class="gk-name">Rho</span>
                  </div>
                  <div class="gk-val">{{ result.greeks.rho | number:'1.3-3' }}</div>
                  <div class="gk-desc">Impact of 1% change in risk-free interest rate.</div>
                </div>

              </div>
            </div>

            <div class="divider"></div>

            <!-- Chart Analysis -->
            <h3 class="section-title">Scenario Chart Analysis</h3>
            <div class="chart-container">
              <div class="chart-header">
                <div class="ch-stat">Max Profit: <span class="green">{{ maxProfitText() }}</span></div>
                <div class="ch-stat">Max Loss: <span class="red">{{ maxLossText() }}</span></div>
                <div class="ch-stat">Break-Even: <span>₹{{ breakEven() | number:'1.2-2' }}</span></div>
              </div>
              
              <!-- Dynamic SVG Payoff Chart -->
              <div class="payoff-chart">
                <svg viewBox="0 0 400 200" preserveAspectRatio="none">
                  <!-- Zero line -->
                  <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4 4" />
                  
                  <!-- Profit Zone (Green) -->
                  <polygon [attr.points]="profitPolygon()" fill="rgba(16, 185, 129, 0.15)" />
                  <!-- Loss Zone (Red) -->
                  <polygon [attr.points]="lossPolygon()" fill="rgba(244, 63, 94, 0.15)" />
                  
                  <!-- Payoff Line -->
                  <polyline [attr.points]="payoffLine()" fill="none" stroke="#f1f5f9" stroke-width="2.5" stroke-linejoin="round" />
                  
                  <!-- Break Even Point Dot -->
                  <circle [attr.cx]="bepX()" cy="100" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="2" />
                  
                  <!-- Current Spot Line -->
                  <line [attr.x1]="spotX()" y1="0" [attr.x2]="spotX()" y2="200" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4" />
                  <text [attr.x]="spotX() < 350 ? spotX() + 5 : spotX() - 35" y="20" fill="#38bdf8" font-size="10" font-weight="700">CMP</text>
                </svg>
                
                <div class="chart-x-axis">
                  <span>₹{{ chartMinX() | number:'1.0-0' }}</span>
                  <span>₹{{ strikePrice }} (Strike)</span>
                  <span>₹{{ chartMaxX() | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./options.component.css']
})
export class OptionsComponent implements OnInit {
  ticker = '';
  isCall = true;
  spotPrice: number | null = null;
  strikePrice: number | null = null;
  dte: number | null = 30; // Days to expiry
  iv: number | null = 20; // 20%
  rfr: number | null = 7.0; // 7% repo rate
  divYield: number | null = 0;

  result: OptionResult | null = null;
  showAdvanced = false;
  showGreeks = false;

  // AI Projection vars
  underlyingTarget: number | null = null;
  underlyingSL: number | null = null;
  projectedTargetPrem: number | null = null;
  projectedSLPrem: number | null = null;
  targetUpsidePct: number = 0;
  slDownsidePct: number = 0;

  // Option Chain Data
  chainData: Array<{
    strike: number;
    callPrice: number;
    callDelta: number;
    putPrice: number;
    putDelta: number;
    isAtm: boolean;
  }> = [];

  constructor(
    private engine: OptionsEngineService,
    public stockData: StockDataService,
    private analyzer: AnalyzerService
  ) {}

  ngOnInit() {}

  onTickerInput() {
    const sym = this.ticker.trim().toUpperCase();
    const s = this.stockData.getStock(sym);
    if (s) {
      this.spotPrice = s.cmp;
      this.generateOptionChain();
      
      // Auto-select ATM Call initially
      const atmRow = this.chainData.find(r => r.isAtm);
      if (atmRow) {
        this.selectOptionFromChain(atmRow.strike, true);
      }
    } else {
      this.chainData = [];
      this.result = null;
    }
  }

  onParamsChange() {
    if (this.spotPrice) {
      this.generateOptionChain();
      if (this.strikePrice) {
        this.recalculate();
      }
    }
  }

  generateOptionChain() {
    if (!this.spotPrice) return;
    
    const S = this.spotPrice;
    const base = S > 1000 ? (S > 10000 ? 100 : 50) : 10;
    const atmStrike = Math.round(S / base) * base;
    
    // Generate +/- 6 strikes around ATM
    const strikes = [];
    for (let i = -6; i <= 6; i++) {
      strikes.push(atmStrike + (i * base));
    }
    
    const T = (this.dte || 1) / 365.0; // avoid 0 DTE for chain generation to prevent div by 0 errors in deltas
    const r = (this.rfr ?? 0) / 100;
    const v = (this.iv || 1) / 100;
    const q = (this.divYield ?? 0) / 100;

    this.chainData = strikes.map(strike => {
      const call = this.engine.calculateBlackScholes(true, S, strike, T, r, v, q);
      const put = this.engine.calculateBlackScholes(false, S, strike, T, r, v, q);
      return {
        strike: strike,
        callPrice: call.price,
        callDelta: call.greeks.delta,
        putPrice: put.price,
        putDelta: put.greeks.delta,
        isAtm: strike === atmStrike
      }
    });
  }

  selectOptionFromChain(strike: number, isCall: boolean) {
    this.strikePrice = strike;
    this.isCall = isCall;
    this.recalculate();
    
    // Smooth scroll to results
    setTimeout(() => {
      document.querySelector('.panel-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  isValid(): boolean {
    return !!(this.spotPrice && this.spotPrice > 0 && 
              this.strikePrice && this.strikePrice > 0 && 
              this.dte !== null && this.dte >= 0 &&
              this.iv && this.iv > 0);
  }

  recalculate() {
    if (!this.isValid()) {
      this.result = null;
      return;
    }

    // Convert inputs to decimals/years
    const S = this.spotPrice!;
    const K = this.strikePrice!;
    const T = this.dte! / 365.0; 
    const r = (this.rfr ?? 0) / 100;
    const v = this.iv! / 100;
    const q = (this.divYield ?? 0) / 100;

    const bs = this.engine.calculateBlackScholes(this.isCall, S, K, T, r, v, q);
    const pop = this.engine.calculatePOP(this.isCall, S, K, T, v, bs.price);

    this.result = {
      theoreticalPrice: bs.price,
      iv: this.iv!,
      greeks: bs.greeks,
      pop: pop
    };

    // Calculate AI projected downside/upside for the options premium
    this.calculateAIProjections(S, K, T, r, v, q, bs.price);
  }

  private calculateAIProjections(S: number, K: number, T: number, r: number, v: number, q: number, currentPrem: number) {
    const stock = this.stockData.getStock(this.ticker.trim().toUpperCase());
    if (!stock) {
      this.projectedTargetPrem = null;
      return;
    }

    // Get underlying predicted targets from AI engine (assuming 'short' term for options typically)
    const { target, stopLoss } = this.analyzer.computeTargetAndStopLoss(S, stock, 'short');
    this.underlyingTarget = target;
    this.underlyingSL = stopLoss;

    // Run Black-Scholes using the TARGET as the spot price
    const targetBs = this.engine.calculateBlackScholes(this.isCall, target, K, T, r, v, q);
    this.projectedTargetPrem = targetBs.price;
    this.targetUpsidePct = currentPrem > 0 ? ((targetBs.price - currentPrem) / currentPrem) * 100 : 0;

    // Run Black-Scholes using the STOP LOSS as the spot price
    const slBs = this.engine.calculateBlackScholes(this.isCall, stopLoss, K, T, r, v, q);
    this.projectedSLPrem = slBs.price;
    this.slDownsidePct = currentPrem > 0 ? ((slBs.price - currentPrem) / currentPrem) * 100 : 0;
  }

  moneynessText(): string {
    if (!this.spotPrice || !this.strikePrice) return '';
    const S = this.spotPrice;
    const K = this.strikePrice;
    const pct = Math.abs(S - K) / S;
    
    if (pct < 0.01) return 'ATM (At The Money)';
    
    if (this.isCall) { return S > K ? 'ITM (In The Money)' : 'OTM (Out of The Money)'; } 
    else             { return S < K ? 'ITM (In The Money)' : 'OTM (Out of The Money)'; }
  }

  moneynessClass(): string {
    if (!this.spotPrice || !this.strikePrice) return '';
    const text = this.moneynessText();
    if (text.startsWith('ITM')) return 'itm';
    if (text.startsWith('ATM')) return 'atm';
    if (text.startsWith('OTM')) return 'otm';
    return '';
  }

  // --- Chart Math ---

  breakEven(): number {
    if (!this.strikePrice || !this.result) return 0;
    return this.isCall 
      ? this.strikePrice + this.result.theoreticalPrice 
      : this.strikePrice - this.result.theoreticalPrice;
  }

  maxProfitText(): string {
    if (this.isCall) return 'Infinite';
    if (!this.strikePrice || !this.result) return '₹0';
    return '₹' + ((this.strikePrice - this.result.theoreticalPrice).toFixed(2));
  }

  maxLossText(): string {
    if (!this.result) return '₹0';
    return '₹' + this.result.theoreticalPrice.toFixed(2);
  }

  chartMinX(): number {
    if (!this.strikePrice || !this.result) return 0;
    const range = Math.max(this.strikePrice * 0.1, this.result.theoreticalPrice * 5);
    return Math.max(0, this.strikePrice - range);
  }

  chartMaxX(): number {
    if (!this.strikePrice || !this.result) return 0;
    const range = Math.max(this.strikePrice * 0.1, this.result.theoreticalPrice * 5);
    return this.strikePrice + range;
  }

  mapX(price: number): number {
    const min = this.chartMinX();
    const max = this.chartMaxX();
    if (max === min) return 200;
    return ((price - min) / (max - min)) * 400;
  }
  
  mapY(pnl: number): number {
    if (!this.result) return 100;
    const maxLoss = this.result.theoreticalPrice;
    const scale = 80 / (maxLoss || 1);
    let y = 100 - (pnl * scale);
    return Math.max(-50, Math.min(250, y));
  }

  spotX(): number {
    if (!this.spotPrice) return 0;
    return this.mapX(this.spotPrice);
  }

  bepX(): number {
    return this.mapX(this.breakEven());
  }

  pnlAt(price: number): number {
    if (!this.strikePrice || !this.result) return 0;
    const premium = this.result.theoreticalPrice;
    if (this.isCall) {
      return Math.max(0, price - this.strikePrice) - premium;
    } else {
      return Math.max(0, this.strikePrice - price) - premium;
    }
  }

  payoffLine(): string {
    const min = this.chartMinX();
    const max = this.chartMaxX();
    const step = (max - min) / 50;
    const pts = [];
    for (let p = min; p <= max; p += step) pts.push(p);
    if (!pts.includes(this.strikePrice!)) {
        pts.push(this.strikePrice!);
        pts.sort((a,b) => a-b);
    }
    let points = '';
    for (const p of pts) points += `${this.mapX(p)},${this.mapY(this.pnlAt(p))} `;
    return points.trim();
  }

  profitPolygon(): string {
    const min = this.chartMinX();
    const max = this.chartMaxX();
    const bep = this.breakEven();
    
    if (this.isCall) {
      return `${this.mapX(bep)},100 ${this.mapX(max)},100 ${this.mapX(max)},${this.mapY(this.pnlAt(max))} ${this.mapX(bep)},${this.mapY(this.pnlAt(bep))}`;
    } else {
      return `${this.mapX(min)},100 ${this.mapX(bep)},100 ${this.mapX(bep)},${this.mapY(this.pnlAt(bep))} ${this.mapX(min)},${this.mapY(this.pnlAt(min))}`;
    }
  }

  lossPolygon(): string {
    const min = this.chartMinX();
    const max = this.chartMaxX();
    const bep = this.breakEven();
    const K = this.strikePrice!;
    
    if (this.isCall) {
      return `${this.mapX(min)},100 ${this.mapX(bep)},100 ${this.mapX(bep)},${this.mapY(this.pnlAt(bep))} ${this.mapX(K)},${this.mapY(this.pnlAt(K))} ${this.mapX(min)},${this.mapY(this.pnlAt(min))}`;
    } else {
      return `${this.mapX(bep)},100 ${this.mapX(max)},100 ${this.mapX(max)},${this.mapY(this.pnlAt(max))} ${this.mapX(K)},${this.mapY(this.pnlAt(K))} ${this.mapX(bep)},${this.mapY(this.pnlAt(bep))}`;
    }
  }
}
