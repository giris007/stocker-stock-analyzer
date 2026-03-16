import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StockDataService } from '../../services/stock-data.service';
import { AnalyzerService } from '../../services/analyzer.service';
import { ScreenerRow } from '../../models/stock.model';

@Component({
  selector: 'app-screener',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="screener-page">
      <div class="page-content">

        <div class="page-header">
          <h2 class="page-title">Stock Screener</h2>
          <p class="page-sub">Filter and sort {{ stockData.STOCKS.length }}+ NSE/BSE stocks by sector, upside potential, and recommendation.</p>
        </div>

        <!-- Filter Bar -->
        <div class="glass-card filter-bar">
          <div class="filter-row">
            <div class="filter-group">
              <label>Sector</label>
              <select [(ngModel)]="filterSector" (change)="applyFilters()">
                <option *ngFor="let s of stockData.SECTORS" [value]="s">{{ s }}</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Min Upside (%)</label>
              <input type="number" [(ngModel)]="filterMinUpside" (input)="applyFilters()" placeholder="e.g. 10">
            </div>

            <div class="filter-group">
              <label>Recommendation</label>
              <select [(ngModel)]="filterRec" (change)="applyFilters()">
                <option value="All">All</option>
                <option value="BUY">BUY</option>
                <option value="ACCUMULATE">ACCUMULATE</option>
                <option value="HOLD">HOLD</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <button class="btn-reset" (click)="resetFilters()">Reset</button>
          </div>

          <div class="filter-count">
            Showing <strong>{{ rows.length }}</strong> of {{ stockData.STOCKS.length }} stocks
          </div>
        </div>

        <!-- Table -->
        <div class="glass-card table-card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th (click)="toggleSort('name')" class="sortable">
                    Symbol <span class="sort-icon">{{ getSortIcon('name') }}</span>
                  </th>
                  <th>Sector</th>
                  <th (click)="toggleSort('cmp')" class="sortable">
                    CMP (₹) <span class="sort-icon">{{ getSortIcon('cmp') }}</span>
                  </th>
                  <th (click)="toggleSort('change')" class="sortable">
                    Day Change <span class="sort-icon">{{ getSortIcon('change') }}</span>
                  </th>
                  <th (click)="toggleSort('pe')" class="sortable">
                    P/E <span class="sort-icon">{{ getSortIcon('pe') }}</span>
                  </th>
                  <th (click)="toggleSort('upsidePct')" class="sortable">
                    52W Upside <span class="sort-icon">{{ getSortIcon('upsidePct') }}</span>
                  </th>
                  <th>Recommendation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of rows" class="table-row">
                  <td>
                    <div class="sym-wrap">
                      <span class="sym-name">{{ r.name }}</span>
                      <span class="sym-exchange">{{ r.exchange }}</span>
                    </div>
                  </td>
                  <td><span class="sector-chip">{{ r.sector }}</span></td>
                  <td class="mono">₹{{ r.cmp | number:'1.2-2' }}</td>
                  <td>
                    <span [class]="r.change >= 0 ? 'change up' : 'change down'">
                      {{ r.change >= 0 ? '+' : '' }}{{ r.change | number:'1.2-2' }}%
                    </span>
                  </td>
                  <td class="mono">{{ r.pe }}</td>
                  <td>
                    <span [class]="r.upsidePct >= 0 ? 'upside-val positive' : 'upside-val negative'">
                      {{ r.upsidePct >= 0 ? '+' : '' }}{{ r.upsidePct | number:'1.1-1' }}%
                    </span>
                  </td>
                  <td><span [class]="'badge badge-' + r.recClass">{{ r.rec }}</span></td>
                  <td>
                    <a [routerLink]="['/']" [queryParams]="{s: r.name}" class="btn-analyze-mini">
                      Analyze →
                    </a>
                  </td>
                </tr>
                <tr *ngIf="rows.length === 0">
                  <td colspan="8" class="no-results">No stocks match your filters.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./screener.component.css']
})
export class ScreenerComponent implements OnInit {
  filterSector   = 'All';
  filterMinUpside = 0;
  filterRec       = 'All';
  sortField       = 'upsidePct';
  sortDir: 'asc' | 'desc' = 'desc';
  rows: ScreenerRow[] = [];

  constructor(public stockData: StockDataService, private analyzer: AnalyzerService) {}

  ngOnInit(): void { this.applyFilters(); }

  applyFilters(): void {
    let list = this.stockData.STOCKS
      .map(s => {
        // Upside = potential from CMP to 52-week high
        const upsidePct = ((s.week52High - s.cmp) / s.cmp) * 100;
        const rec  = this.getSimpleRec(upsidePct);
        return { ...s, upsidePct: parseFloat(upsidePct.toFixed(2)), rec, recClass: this.getRecClass(rec) };
      })
      .filter(s => this.filterSector   === 'All'  || s.sector === this.filterSector)
      .filter(s => s.upsidePct >= (this.filterMinUpside || 0))
      .filter(s => this.filterRec === 'All' || s.rec.includes(this.filterRec));

    // Sort
    list.sort((a, b) => {
      const av = (a as any)[this.sortField];
      const bv = (b as any)[this.sortField];
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    this.rows = list;
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir   = 'desc';
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  resetFilters(): void {
    this.filterSector    = 'All';
    this.filterMinUpside = 0;
    this.filterRec       = 'All';
    this.sortField       = 'upsidePct';
    this.sortDir         = 'desc';
    this.applyFilters();
  }

  private getSimpleRec(upsidePct: number): string {
    if (upsidePct >= 25) return 'STRONG BUY';
    if (upsidePct >= 15) return 'BUY';
    if (upsidePct >=  8) return 'ACCUMULATE';
    if (upsidePct >=  3) return 'HOLD';
    if (upsidePct >=  0) return 'HOLD';
    if (upsidePct >= -8) return 'SELL';
    return 'STRONG SELL';
  }

  private getRecClass(rec: string): string {
    const map: Record<string, string> = {
      'STRONG BUY': 'strong-buy', 'BUY': 'buy', 'ACCUMULATE': 'accumulate',
      'HOLD': 'hold', 'SELL': 'sell', 'STRONG SELL': 'strong-sell'
    };
    return map[rec] ?? 'hold';
  }
}
