import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockDataService } from '../../services/stock-data.service';
import { Stock } from '../../models/stock.model';

@Component({
  selector: 'app-ticker-marquee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="marquee-outer">
      <div class="marquee-inner">
        <div class="marquee-track">
          <ng-container *ngFor="let s of doubleStocks">
            <div class="chip">
              <span class="chip-name">{{ s.name }}</span>
              <span [class]="s.change >= 0 ? 'up' : 'down'">
                {{ s.change >= 0 ? '▲' : '▼' }} {{ s.change | number:'1.2-2' }}%
              </span>
              <span class="chip-price">₹{{ s.cmp | number:'1.0-2' }}</span>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .marquee-outer {
      overflow: hidden;
      mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
      padding: 0.5rem 0;
    }
    .marquee-track {
      display: flex;
      gap: 1rem;
      animation: marquee 35s linear infinite;
      white-space: nowrap;
      width: max-content;
    }
    @keyframes marquee {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .chip {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      padding: 0.3rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .chip-name  { color: #cbd5e1; }
    .chip-price { color: #94a3b8; font-size: 0.75rem; }
    .up   { color: #10b981; }
    .down { color: #f43f5e; }
  `]
})
export class TickerMarqueeComponent implements OnInit {
  doubleStocks: Stock[] = [];

  constructor(private stockData: StockDataService) {}

  ngOnInit(): void {
    // Double the array for seamless loop
    this.doubleStocks = [...this.stockData.STOCKS, ...this.stockData.STOCKS];
  }
}
