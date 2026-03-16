import { Injectable } from '@angular/core';
import { Stock } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockDataService {

  readonly SECTORS = [
    'All', 'Banking', 'IT', 'Energy', 'NBFC', 'Auto',
    'Pharma', 'FMCG', 'Metals', 'Infra', 'Telecom', 'Retail'
  ];

  readonly STOCKS: Stock[] = [
    { name: 'NIFTY',      fullName: 'Nifty 50 Index',                sector: 'All',      cmp: 22450.00, week52High: 22775.70, week52Low: 16828.35, pe: 22.5, change:  0.85, marketCap: 'Index',     exchange: 'NSE' },
    { name: 'BANKNIFTY',  fullName: 'Nifty Bank Index',              sector: 'Banking',  cmp: 48950.00, week52High: 49057.40, week52Low: 38613.15, pe: 16.2, change:  1.10, marketCap: 'Index',     exchange: 'NSE' },
    { name: 'RELIANCE',   fullName: 'Reliance Industries Ltd',       sector: 'Energy',   cmp: 2847.55, week52High: 3217.00, week52Low: 2221.05, pe: 23.4, change:  1.24, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'TCS',        fullName: 'Tata Consultancy Services Ltd', sector: 'IT',       cmp: 3541.20, week52High: 4255.50, week52Low: 3311.55, pe: 30.1, change: -0.38, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'HDFCBANK',   fullName: 'HDFC Bank Ltd',                 sector: 'Banking',  cmp: 1623.40, week52High: 1794.00, week52Low: 1363.55, pe: 18.9, change:  0.89, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'INFY',       fullName: 'Infosys Ltd',                   sector: 'IT',       cmp: 1482.00, week52High: 1953.90, week52Low: 1358.35, pe: 28.6, change: -0.61, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'ICICIBANK',  fullName: 'ICICI Bank Ltd',                sector: 'Banking',  cmp: 1046.80, week52High: 1196.00, week52Low:  899.00, pe: 17.2, change:  0.58, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'BAJFINANCE', fullName: 'Bajaj Finance Ltd',             sector: 'NBFC',     cmp: 7218.90, week52High: 8192.00, week52Low: 6188.00, pe: 32.4, change:  1.77, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'WIPRO',      fullName: 'Wipro Ltd',                     sector: 'IT',       cmp:  462.75, week52High:  598.35, week52Low:  400.55, pe: 21.3, change:  0.45, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'SBIN',       fullName: 'State Bank of India',           sector: 'Banking',  cmp:  768.30, week52High:  912.00, week52Low:  600.65, pe: 10.8, change: -0.22, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'TATAMOTORS', fullName: 'Tata Motors Ltd',               sector: 'Auto',     cmp:  918.60, week52High: 1179.00, week52Low:  775.00, pe: 11.5, change:  2.15, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'ADANIENT',   fullName: 'Adani Enterprises Ltd',         sector: 'Infra',    cmp: 2387.40, week52High: 3743.90, week52Low: 2025.00, pe: 58.2, change: -1.05, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'HCLTECH',    fullName: 'HCL Technologies Ltd',          sector: 'IT',       cmp: 1643.55, week52High: 1978.45, week52Low: 1235.00, pe: 26.3, change:  0.33, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'KOTAKBANK',  fullName: 'Kotak Mahindra Bank Ltd',       sector: 'Banking',  cmp: 1842.30, week52High: 2063.00, week52Low: 1544.15, pe: 22.1, change: -0.44, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'LT',         fullName: 'Larsen & Toubro Ltd',           sector: 'Infra',    cmp: 3312.50, week52High: 3964.00, week52Low: 3112.05, pe: 33.8, change:  0.71, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'AXISBANK',   fullName: 'Axis Bank Ltd',                 sector: 'Banking',  cmp: 1042.60, week52High: 1340.00, week52Low:  995.05, pe: 14.6, change:  0.28, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'SUNPHARMA',  fullName: 'Sun Pharmaceutical Industries', sector: 'Pharma',   cmp: 1698.45, week52High: 1960.35, week52Low: 1310.55, pe: 36.2, change:  1.02, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'MARUTI',     fullName: 'Maruti Suzuki India Ltd',       sector: 'Auto',     cmp:12255.00, week52High:13680.00, week52Low:10400.00, pe: 26.8, change:  0.55, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'TITAN',      fullName: 'Titan Company Ltd',             sector: 'Retail',   cmp: 3427.80, week52High: 3886.00, week52Low: 2965.00, pe: 87.3, change: -0.19, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'ASIANPAINT', fullName: 'Asian Paints Ltd',              sector: 'FMCG',     cmp: 2390.00, week52High: 3395.00, week52Low: 2215.00, pe: 44.5, change: -0.87, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'NESTLEIND',  fullName: 'Nestle India Ltd',              sector: 'FMCG',     cmp:23890.00, week52High:27445.00, week52Low:20925.00, pe: 73.2, change:  0.42, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'BHARTIARTL', fullName: 'Bharti Airtel Ltd',             sector: 'Telecom',  cmp: 1614.45, week52High: 1779.00, week52Low: 1126.50, pe: 68.1, change:  1.34, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'JSWSTEEL',   fullName: 'JSW Steel Ltd',                 sector: 'Metals',   cmp:  921.35, week52High: 1063.30, week52Low:  756.15, pe: 18.9, change:  0.63, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'TATASTEEL',  fullName: 'Tata Steel Ltd',                sector: 'Metals',   cmp:  137.80, week52High:  184.60, week52Low:  124.00, pe: 22.3, change: -0.36, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'ONGC',       fullName: 'Oil and Natural Gas Corporation',sector: 'Energy',   cmp:  263.15, week52High:  345.00, week52Low:  230.20, pe:  7.4, change:  0.92, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'NTPC',       fullName: 'NTPC Ltd',                      sector: 'Energy',   cmp:  348.20, week52High:  448.00, week52Low:  295.35, pe: 18.6, change:  0.17, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'POWERGRID',  fullName: 'Power Grid Corporation of India',sector: 'Energy',   cmp:  320.45, week52High:  366.25, week52Low:  270.00, pe: 17.8, change:  0.44, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'TECHM',      fullName: 'Tech Mahindra Ltd',             sector: 'IT',       cmp: 1648.70, week52High: 1807.90, week52Low: 1142.00, pe: 38.5, change: -0.55, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'ULTRACEMCO', fullName: 'UltraTech Cement Ltd',          sector: 'Infra',    cmp:10945.00, week52High:12247.00, week52Low: 8830.00, pe: 36.1, change:  0.38, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'CIPLA',      fullName: 'Cipla Ltd',                     sector: 'Pharma',   cmp: 1542.30, week52High: 1706.45, week52Low: 1203.00, pe: 29.7, change:  0.82, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'DRREDDY',    fullName: 'Dr. Reddy\'s Laboratories Ltd', sector: 'Pharma',   cmp: 6185.00, week52High: 7563.00, week52Low: 5315.00, pe: 19.6, change: -0.29, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
    { name: 'HINDALCO',   fullName: 'Hindalco Industries Ltd',       sector: 'Metals',   cmp:  604.25, week52High:  772.65, week52Low:  468.20, pe: 12.4, change:  1.11, marketCap: 'Large Cap', exchange: 'NSE/BSE' },
  ];

  getStock(name: string): Stock | undefined {
    return this.STOCKS.find(s => s.name === name.toUpperCase());
  }

  getStocksByFilter(sector: string): Stock[] {
    if (sector === 'All') return [...this.STOCKS];
    return this.STOCKS.filter(s => s.sector === sector);
  }
}
