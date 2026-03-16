import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="nav-container">

        <a routerLink="/" class="nav-brand">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <span class="brand-name">Stocker<span class="brand-dot">.</span></span>
        </a>

        <div class="nav-links" [class.open]="menuOpen">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Analyzer
          </a>
          <a routerLink="/screener" routerLinkActive="active" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Screener
          </a>
          <a routerLink="/portfolio" routerLinkActive="active" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>
            Portfolio
          </a>
          <a routerLink="/options" routerLinkActive="active" (click)="closeMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line><path d="M10 9h4v6h-4z"></path></svg>
            Options
          </a>
          <span class="nav-badge">NSE · BSE</span>
        </div>

        <button class="hamburger" (click)="toggleMenu()" [class.open]="menuOpen" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>

      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      background: rgba(5, 7, 20, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      transition: background 0.3s;
    }
    .navbar.scrolled { background: rgba(5, 7, 20, 0.92); }

    .nav-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex; align-items: center; gap: 0.6rem;
      text-decoration: none; color: #f1f5f9;
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #7c3aed, #c026d3);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name { font-size: 1.25rem; font-weight: 800; }
    .brand-dot  { color: #a78bfa; }

    .nav-links {
      display: flex; align-items: center; gap: 0.35rem;
    }
    .nav-links a {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .nav-links a:hover { color: #e0e7ff; background: rgba(255,255,255,0.06); }
    .nav-links a.active { color: #c4b5fd; background: rgba(124, 58, 237, 0.15); }

    .nav-badge {
      margin-left: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: rgba(124, 58, 237, 0.15);
      border: 1px solid rgba(124, 58, 237, 0.3);
      color: #a78bfa;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .hamburger { display: none; }

    @media (max-width: 768px) {
      .hamburger {
        display: flex; flex-direction: column;
        gap: 5px; background: none; border: none; cursor: pointer; padding: 4px;
      }
      .hamburger span {
        display: block; width: 22px; height: 2px;
        background: #94a3b8; border-radius: 2px;
        transition: all 0.3s;
      }
      .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .hamburger.open span:nth-child(2) { opacity: 0; }
      .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

      .nav-links {
        display: none; position: fixed;
        inset: 68px 0 0 0;
        background: rgba(5, 7, 20, 0.97);
        flex-direction: column;
        align-items: flex-start;
        padding: 1.5rem;
        gap: 0.5rem;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .nav-links.open { display: flex; }
      .nav-links a { width: 100%; font-size: 1rem; padding: 0.75rem 1rem; }
      .nav-badge { margin-left: 0; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  scrolled = false;
  menuOpen = false;

  ngOnInit(): void {
    window.addEventListener('scroll', () => this.scrolled = window.scrollY > 10);
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void  { this.menuOpen = false; }
}
