import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TickerMarqueeComponent } from '../../components/ticker-marquee/ticker-marquee.component';
import { StockDataService } from '../../services/stock-data.service';
import { AnalyzerService } from '../../services/analyzer.service';
import { AnalysisResult, Stock } from '../../models/stock.model';

@Component({
  selector: 'app-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, TickerMarqueeComponent],
  template: `
    <div class="analyzer-page">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <div class="page-content">

        <!-- Header -->
        <header class="page-header">
          <div class="header-tag"><span class="dot"></span> NSE · BSE Analytics</div>
          <h1>Indian Stock<br>Pro Analyzer</h1>
          <p class="header-sub">Enter a stock symbol — we auto-calculate the Target Price, Stop Loss &amp; Recommendation.</p>
        </header>

        <!-- Marquee -->
        <app-ticker-marquee></app-ticker-marquee>

        <!-- Main grid -->
        <div class="main-grid">

          <!-- Input Card -->
          <div class="glass-card input-card">
            <div class="card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 3H3v8l9.29 9.29a1 1 0 001.42 0l6.58-6.58a1 1 0 000-1.42z"></path><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"></circle></svg>
              Stock Details
            </div>

            <!-- Symbol -->
            <div class="form-group">
              <label>Stock Symbol</label>
              <div class="symbol-input-wrap">
                <input [(ngModel)]="ticker" type="text" id="symbolInput"
                       placeholder="e.g. RELIANCE, TCS, INFY"
                       maxlength="20" autocomplete="off" spellcheck="false"
                       list="stock-list"
                       (input)="onTickerInput()" (keyup.enter)="runAnalysis()"
                       [class.error]="errors['ticker']">
                <datalist id="stock-list">
                  <option *ngFor="let s of stockData.STOCKS" [value]="s.name">{{ s.fullName }}</option>
                </datalist>
                <!-- Matched badge -->
                <div class="symbol-badge" *ngIf="matchedStock">
                  <span class="badge-dot"></span> {{ matchedStock.exchange }}
                </div>
              </div>
              <span class="field-error" *ngIf="errors['ticker']">{{ errors['ticker'] }}</span>
              <!-- Auto-resolved stock info -->
              <div class="stock-hint" *ngIf="matchedStock">
                <span class="hint-name">{{ matchedStock.fullName }}</span>
                <span class="hint-sep">·</span>
                <span class="hint-sector">{{ matchedStock.sector }}</span>
                <span class="hint-sep">·</span>
                <span [class]="matchedStock.change >= 0 ? 'hint-change up' : 'hint-change down'">
                  {{ matchedStock.change >= 0 ? '▲' : '▼' }} {{ matchedStock.change | number:'1.2-2' }}%
                </span>
              </div>
            </div>

            <!-- Entry Price -->
            <div class="form-group">
              <label>
                Entry / Buy Price (₹)
                <span class="label-auto" *ngIf="cmpAutoFilled">Auto-filled from CMP</span>
              </label>
              <div class="price-input-wrap">
                <span class="currency">₹</span>
                <input [(ngModel)]="entryPrice" type="number" placeholder="Enter buy price" min="0" step="0.05"
                       (input)="onEntryChange()" [class.error]="errors['entry']">
              </div>
              <span class="field-error" *ngIf="errors['entry']">{{ errors['entry'] }}</span>
            </div>

            <!-- Auto-computed preview -->
            <div class="computed-preview" *ngIf="computed">
              <div class="computed-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Auto-computed values
              </div>
              <div class="computed-row">
                <span class="cr-label">Suggested Target</span>
                <span class="cr-val green">₹{{ computed.target | number:'1.2-2' }}</span>
              </div>
              <div class="computed-row">
                <span class="cr-label">Suggested Stop Loss</span>
                <span class="cr-val red">₹{{ computed.stopLoss | number:'1.2-2' }}</span>
              </div>
              <div class="computed-note">
                Based on 52-week data &amp; {{ matchedStock?.sector ?? 'sector' }} momentum
              </div>
            </div>

            <!-- Horizon -->
            <div class="form-group">
              <label>Investment Horizon</label>
              <div class="horizon-opts">
                <button *ngFor="let h of horizons" (click)="onHorizonChange(h.val)"
                        [class.selected]="selectedHorizon === h.val" class="horizon-btn">
                  {{ h.label }}
                </button>
              </div>
            </div>

            <button class="btn-analyze" (click)="runAnalysis()" [disabled]="loading">
              <svg *ngIf="!loading" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              <div *ngIf="loading" class="spinner"></div>
              {{ loading ? 'Analyzing…' : 'Analyze Stock' }}
            </button>
          </div>

          <!-- Results Card -->
          <div class="glass-card results-card">

            <!-- Empty State -->
            <div class="empty-state" *ngIf="!result && !loading">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
                <path d="M3 3v18h18"></path>
                <path d="m19 9-5 5-4-4-3 3"></path>
              </svg>
              <p>Enter a stock symbol and click <strong>Analyze Stock</strong>. Target price &amp; Stop Loss will be calculated automatically.</p>
            </div>

            <!-- Loading indicator -->
            <div class="empty-state" *ngIf="loading">
              <div class="loading-ring"></div>
              <p>Running analysis on <strong>{{ ticker.toUpperCase() }}</strong>…</p>
            </div>

            <!-- Results -->
            <div class="results-body" *ngIf="result && !loading">

              <div class="res-header">
                <div>
                  <div class="res-ticker">{{ result.ticker }}</div>
                  <div class="res-meta">{{ matchedStock?.fullName || 'Indian Equity' }} &bull; {{ matchedStock?.exchange || 'NSE/BSE' }}</div>
                </div>
                <div class="res-cmp" *ngIf="matchedStock">
                  <div class="cmp-label">CMP</div>
                  <div class="cmp-value">₹{{ matchedStock.cmp | number:'1.2-2' }}</div>
                  <div [class]="matchedStock.change >= 0 ? 'cmp-change up' : 'cmp-change down'">
                    {{ matchedStock.change >= 0 ? '+' : '' }}{{ matchedStock.change | number:'1.2-2' }}%
                  </div>
                </div>
              </div>

              <!-- Upside Donut -->
              <div class="upside-panel">
                <div class="donut-wrap">
                  <svg width="80" height="80" viewBox="0 0 64 64" style="transform:rotate(-90deg)">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="8"/>
                    <circle cx="32" cy="32" r="26" fill="none"
                      [attr.stroke]="analyzer.getDonutColor(result.upsidePct)"
                      stroke-width="8" stroke-linecap="round"
                      stroke-dasharray="163.36"
                      [attr.stroke-dashoffset]="analyzer.getDonutOffset(result.upsidePct)"
                      style="transition:stroke-dashoffset 1s ease,stroke .5s ease"/>
                  </svg>
                  <div class="donut-center" [style.color]="analyzer.getDonutColor(result.upsidePct)">
                    {{ result.upsidePct > 0 ? '+' : '' }}{{ result.upsidePct | number:'1.0-0' }}%
                  </div>
                </div>
                <div>
                  <div class="upside-label">Upside Potential</div>
                  <div class="upside-val" [style.color]="analyzer.getDonutColor(result.upsidePct)">
                    {{ result.upsidePct > 0 ? '+' : '' }}{{ result.upsidePct | number:'1.2-2' }}%
                  </div>
                  <div class="upside-sub">{{ result.upsidePct >= 0 ? 'Potential gain' : 'Downside risk' }} from entry</div>
                </div>
              </div>

              <!-- Key Prices (now showing computed values prominently) -->
              <div class="price-chips">
                <div class="price-chip entry">
                  <div class="pc-label">Entry Price</div>
                  <div class="pc-val">₹{{ result.entry | number:'1.2-2' }}</div>
                </div>
                <div class="price-chip target">
                  <div class="pc-label">🎯 Target Price</div>
                  <div class="pc-val green">₹{{ result.target | number:'1.2-2' }}</div>
                </div>
                <div class="price-chip sl" *ngIf="result.stopLoss">
                  <div class="pc-label">🛡 Stop Loss</div>
                  <div class="pc-val red">₹{{ result.stopLoss | number:'1.2-2' }}</div>
                </div>
              </div>

              <div class="metric-row" *ngIf="result.rrRatio">
                <span class="m-label">Risk / Reward</span>
                <span class="m-val"
                  [class.green]="result.rrRatio >= 2"
                  [class.yellow]="result.rrRatio >= 1 && result.rrRatio < 2"
                  [class.red]="result.rrRatio < 1">
                  1 : {{ result.rrRatio | number:'1.1-1' }}
                </span>
              </div>

              <div class="divider"></div>

              <!-- Risk -->
              <div class="metric-row risk-row">
                <span class="m-label">Risk Profile</span>
                <div class="risk-display">
                  <span class="m-val" [style.color]="analyzer.getRiskBarColor(result.riskLevel)">{{ result.riskLabel }}</span>
                  <div class="risk-bar-bg">
                    <div class="risk-bar-fill"
                         [style.width]="analyzer.getRiskBarWidth(result.riskLevel)"
                         [style.background]="analyzer.getRiskBarColor(result.riskLevel)">
                    </div>
                  </div>
                </div>
              </div>

              <div class="divider"></div>

            <!-- Advanced Algorithms Panel -->
              <div class="advanced-panel" *ngIf="result?.prediction">
                <div class="panel-head">
                  <div class="ph-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Advanced AI Analysis</div>
                  <div class="ph-score">Overall Score: <strong>{{ result.prediction!.overallScore }}/100</strong></div>
                </div>

                <div class="signal-grid">
                  <div class="signal-card" *ngFor="let sig of result.prediction!.signals">
                    <div class="sig-top">
                      <span class="sig-name">{{ sig.shortName }}</span>
                      <span [class]="'badge badge-' + sig.signalClass">{{ sig.signal }}</span>
                    </div>
                    <div class="sig-prices">
                      Target: ₹{{ sig.target | number:'1.0-0' }} &nbsp;|&nbsp; SL: ₹{{ sig.stopLoss | number:'1.0-0' }}
                    </div>
                    <div class="sig-desc">{{ sig.description }}</div>
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="divider"></div>

              <!-- Recommendations -->
              <div class="metric-row" *ngIf="selectedHorizon !== 'long'">
                <span class="m-label">Short Term</span>
                <span [class]="'badge badge-' + result.shortTermClass">{{ result.shortTermRec }}</span>
              </div>
              <div class="metric-row" *ngIf="selectedHorizon !== 'short'">
                <span class="m-label">Long Term</span>
                <span [class]="'badge badge-' + result.longTermClass">{{ result.longTermRec }}</span>
              </div>

              <div class="analyst-note">
                <div class="note-label">Analyst Note</div>
                <p>{{ result.analystNote }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Watchlist -->
        <section class="watchlist-section">
          <div class="section-head">Popular Stocks <span>Click to auto-analyze</span></div>
          <div class="watchlist-grid">
            <div *ngFor="let s of popularStocks" class="watch-card" (click)="autoAnalyze(s)">
              <div class="wc-top">
                <span class="wc-name">{{ s.name }}</span>
                <span [class]="s.change >= 0 ? 'wc-change up' : 'wc-change down'">
                  {{ s.change >= 0 ? '+' : '' }}{{ s.change | number:'1.2-2' }}%
                </span>
              </div>
              <div class="wc-sector">{{ s.sector }}</div>
              <div class="wc-price">₹{{ s.cmp | number:'1.2-2' }}</div>
              <div class="wc-cap">{{ s.marketCap }}</div>
            </div>
          </div>
        </section>

        <div class="disclaimer">
          ⚠️ <strong>Disclaimer:</strong> Target &amp; Stop Loss are auto-computed using advanced multi-algorithm technical data and sector momentum models — for educational purposes only. Not financial advice. Consult a SEBI-registered advisor before investing.
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./analyzer.component.css']
})
export class AnalyzerComponent implements OnInit {
  ticker       = '';
  entryPrice: number | null = null;
  selectedHorizon: 'both' | 'short' | 'long' = 'both';
  loading      = false;
  cmpAutoFilled = false;
  result: AnalysisResult | null  = null;
  matchedStock: Stock | null     = null;
  computed: { target: number; stopLoss: number } | null = null;
  errors: Record<string, string> = {};

  horizons = [
    { val: 'both'  as const, label: 'Both'       },
    { val: 'short' as const, label: 'Short Term' },
    { val: 'long'  as const, label: 'Long Term'  },
  ];

  get popularStocks() { return this.stockData.STOCKS.slice(0, 10); }

  constructor(
    public analyzer: AnalyzerService,
    public stockData: StockDataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const sym = params['s'];
      if (sym) {
        const stock = this.stockData.getStock(sym.toUpperCase());
        if (stock) {
          this.autoAnalyze(stock);
        }
      }
    });
  }

  /** Called when user types in the symbol box */
  onTickerInput(): void {
    const sym = this.ticker.trim().toUpperCase();
    this.matchedStock = this.stockData.getStock(sym) ?? null;
    this.result       = null;
    this.errors       = {};

    if (this.matchedStock) {
      // Auto-fill CMP
      this.entryPrice   = this.matchedStock.cmp;
      this.cmpAutoFilled = true;
      this.recompute();
    } else {
      this.cmpAutoFilled = false;
      this.computed = null;
    }
  }

  /** Called when entry price changes manually */
  onEntryChange(): void {
    this.cmpAutoFilled = false;
    this.result = null;
    this.recompute();
  }

  /** Called when Horizon changes */
  onHorizonChange(h: 'both' | 'short' | 'long'): void {
    if (this.selectedHorizon === h) return;
    this.selectedHorizon = h;
    this.recompute();
    if (this.result) {
      this.runAnalysis(); // re-run instantly if already analyzed
    }
  }

  private recompute(): void {
    if (this.entryPrice && this.entryPrice > 0) {
      this.computed = this.analyzer.computeTargetAndStopLoss(this.entryPrice, this.matchedStock ?? undefined, this.selectedHorizon);
    } else {
      this.computed = null;
    }
  }

  /** Click a watchlist card — instantly analyze */
  autoAnalyze(s: Stock): void {
    this.ticker        = s.name;
    this.matchedStock  = s;
    this.entryPrice    = s.cmp;
    this.cmpAutoFilled = true;
    this.recompute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Trigger analysis immediately
    this.runAnalysis();
  }

  runAnalysis(): void {
    this.errors = {};
    if (!this.ticker.trim())                         { this.errors['ticker'] = 'Symbol is required.'; return; }
    if (!this.entryPrice || this.entryPrice <= 0)    { this.errors['entry']  = 'Enter a valid buy price.'; return; }

    // Ensure computed values exist
    if (!this.computed) this.recompute();
    const { target, stopLoss } = this.computed!;

    this.loading = true;
    this.result  = null;

    setTimeout(() => {
      this.result = this.analyzer.analyze(
        this.ticker.trim().toUpperCase(),
        this.entryPrice!,
        target,
        stopLoss,
        this.selectedHorizon
      );
      this.loading = false;
    }, 850);
  }
}
