// Fix: Implement the root AppComponent
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<app-dashboard></app-dashboard>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardComponent],
})
export class AppComponent {}