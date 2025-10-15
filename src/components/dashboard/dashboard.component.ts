// Fix: Implement the main DashboardComponent
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanDataService } from '../../services/scan-data.service';
import { ScanStateService } from '../../services/scan-state.service';
import { ScanReport } from '../../models/scan.model';
import { ScanReportComponent } from '../scan-report/scan-report.component';
import { ChatAssistantComponent } from '../chat-assistant/chat-assistant.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeComponent } from '../home/home.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="flex h-screen bg-brand-dark font-sans text-brand-text">
      <!-- Sidebar -->
      <aside class="w-1/4 bg-black/20 p-6 overflow-y-auto border-r border-white/10 flex flex-col">
        <div class="flex items-center gap-3 mb-8">
          <svg class="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3M12 21V3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M21 12H3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M17.6569 6.34315L6.34315 17.6569" stroke="currentColor" stroke-width="1.5"/>
            <path d="M17.6569 17.6569L6.34315 6.34315" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <h1 class="text-3xl font-orbitron font-bold text-white">ReconX</h1>
        </div>
        <h2 class="text-sm font-bold uppercase text-gray-400 mb-2 px-2">Scan Reports</h2>
        <nav class="flex-1">
          <ul>
            @for (report of reports(); track report.id) {
              <li (click)="selectReport(report)"
                  class="p-3 rounded-md cursor-pointer mb-2 transition-all duration-300 border border-transparent"
                  [class]="isSelected(report) ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'hover:bg-gray-700/50'">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-semibold truncate text-white">{{ report.name }}</p>
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap border"
                        [class]="getStatusClass(report.status)">
                    {{ report.status }}
                  </span>
                </div>
                <p class="text-sm mt-1" [class]="isSelected(report) ? 'text-cyan-300' : 'text-gray-400'">
                  {{ report.timestamp | date:'short' }}
                </p>
              </li>
            } @empty {
              <li class="p-3 text-gray-500 text-sm">No scan reports available.</li>
            }
          </ul>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="w-3/4 p-6 overflow-y-auto">
        @if (selectedReport(); as report) {
          <app-scan-report></app-scan-report>
        } @else {
          <app-home></app-home>
        }
      </main>

      <app-chat-assistant></app-chat-assistant>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScanReportComponent, ChatAssistantComponent, HomeComponent]
})
export class DashboardComponent {
  private scanDataService = inject(ScanDataService);
  private scanStateService = inject(ScanStateService);

  reports = toSignal(this.scanDataService.getScanReports(), { initialValue: [] });
  selectedReport = this.scanStateService.selectedReport;

  selectReport(report: ScanReport) {
    // Prevent selecting non-completed reports
    if (report.status === 'Completed') {
        this.scanStateService.selectedReport.set(report);
    }
  }

  isSelected(report: ScanReport): boolean {
    return this.selectedReport()?.id === report.id;
  }

  getStatusClass(status: 'Completed' | 'Scanning' | 'Queued'): string {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'Scanning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 animate-pulse-slow';
      case 'Queued': return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  }
}