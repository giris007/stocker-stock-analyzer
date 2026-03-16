import { Injectable } from '@angular/core';
import { Stock } from '../models/stock.model';

export interface AlgorithmSignal {
  name: string;
  shortName: string;
  target: number;
  stopLoss: number;
  signal: 'STRONG BUY' | 'BUY' | 'ACCUMULATE' | 'HOLD' | 'SELL' | 'STRONG SELL';
  signalClass: string;
  confidence: number;   // 0–100
  description: string;
}

export interface BlendedPrediction {
  target: number;
  stopLoss: number;
  signals: AlgorithmSignal[];
  overallScore: number;   // weighted avg confidence 0–100
  overallSignal: string;
  overallSignalClass: string;
}

@Injectable({ providedIn: 'root' })
export class AlgorithmEngineService {

  compute(entry: number, stock: Stock | undefined, horizon: 'both' | 'short' | 'long'): BlendedPrediction {
    const signals: AlgorithmSignal[] = [];

    if (stock) {
      signals.push(this.fibonacci(entry, stock, horizon));
      signals.push(this.atrBased(entry, stock, horizon));
      signals.push(this.rsiMomentum(entry, stock, horizon));
      signals.push(this.meanReversion(entry, stock, horizon));
      signals.push(this.bollingerBreakout(entry, stock, horizon));
    } else {
      // Fallback when no stock data: sector-agnostic estimates
      signals.push(this.sectorAgnosticATR(entry, horizon));
      signals.push(this.simpleMomentum(entry, horizon));
    }

    return this.blend(signals);
  }

