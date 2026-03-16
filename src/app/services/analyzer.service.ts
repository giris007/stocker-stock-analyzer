import { Injectable } from '@angular/core';
import { AnalysisResult, Stock, BlendedPrediction } from '../models/stock.model';
import { AlgorithmEngineService } from './algorithm-engine.service';

/** Sector-based upside multipliers (how aggressive the target is above CMP) */
const SECTOR_UPSIDE: Record<string, number> = {
  'IT':      0.18,
  'Banking': 0.16,
  'NBFC':    0.20,
  'Auto':    0.20,
  'Energy':  0.15,
  'Pharma':  0.18,
  'FMCG':    0.12,
  'Metals':  0.22,
  'Infra':   0.18,
  'Telecom': 0.15,
  'Retail':  0.16,
};

/** Sector-based stop-loss cushion (how far below entry the SL sits) */
const SECTOR_SL: Record<string, number> = {
  'IT':      0.08,
  'Banking': 0.08,
  'NBFC':    0.10,
  'Auto':    0.10,
  'Energy':  0.09,
  'Pharma':  0.09,
  'FMCG':    0.07,
  'Metals':  0.12,
  'Infra':   0.10,
  'Telecom': 0.09,
  'Retail':  0.09,
};

@Injectable({ providedIn: 'root' })
export class AnalyzerService {

  constructor(private engine: AlgorithmEngineService) {}

  /**
   * Auto-compute Target Price and Stop Loss from stock data using advanced multi-algorithm engine.
   * Returns { target, stopLoss, prediction }
   */
  computeTargetAndStopLoss(entry: number, stock: Stock | undefined, horizon: 'both' | 'short' | 'long'): { target: number; stopLoss: number, prediction: BlendedPrediction } {
    const prediction = this.engine.compute(entry, stock, horizon);
    return {
      target: prediction.target,
      stopLoss: prediction.stopLoss,
      prediction
    };
  }

  analyze(
    ticker: string,
    entry: number,
    target: number,
    stop: number | null,
    horizon: 'both' | 'short' | 'long'
  ): AnalysisResult {
    const upsidePct = ((target - entry) / entry) * 100;

    let shortTermRec: string, longTermRec: string;
    let shortTermClass: string, longTermClass: string;
    let riskLevel: number;
    let analystNote: string;

    if (upsidePct >= 25) {
      shortTermRec = 'BUY'; shortTermClass = 'buy';
      longTermRec  = 'STRONG BUY'; longTermClass = 'strong-buy';
      riskLevel    = 1;
      analystNote  = `${ticker} shows exceptional upside of ${upsidePct.toFixed(1)}%. Excellent entry for both growth and value investors. Consider accumulating in tranches to mitigate short-term volatility. Long-term fundamentals strongly support this position.`;
    } else if (upsidePct >= 15) {
      shortTermRec = 'BUY'; shortTermClass = 'buy';
      longTermRec  = 'BUY'; longTermClass  = 'buy';
      riskLevel    = 1;
      analystNote  = `${ticker} offers a solid ${upsidePct.toFixed(1)}% upside. Favorable risk-reward for both time frames. Suitable for SIP-style accumulation. Monitor sector tailwinds and quarterly earnings.`;
    } else if (upsidePct >= 8) {
      shortTermRec = 'ACCUMULATE'; shortTermClass = 'accumulate';
      longTermRec  = 'BUY'; longTermClass          = 'buy';
      riskLevel    = 2;
      analystNote  = `Moderate upside of ${upsidePct.toFixed(1)}% for ${ticker}. Accumulate on dips for a better margin of safety. Long-term growth thesis remains intact — good for patient investors.`;
    } else if (upsidePct >= 3) {
      shortTermRec = 'HOLD'; shortTermClass = 'hold';
      longTermRec  = 'ACCUMULATE'; longTermClass = 'accumulate';
      riskLevel    = 2;
      analystNote  = `Limited short-term headroom (~${upsidePct.toFixed(1)}%) for ${ticker}. Hold existing positions. Long-term investors can look to accumulate below key support levels if fundamentals are strong.`;
    } else if (upsidePct >= 0) {
      shortTermRec = 'HOLD'; shortTermClass = 'hold';
      longTermRec  = 'HOLD'; longTermClass  = 'hold';
      riskLevel    = 2;
      analystNote  = `${ticker} is trading near fair value with minimal upside (${upsidePct.toFixed(1)}%). A cautious HOLD is advised. Reassess on next earnings release or a significant sector development.`;
    } else if (upsidePct >= -8) {
      shortTermRec = 'SELL'; shortTermClass = 'sell';
      longTermRec  = 'HOLD'; longTermClass  = 'hold';
      riskLevel    = 3;
      analystNote  = `${ticker} target is ${Math.abs(upsidePct).toFixed(1)}% below entry — a downside scenario is flagged. Consider trimming short-term positions. Long-term holders may wait for fundamental recovery if the business case is intact.`;
    } else {
      shortTermRec = 'STRONG SELL'; shortTermClass = 'strong-sell';
      longTermRec  = 'SELL'; longTermClass          = 'sell';
      riskLevel    = 4;
      analystNote  = `Significant downside risk of ${Math.abs(upsidePct).toFixed(1)}% identified for ${ticker}. A strong exit signal for both time frames. Capital preservation should be the priority — adhere strictly to stop-loss discipline.`;
    }

    // Risk/Reward Ratio
    let rrRatio: number | null = null;
    if (stop && stop > 0) {
      const reward = target - entry;
      const risk   = entry - stop;
      if (risk > 0) rrRatio = parseFloat((reward / risk).toFixed(2));
    }

    const riskLabels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];

    return {
      ticker, entry, target, stopLoss: stop,
      upsidePct, riskLevel, riskLabel: riskLabels[riskLevel], rrRatio,
      shortTermRec, longTermRec, shortTermClass, longTermClass, analystNote
    };
  }

  getRiskBarWidth(riskLevel: number): string {
    return ['15%', '30%', '55%', '75%', '95%'][riskLevel];
  }

  getRiskBarColor(riskLevel: number): string {
    return ['#6ee7b7', '#34d399', '#fbbf24', '#f97316', '#f43f5e'][riskLevel];
  }

  getDonutColor(pct: number): string {
    if (pct >= 15) return '#10b981';
    if (pct >=  5) return '#60a5fa';
    if (pct >=  0) return '#fbbf24';
    return '#f43f5e';
  }

  getDonutOffset(pct: number): number {
    const circ   = 2 * Math.PI * 26; // 163.36
    const capped = Math.min(Math.max(pct, 0), 100);
    return circ - (capped / 100) * circ;
  }
}
