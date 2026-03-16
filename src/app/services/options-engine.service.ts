import { Injectable } from '@angular/core';

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionResult {
  theoreticalPrice: number;
  iv: number;
  greeks: OptionGreeks;
  pop: number; // Probability of Profit (%)
}

@Injectable({ providedIn: 'root' })
export class OptionsEngineService {
  
  // Standard Normal Cumulative Distribution Function
  private cdf(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  }

  // Standard Normal Probability Density Function
  private pdf(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * Black-Scholes Formula to calculate Theoretical Price & Greeks
   * @param isCall true for CE, false for PE
   * @param S Spot Price
   * @param K Strike Price
   * @param T Time to Expiry (in years)
   * @param r Risk-free rate (decimal, e.g. 0.07 for 7%)
   * @param v Volatility (decimal, e.g. 0.2 for 20%)
   * @param q Dividend yield (decimal) - defaults to 0
   */
  public calculateBlackScholes(isCall: boolean, S: number, K: number, T: number, r: number, v: number, q = 0): { price: number, greeks: OptionGreeks } {
    // Edge case: Expiry is today (T = 0)
    if (T <= 0) {
      const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
      return { 
        price: intrinsic, 
        greeks: { delta: isCall ? (S>K?1:0) : (S<K?-1:0), gamma: 0, theta: 0, vega: 0, rho: 0 } 
      };
    }

    const d1 = (Math.log(S / K) + (r - q + (v * v) / 2) * T) / (v * Math.sqrt(T));
    const d2 = d1 - v * Math.sqrt(T);

    const Nd1 = this.cdf(d1);
    const Nd2 = this.cdf(d2);
    const N_d1 = this.cdf(-d1);
    const N_d2 = this.cdf(-d2);
    const pd1 = this.pdf(d1);

    let price = 0;
    let delta = 0;
    let theta = 0;
    let rho = 0;

    const gamma = (Math.exp(-q * T) * pd1) / (S * v * Math.sqrt(T));
    const vega = S * Math.exp(-q * T) * pd1 * Math.sqrt(T) / 100; // Divided by 100 to show value per 1% change

    if (isCall) {
      price = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2;
      delta = Math.exp(-q * T) * Nd1;
      theta = (-(S * v * Math.exp(-q * T) * pd1) / (2 * Math.sqrt(T)) 
                - r * K * Math.exp(-r * T) * Nd2 
                + q * S * Math.exp(-q * T) * Nd1) / 365; // Divided by 365 for daily decay
      rho = K * T * Math.exp(-r * T) * Nd2 / 100;
    } else {
      price = K * Math.exp(-r * T) * N_d2 - S * Math.exp(-q * T) * N_d1;
      delta = Math.exp(-q * T) * (Nd1 - 1);
      theta = (-(S * v * Math.exp(-q * T) * pd1) / (2 * Math.sqrt(T)) 
                + r * K * Math.exp(-r * T) * N_d2 
                - q * S * Math.exp(-q * T) * N_d1) / 365;
      rho = -K * T * Math.exp(-r * T) * N_d2 / 100;
    }

    return {
      price: Math.max(0, price),
      greeks: { delta, gamma, theta, vega, rho }
    };
  }

  /**
   * Newton-Raphson method to estimate Implied Volatility
   * @param marketPrice The actual premium trading in the market
   */
  public estimateIV(isCall: boolean, S: number, K: number, T: number, r: number, marketPrice: number, q = 0): number {
    let v = 0.3; // Initial guess 30%
    const MAX_ITER = 100;
    const TOLERANCE = 1e-5;

    // Check intrinsic value bounds
    const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
    if (marketPrice < intrinsic) return 0; // IV is undefined/0 if trading below intrinsic

    for (let i = 0; i < MAX_ITER; i++) {
      const bs = this.calculateBlackScholes(isCall, S, K, T, r, v, q);
      const diff = bs.price - marketPrice;

      if (Math.abs(diff) < TOLERANCE) return v;

      // Vega is multiplied by 100 in our bs function, so we must multiply it back here to get raw derivative
      let vegaRaw = bs.greeks.vega * 100; 
      
      // Prevent division by zero if deep out/in the money
      if (vegaRaw < 1e-4) {
        // Fallback to bisection if Newton-Raphson fails due to flat Vega
        return this.bisectionIV(isCall, S, K, T, r, marketPrice, q);
      }

      v = v - (diff / vegaRaw);

      if (v <= 0) v = 0.001; // IV cannot be negative
      if (v > 5.0) v = 5.0;  // Cap at 500% to prevent blowups
    }

    return v;
  }

  /**
   * Fallback Bisection method for IV estimation when Newton-Raphson fails
   */
  private bisectionIV(isCall: boolean, S: number, K: number, T: number, r: number, marketPrice: number, q: number): number {
    let low = 0.001;
    let high = 5.0; // 500%
    let mid = 0.5;

    for (let i = 0; i < 50; i++) {
      mid = (low + high) / 2;
      const price = this.calculateBlackScholes(isCall, S, K, T, r, mid, q).price;
      
      if (Math.abs(price - marketPrice) < 1e-4) return mid;

      if (price > marketPrice) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return mid;
  }

  /**
   * Calculates Probability of Profit (POP) assuming log-normal distribution
   */
  public calculatePOP(isCall: boolean, S: number, K: number, T: number, v: number, premium: number): number {
    if (T <= 0) return 0;
    // Break even point at expiry
    const bep = isCall ? K + premium : K - premium;
    
    // Calculate the probability of the stock being beyond the break-even point
    // Distance to break-even in standard deviations
    const d2 = (Math.log(S / bep) + (0 - (v * v) / 2) * T) / (v * Math.sqrt(T));
    
    // For a call buyer, POP is probability S > BEP (Nd2)
    // For a put buyer, POP is probability S < BEP (N(-d2))
    return isCall ? this.cdf(d2) * 100 : this.cdf(-d2) * 100;
  }
}
