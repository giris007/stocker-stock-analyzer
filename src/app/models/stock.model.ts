export interface Stock {
  name: string;
  fullName: string;
  sector: string;
  cmp: number;          // Current Market Price
  week52High: number;
  week52Low: number;
  pe: number;
  change: number;       // % change today
  marketCap: string;    // e.g. "Large Cap"
  exchange: 'NSE' | 'BSE' | 'NSE/BSE';
}

export interface AlgorithmSignal {
  name: string;
  shortName: string;
  target: number;
  stopLoss: number;
  signal: 'STRONG BUY' | 'BUY' | 'ACCUMULATE' | 'HOLD' | 'SELL' | 'STRONG SELL';
  signalClass: string;
  confidence: number;
  description: string;
}

export interface BlendedPrediction {
  target: number;
  stopLoss: number;
  signals: AlgorithmSignal[];
  overallScore: number;
  overallSignal: string;
  overallSignalClass: string;
}

export interface AnalysisResult {
  ticker: string;
  entry: number;
  target: number;
  stopLoss: number | null;
  upsidePct: number;
  riskLevel: number;       // 0-4
  riskLabel: string;
  rrRatio: number | null;
  shortTermRec: string;
  longTermRec: string;
  shortTermClass: string;
  longTermClass: string;
  analystNote: string;
  prediction?: BlendedPrediction; // Now includes the multi-alg engine results
}

export interface Holding {
  symbol: string;
  qty: number;
  avgPrice: number;
  addedAt: number; // timestamp
}

export interface HoldingWithPnL extends Holding {
  cmp: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
}

export interface ScreenerFilter {
  sector: string;
  minUpside: number;
  recType: string;
  sortField: string;
  sortDir: 'asc' | 'desc';
}

export interface ScreenerRow extends Stock {
  upsidePct: number;
  rec: string;
  recClass: string;
}
