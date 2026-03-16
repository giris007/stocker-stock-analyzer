import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'analyzer', pathMatch: 'full' },
  { path: 'analyzer', loadComponent: () => import('./pages/analyzer/analyzer.component').then(m => m.AnalyzerComponent) },
  { path: 'screener', loadComponent: () => import('./pages/screener/screener.component').then(m => m.ScreenerComponent) },
  { path: 'portfolio', loadComponent: () => import('./pages/portfolio/portfolio.component').then(m => m.PortfolioComponent) },
  { path: 'options', loadComponent: () => import('./pages/options/options.component').then(m => m.OptionsComponent) },
  { path: '**', redirectTo: 'analyzer' }
];