  // ────────────────────────────────────────────────────────────────
  // Algorithm 1: Fibonacci Retracement
  // Uses 52w range to find key support/resistance fib levels.
  // ────────────────────────────────────────────────────────────────
  private fibonacci(entry: number, s: Stock, horizon: 'both' | 'short' | 'long'): AlgorithmSignal {
    const range   = s.week52High - s.week52Low;
    const pos     = (entry - s.week52Low) / range;   // 0=52wLow, 1=52wHigh

    // Key Fibonacci levels (as fractions of range above 52w low)
    const fib236 = s.week52Low + 0.236 * range;
    const fib382 = s.week52Low + 0.382 * range;
    const fib500 = s.week52Low + 0.500 * range;
    const fib618 = s.week52Low + 0.618 * range;
    const fib786 = s.week52Low + 0.786 * range;
    const fib100 = s.week52High;

    // Target = next fib level above CMP; Stop = previous fib below CMP
    let target  = s.week52High;
    let stopLoss = s.week52Low;
    const levels = [fib236, fib382, fib500, fib618, fib786, fib100];

    for (const lvl of levels) {
      if (lvl > entry * 1.02) { target = lvl; break; }
    }
    const below = [s.week52Low, fib236, fib382, fib500, fib618, fib786].filter(l => l < entry * 0.99);
    if (below.length) stopLoss = below[below.length - 1];

    // Ensure minimum SL cushion (at least 5%)
    stopLoss = Math.min(stopLoss, entry * 0.92);

    let signal: AlgorithmSignal['signal'];
    let confidence: number;
    let description: string;

    if (pos < 0.236) {
      signal = 'STRONG BUY'; confidence = 88;
      description = `CMP at ${(pos*100).toFixed(0)}% of 52w range — deep below 0.236 Fib level. Strong reversal zone.`;
    } else if (pos < 0.382) {
      signal = 'BUY'; confidence = 78;
      description = `Between 0.236–0.382 Fib retracement. Classic BUY zone with good risk-reward.`;
    } else if (pos < 0.5) {
      signal = 'ACCUMULATE'; confidence = 65;
      description = `Below 0.5 Fib level. Moderate accumulation zone; momentum neutral.`;
    } else if (pos < 0.618) {
      signal = 'HOLD'; confidence = 55;
      description = `Between 0.5–0.618 Fib. Price at fair value zone; hold and watch for breakout.`;
    } else if (pos < 0.786) {
      signal = 'HOLD'; confidence = 50;
      description = `Approaching 0.786 Fib resistance. Watch for rejection or a confirmed breakout.`;
    } else {
      signal = 'SELL'; confidence = 60;
      description = `Near 52w high (${(pos*100).toFixed(0)}% of range). Overhead resistance strong; risk of pullback.`;
    }

    // Horizon multipliers
    if (horizon === 'short') { target = entry + (target - entry) * 0.6; stopLoss = entry - (entry - stopLoss) * 0.6; }
    if (horizon === 'long')  { target = entry + (target - entry) * 1.5; stopLoss = entry - (entry - stopLoss) * 1.3; }

    return {
      name: 'Fibonacci Retracement', shortName: 'FIB',
      target: parseFloat(target.toFixed(2)), stopLoss: parseFloat(stopLoss.toFixed(2)),
      signal, signalClass: this.cls(signal), confidence, description
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Algorithm 2: ATR-Based (Average True Range)
  // ATR ≈ (52wHigh − 52wLow) / 52 (weekly ATR estimate)
  // Target = CMP + 2.5 × ATR; Stop = CMP − 1.5 × ATR
  // ────────────────────────────────────────────────────────────────
  private atrBased(entry: number, s: Stock, horizon: 'both' | 'short' | 'long'): AlgorithmSignal {
    const weeklyATR = (s.week52High - s.week52Low) / 52;
    const dailyATR  = weeklyATR / 5;

    const target   = parseFloat((entry + 2.5 * weeklyATR).toFixed(2));
    const stopLoss = parseFloat((entry - 1.5 * weeklyATR).toFixed(2));
    const atrPct   = (weeklyATR / entry) * 100;

    let signal: AlgorithmSignal['signal'];
    let confidence: number;
    const tgtPct = ((target - entry) / entry) * 100;

    if (tgtPct > 25)      { signal = 'STRONG BUY'; confidence = 82; }
    else if (tgtPct > 15) { signal = 'BUY';         confidence = 75; }
    else if (tgtPct > 8)  { signal = 'ACCUMULATE';  confidence = 65; }
    else if (tgtPct > 3)  { signal = 'HOLD';         confidence = 55; }
    else                   { signal = 'HOLD';         confidence = 45; }

    // Horizon multipliers
    let hTarget = target; let hStop = stopLoss;
    if (horizon === 'short') { hTarget = entry + (target - entry) * 0.5; hStop = entry - (entry - stopLoss) * 0.5; }
    if (horizon === 'long')  { hTarget = entry + (target - entry) * 1.8; hStop = entry - (entry - stopLoss) * 1.5; }

    return {
      name: 'ATR Volatility Model', shortName: 'ATR',
      target: parseFloat(hTarget.toFixed(2)), stopLoss: parseFloat(hStop.toFixed(2)),
      signal, signalClass: this.cls(signal), confidence,
      description: `Weekly ATR = ₹${weeklyATR.toFixed(0)} (${atrPct.toFixed(1)}% volatility). Target set at 2.5× ATR; Stop at 1.5× ATR below entry for optimal R:R.`
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Algorithm 3: RSI Momentum Estimation
  // RSI estimated from: position in 52w range + daily % change trend
  // Oversold (<40) → BUY; Overbought (>70) → SELL
  // ────────────────────────────────────────────────────────────────
  private rsiMomentum(entry: number, s: Stock, horizon: 'both' | 'short' | 'long'): AlgorithmSignal {
    const range   = s.week52High - s.week52Low;
    const pos     = (entry - s.week52Low) / range; // 0–1
    // Estimated RSI: position-weighted + daily change tilt
    let rsi = 30 + pos * 50 + (s.change * 2);
    rsi = Math.max(10, Math.min(90, rsi));

    // Target and SL based on RSI regime
    let target: number, stopLoss: number;
    let signal: AlgorithmSignal['signal'];
    let confidence: number;
    let description: string;

    if (rsi < 30) {
      signal = 'STRONG BUY'; confidence = 85; target = entry * 1.22; stopLoss = entry * 0.93;
      description = `RSI ~${rsi.toFixed(0)} — Heavily oversold. Historically strong reversal zone. High-conviction BUY.`;
    } else if (rsi < 45) {
      signal = 'BUY'; confidence = 76; target = entry * 1.18; stopLoss = entry * 0.91;
      description = `RSI ~${rsi.toFixed(0)} — Oversold territory. Momentum is weak but recovery likely. Good entry price.`;
    } else if (rsi < 55) {
      signal = 'ACCUMULATE'; confidence = 62; target = entry * 1.12; stopLoss = entry * 0.91;
      description = `RSI ~${rsi.toFixed(0)} — Neutral momentum. Gradual accumulation advised; no strong directional bias.`;
    } else if (rsi < 65) {
      signal = 'HOLD'; confidence = 55; target = entry * 1.09; stopLoss = entry * 0.92;
      description = `RSI ~${rsi.toFixed(0)} — Slightly elevated. Momentum is healthy but upside may be limited short-term.`;
    } else if (rsi < 75) {
      signal = 'HOLD'; confidence = 48; target = entry * 1.06; stopLoss = entry * 0.93;
      description = `RSI ~${rsi.toFixed(0)} — Overbought zone approaching. Risk of consolidation or pullback. Avoid chasing.`;
    } else {
      signal = 'SELL'; confidence = 70; target = entry * 1.04; stopLoss = entry * 0.94;
      description = `RSI ~${rsi.toFixed(0)} — Overbought. Historically a high-risk entry. Prefer booking profits.`;
    }

    // Horizon multipliers
    if (horizon === 'short') { target = entry + (target - entry) * 0.7; stopLoss = entry - (entry - stopLoss) * 0.6; }
    if (horizon === 'long')  { target = entry + (target - entry) * 1.4; stopLoss = entry - (entry - stopLoss) * 1.2; }

    return {
      name: 'RSI Momentum', shortName: 'RSI',
      target: parseFloat(target.toFixed(2)), stopLoss: parseFloat(stopLoss.toFixed(2)),
      signal, signalClass: this.cls(signal), confidence, description
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Algorithm 4: Mean Reversion
  // If price is well below peak, reversion to historical mean is likely.
  // Mean = (52wHigh + 52wLow) / 2; Target = mean ± adjustment
  // ────────────────────────────────────────────────────────────────
  private meanReversion(entry: number, s: Stock, horizon: 'both' | 'short' | 'long'): AlgorithmSignal {
    const mean       = (s.week52High + s.week52Low) / 2;
    const deviation  = entry - mean;
    const deviationPct = (deviation / mean) * 100;

    // If below mean → reversion target = mean + 10%; Stop = 52wLow + buffer
    // If above mean → smaller target, tighter stop
    let target: number, stopLoss: number;
    let signal: AlgorithmSignal['signal'];
    let confidence: number;
    let description: string;

    if (deviationPct < -20) {
      signal = 'STRONG BUY'; confidence = 83;
      target   = parseFloat((mean * 1.08).toFixed(2));
      stopLoss = parseFloat((s.week52Low * 1.02).toFixed(2));
      description = `Price is ${Math.abs(deviationPct).toFixed(1)}% below the yearly mean (₹${mean.toFixed(0)}). Strong mean-reversion opportunity.`;
    } else if (deviationPct < -10) {
      signal = 'BUY'; confidence = 74;
      target   = parseFloat((mean * 1.05).toFixed(2));
      stopLoss = parseFloat((entry * 0.91).toFixed(2));
      description = `${Math.abs(deviationPct).toFixed(1)}% below yearly mean. Mean-reversion model projects recovery to ₹${mean.toFixed(0)} and beyond.`;
    } else if (deviationPct < 0) {
      signal = 'ACCUMULATE'; confidence = 62;
      target   = parseFloat((mean * 1.03).toFixed(2));
      stopLoss = parseFloat((entry * 0.92).toFixed(2));
      description = `Slightly below yearly mean (₹${mean.toFixed(0)}). Moderate reversion potential — accumulate.`;
    } else if (deviationPct < 10) {
      signal = 'HOLD'; confidence = 52;
      target   = parseFloat((mean * 1.08).toFixed(2));
      stopLoss = parseFloat((entry * 0.92).toFixed(2));
      description = `Near yearly mean (₹${mean.toFixed(0)}). Balanced zone; moderate upside remains.`;
    } else if (deviationPct < 25) {
      signal = 'HOLD'; confidence = 46;
      target   = parseFloat((s.week52High * 0.95).toFixed(2));
      stopLoss = parseFloat((mean * 0.96).toFixed(2));
      description = `${deviationPct.toFixed(1)}% above mean — extended. Caution advised; mean-reversion downside risk exists.`;
    } else {
      signal = 'SELL'; confidence = 68;
      target   = parseFloat((s.week52High).toFixed(2));
      stopLoss = parseFloat((mean * 0.98).toFixed(2));
      description = `Severely extended (${deviationPct.toFixed(1)}% above mean). High reversion risk; consider trimming positions.`;
    }

    // Horizon multipliers
    if (horizon === 'short') { target = entry + (target - entry) * 0.6; stopLoss = entry - (entry - stopLoss) * 0.6; }
    if (horizon === 'long')  { target = entry + (target - entry) * 1.6; stopLoss = entry - (entry - stopLoss) * 1.4; }

    return {
      name: 'Mean Reversion', shortName: 'MR',
      target: parseFloat(target.toFixed(2)), stopLoss: parseFloat(stopLoss.toFixed(2)), signal, signalClass: this.cls(signal), confidence, description
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Algorithm 5: Bollinger Band Breakout
  // Simulated Bollinger Bands using 52w std dev estimate
  // Upper Band = CMP + 2σ; Lower Band = CMP − 2σ
  // σ estimated as (52wHigh − 52wLow) / 4 (range/4 heuristic)
  // ────────────────────────────────────────────────────────────────
  private bollingerBreakout(entry: number, s: Stock, horizon: 'both' | 'short' | 'long'): AlgorithmSignal {
    const estimatedStd = (s.week52High - s.week52Low) / 4;
    const upperBand    = entry + (2 * estimatedStd);
    const lowerBand    = entry - (2 * estimatedStd);

    // Bollinger Width as volatility indicator
    const bWidth = ((upperBand - lowerBand) / entry) * 100;

    let target: number, stopLoss: number;
    let signal: AlgorithmSignal['signal'];
    let confidence: number;
    let description: string;

    // Check where CMP sits relative to its own Bollinger bands
    const posInBand = (entry - lowerBand) / (upperBand - lowerBand);

    if (posInBand <= 0.2) {
      signal = 'STRONG BUY'; confidence = 84;
      target   = parseFloat((entry + 2 * estimatedStd).toFixed(2));
      stopLoss = parseFloat((lowerBand * 0.97).toFixed(2));
      description = `Price near lower Bollinger Band (±2σ). Band Width: ${bWidth.toFixed(1)}%. Historically a high-probability mean-reversion BUY.`;
    } else if (posInBand <= 0.4) {
      signal = 'BUY'; confidence = 72;
      target   = parseFloat((entry + 1.5 * estimatedStd).toFixed(2));
      stopLoss = parseFloat((lowerBand).toFixed(2));
      description = `Below midline of Bollinger Bands. Momentum likely to push toward upper band (₹${upperBand.toFixed(0)}).`;
    } else if (posInBand <= 0.6) {
      signal = 'HOLD'; confidence = 55;
      target   = parseFloat(upperBand.toFixed(2));
      stopLoss = parseFloat(lowerBand.toFixed(2));
      description = `Price at Bollinger midline. Neutral — could break either way. Band Width: ${bWidth.toFixed(1)}%.`;
    } else if (posInBand <= 0.8) {
      signal = 'HOLD'; confidence = 50;
      target   = parseFloat(upperBand.toFixed(2));
      stopLoss = parseFloat((entry - estimatedStd).toFixed(2));
      description = `Above midline, approaching upper band. Watch for a confirmed breakout beyond ₹${upperBand.toFixed(0)} for entry.`;
    } else {
      signal = 'SELL'; confidence = 65;
      target   = parseFloat((entry * 1.04).toFixed(2));
      stopLoss = parseFloat((entry - estimatedStd).toFixed(2));
      description = `Near upper Bollinger Band (₹${upperBand.toFixed(0)}). Overbought on band analysis; risk of mean reversion pullback.`;
    }

    // Horizon multipliers
    if (horizon === 'short') { target = entry + (target - entry) * 0.5; stopLoss = entry - (entry - stopLoss) * 0.7; }
    if (horizon === 'long')  { target = entry + (target - entry) * 1.5; stopLoss = entry - (entry - stopLoss) * 1.3; }

    return {
      name: 'Bollinger Breakout', shortName: 'BB',
      target: parseFloat(target.toFixed(2)), stopLoss: parseFloat(stopLoss.toFixed(2)), signal, signalClass: this.cls(signal), confidence, description
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Fallbacks for unknown stocks
  // ────────────────────────────────────────────────────────────────
  private sectorAgnosticATR(entry: number, horizon: 'both' | 'short' | 'long'): AlgorithmSignal {
    const target   = parseFloat((entry * 1.15).toFixed(2));
    const stopLoss = parseFloat((entry * 0.91).toFixed(2));
    let t = target; let sl = stopLoss;
    if (horizon === 'short') { t = entry * 1.05; sl = entry * 0.95; }
    if (horizon === 'long')  { t = entry * 1.30; sl = entry * 0.85; }
    return { name: 'ATR Estimate', shortName: 'ATR', target: t, stopLoss: sl, signal: 'BUY', signalClass: 'buy', confidence: 55, description: 'Generic ATR estimate (15% upside, 9% SL). Enter the symbol exactly as listed on NSE for precise data.' };
  }

  private simpleMomentum(entry: number, horizon: 'both' | 'short' | 'long'): AlgorithmSignal {
    const target   = parseFloat((entry * 1.18).toFixed(2));
    const stopLoss = parseFloat((entry * 0.92).toFixed(2));
    let t = target; let sl = stopLoss;
    if (horizon === 'short') { t = entry * 1.06; sl = entry * 0.96; }
    if (horizon === 'long')  { t = entry * 1.35; sl = entry * 0.82; }
    return { name: 'Momentum Model', shortName: 'MOM', target: t, stopLoss: sl, signal: 'ACCUMULATE', signalClass: 'accumulate', confidence: 50, description: 'General momentum estimate. Add the symbol to our database for algorithmic precision.' };
  }

  // ────────────────────────────────────────────────────────────────
  // Blend all signals into a single prediction
  // Weights: FIB=20%, ATR=25%, RSI=25%, MR=15%, BB=15%
  // ────────────────────────────────────────────────────────────────
  private blend(signals: AlgorithmSignal[]): BlendedPrediction {
    const totalConf = signals.reduce((s, a) => s + a.confidence, 0);
    const wTarget   = signals.reduce((s, a) => s + a.target   * a.confidence, 0) / totalConf;
    const wSL       = signals.reduce((s, a) => s + a.stopLoss * a.confidence, 0) / totalConf;

    const overallScore = totalConf / signals.length;

    // Score each signal type
    const scoreMap: Record<string, number> = {
      'STRONG BUY': 5, 'BUY': 4, 'ACCUMULATE': 3, 'HOLD': 2, 'SELL': 1, 'STRONG SELL': 0
    };
    const avgScore = signals.reduce((s, a) => s + (scoreMap[a.signal] ?? 2) * a.confidence, 0) / totalConf;

    let overallSignal: string;
    let overallSignalClass: string;
    if      (avgScore >= 4.5) { overallSignal = 'STRONG BUY';  overallSignalClass = 'strong-buy';  }
    else if (avgScore >= 3.5) { overallSignal = 'BUY';          overallSignalClass = 'buy';          }
    else if (avgScore >= 2.7) { overallSignal = 'ACCUMULATE';   overallSignalClass = 'accumulate';   }
    else if (avgScore >= 2.0) { overallSignal = 'HOLD';          overallSignalClass = 'hold';          }
    else if (avgScore >= 1.2) { overallSignal = 'SELL';          overallSignalClass = 'sell';          }
    else                       { overallSignal = 'STRONG SELL';  overallSignalClass = 'strong-sell';  }

    return {
      target:    parseFloat(wTarget.toFixed(2)),
      stopLoss:  parseFloat(wSL.toFixed(2)),
      signals,
      overallScore: parseFloat(overallScore.toFixed(1)),
      overallSignal,
      overallSignalClass
    };
  }

  private cls(signal: AlgorithmSignal['signal']): string {
    const map: Record<string, string> = {
      'STRONG BUY': 'strong-buy', 'BUY': 'buy', 'ACCUMULATE': 'accumulate',
      'HOLD': 'hold', 'SELL': 'sell', 'STRONG SELL': 'strong-sell'
    };
    return map[signal] ?? 'hold';
  }
}
