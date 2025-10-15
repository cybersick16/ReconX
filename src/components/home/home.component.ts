import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScanDataService } from '../../services/scan-data.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <!-- ReconX Branding -->
      <div class="text-center py-8">
        <div class="inline-block p-4 bg-cyan-900/50 rounded-full mb-4 border border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <svg class="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3M12 21V3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M21 12H3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M17.6569 6.34315L6.34315 17.6569" stroke="currentColor" stroke-width="1.5"/>
            <path d="M17.6569 17.6569L6.34315 6.34315" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </div>
        <h1 class="text-5xl font-orbitron font-bold text-white">ReconX</h1>
        <p class="text-lg text-gray-400 mt-2">See Beyond Threats.</p>
      </div>

      <!-- Start Scan Card -->
      <div class="glass-panel p-6">
        <h2 class="text-2xl font-orbitron font-bold mb-4 text-white">Start a New Scan</h2>
        <form (ngSubmit)="onStartScan()" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div class="md:col-span-2">
            <label for="targetUrl" class="block text-sm font-medium text-gray-300 mb-1">Target Domain or URL</label>
            <input type="text" id="targetUrl" name="targetUrl" [(ngModel)]="targetUrl"
                   class="w-full p-2 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-gray-900/80 text-white"
                   placeholder="e.g., https://example.com">
          </div>
          <div>
            <label for="scanProfile" class="block text-sm font-medium text-gray-300 mb-1">Scan Profile</label>
            <select id="scanProfile" name="scanProfile" [(ngModel)]="scanProfile"
                    class="w-full p-2 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-gray-900/80 text-white">
              <option value="quick">Quick Scan</option>
              <option value="full">Full Scan</option>
            </select>
          </div>
          <div class="md:col-span-3">
             <button type="submit" [disabled]="!targetUrl.trim()"
                  class="w-full md:w-auto px-6 py-2 btn-glow-cyan">
              Start Scan
            </button>
          </div>
        </form>
      </div>

      <!-- Scan Queue Card -->
      <div class="glass-panel p-6">
        <h2 class="text-2xl font-orbitron font-bold mb-4 text-white">Scan Queue</h2>
        <div class="space-y-4">
          @for (scan of queuedScans(); track scan.id) {
            <div class="p-4 border border-white/10 rounded-lg flex items-center justify-between bg-black/20">
              <div>
                <p class="font-semibold text-white">{{ scan.name }}</p>
                <p class="text-sm text-gray-400">{{ scan.timestamp | date:'medium' }}</p>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium px-3 py-1 rounded-full border" [class]="getStatusClass(scan.status)">
                  {{ scan.status }}
                </span>
                <button (click)="onCancelScan(scan.id)" title="Cancel Scan"
                        class="text-gray-500 hover:text-red-500 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="p-8 border-dashed border-2 border-gray-600 rounded-lg text-center text-gray-500">
              <p>The scan queue is empty.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {
  scanDataService = inject(ScanDataService);
  targetUrl: string = 'https://example.com';
  scanProfile: 'quick' | 'full' = 'quick';

  private allReports = toSignal(this.scanDataService.getScanReports(), { initialValue: [] });
  
  queuedScans = computed(() => this.allReports().filter(r => r.status !== 'Completed'));

  onStartScan(): void {
    if (!this.targetUrl.trim()) return;
    this.scanDataService.startScan(this.targetUrl, this.scanProfile);
    this.targetUrl = ''; // Clear input after starting
  }

  onCancelScan(scanId: string): void {
    this.scanDataService.cancelScan(scanId);
  }

  getStatusClass(status: 'Completed' | 'Scanning' | 'Queued'): string {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'Scanning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 animate-pulse-slow';
      case 'Queued': return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  }
}
