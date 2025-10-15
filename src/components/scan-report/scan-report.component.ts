// Fix: Implement the ScanReportComponent to display scan details
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ScanStateService } from '../../services/scan-state.service';
import { GeminiService } from '../../services/gemini.service';
import { Vulnerability } from '../../models/scan.model';
import { AttackPathComponent } from '../attack-path/attack-path.component';

@Component({
  selector: 'app-scan-report',
  template: `
    @if (report(); as r) {
      <div class="space-y-8">
        <!-- Navigation Buttons -->
        <div class="flex items-center gap-4">
          <button (click)="goBackToDashboard()" class="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back
          </button>
          <span class="text-gray-600">|</span>
          <button (click)="goBackToDashboard()" class="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>
        </div>
        
        <!-- Header & Export -->
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-3xl font-orbitron font-bold mb-1 text-white">{{ r.name }}</h2>
            <p class="text-sm text-gray-400">Scanned on: {{ r.timestamp | date:'medium' }}</p>
          </div>
          <button (click)="exportReport()"
                  class="px-4 py-2 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700 flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(108,99,255,0.4)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="glass-panel p-4 border-red-500/50">
            <p class="text-4xl font-bold text-red-500">{{ r.summary.critical }}</p>
            <p class="text-sm font-medium text-red-400 mt-1">Critical</p>
          </div>
          <div class="glass-panel p-4 border-orange-500/50">
            <p class="text-4xl font-bold text-orange-400">{{ r.summary.high }}</p>
            <p class="text-sm font-medium text-orange-300 mt-1">High</p>
          </div>
          <div class="glass-panel p-4 border-yellow-500/50">
            <p class="text-4xl font-bold text-yellow-400">{{ r.summary.medium }}</p>
            <p class="text-sm font-medium text-yellow-300 mt-1">Medium</p>
          </div>
          <div class="glass-panel p-4 border-blue-500/50">
            <p class="text-4xl font-bold text-blue-400">{{ r.summary.low }}</p>
            <p class="text-sm font-medium text-blue-300 mt-1">Low</p>
          </div>
        </div>

        <!-- Vulnerabilities Table -->
        <div class="glass-panel p-6">
          <h3 class="text-2xl font-orbitron font-semibold mb-4 text-white">Vulnerabilities</h3>
          <table class="w-full text-left">
            <thead class="border-b border-white/10">
              <tr>
                <th class="p-3 text-sm font-semibold text-gray-300">Severity</th>
                <th class="p-3 text-sm font-semibold text-gray-300">Vulnerability</th>
                <th class="p-3 text-sm font-semibold text-gray-300">Affected Asset</th>
                <th class="p-3 text-sm font-semibold text-gray-300 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (vuln of r.vulnerabilities; track vuln.id) {
                <tr class="border-b border-white/5">
                  <td class="p-3">
                    <span class="font-bold text-sm px-2 py-1 rounded-md" [class]="getSeverityClass(vuln.severity)">
                      {{ vuln.severity }}
                    </span>
                  </td>
                  <td class="p-3">
                    <p class="font-semibold text-white">{{ vuln.name }}</p>
                    <p class="text-sm text-gray-400">{{ vuln.description }}</p>
                  </td>
                  <td class="p-3 font-mono text-sm text-gray-400">{{ vuln.affectedAsset }}</td>
                  <td class="p-3 text-right">
                     <button (click)="getAnalysis(vuln)" [disabled]="geminiService.isLoading()"
                      class="px-4 py-2 bg-cyan-600/50 text-cyan-200 text-sm rounded-md hover:bg-cyan-600 disabled:bg-gray-600 disabled:text-gray-400 whitespace-nowrap transition-colors">
                      Analyze
                    </button>
                  </td>
                </tr>
                @if (analysisMap()[vuln.id]) {
                  <tr class="bg-black/20">
                    <td colspan="4" class="p-4">
                      <div class="p-4 bg-gray-900/50 rounded-md border border-white/10 text-sm text-gray-300">
                        <h4 class="font-semibold mb-2 text-cyan-300">Gemini Analysis:</h4>
                        <pre class="whitespace-pre-wrap font-sans">{{ analysisMap()[vuln.id] }}</pre>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Attack Paths -->
        <div>
            <h3 class="text-2xl font-orbitron font-semibold mb-4 text-white">Attack Paths</h3>
            @for (path of r.attackPaths; track path.id) {
              <div class="mb-6 glass-panel p-4">
                <h4 class="font-medium text-lg mb-2 text-cyan-300">{{ path.name }}</h4>
                <app-attack-path [attackPath]="path"></app-attack-path>
              </div>
            } @empty {
              <div class="glass-panel p-8 border-dashed border-2 border-gray-600 rounded-lg text-center text-gray-500">
                <p>No attack paths found in this report.</p>
              </div>
            }
        </div>
      </div>
    } @else {
      <div class="glass-panel p-10 text-center text-gray-400 h-full flex items-center justify-center">
        <p class="text-lg">Select a scan report from the list to see the details.</p>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AttackPathComponent],
  providers: [DatePipe]
})
export class ScanReportComponent {
  scanStateService = inject(ScanStateService);
  geminiService = inject(GeminiService);
  datePipe = inject(DatePipe);
  report = this.scanStateService.selectedReport;
  analysisMap = signal<{[key: string]: string}>({});

  goBackToDashboard(): void {
    this.scanStateService.selectedReport.set(null);
  }

  async getAnalysis(vulnerability: Vulnerability) {
    const currentReport = this.report();
    if (!currentReport) return;

    // Show loading state immediately
    this.analysisMap.update(currentMap => ({
      ...currentMap,
      [vulnerability.id]: 'Analyzing...',
    }));

    const analysis = await this.geminiService.getRemediationAnalysis(vulnerability, currentReport);
    this.analysisMap.update(currentMap => ({
      ...currentMap,
      [vulnerability.id]: analysis,
    }));
  }

  exportReport(): void {
    const report = this.report();
    if (!report) return;

    let content = `# Scan Report: ${report.name}\n\n`;
    content += `**Scanned on:** ${this.datePipe.transform(report.timestamp, 'medium')}\n\n`;
    content += `## Summary\n`;
    content += `- **Critical:** ${report.summary.critical}\n`;
    content += `- **High:** ${report.summary.high}\n`;
    content += `- **Medium:** ${report.summary.medium}\n`;
    content += `- **Low:** ${report.summary.low}\n\n`;

    content += `## Vulnerabilities\n\n`;
    report.vulnerabilities.forEach(vuln => {
      content += `### [${vuln.severity}] ${vuln.name}\n`;
      content += `**Description:** ${vuln.description}\n`;
      content += `**Affected Asset:** \`${vuln.affectedAsset}\`\n`;
      content += `**Suggested Remediation:** ${vuln.remediation}\n`;
      
      const analysis = this.analysisMap()[vuln.id];
      if (analysis && analysis !== 'Analyzing...') {
        content += `\n**Gemini Analysis:**\n\`\`\`\n${analysis}\n\`\`\`\n`;
      }
      content += `\n---\n\n`;
    });

    if (report.attackPaths.length > 0) {
      content += `## Attack Paths\n\n`;
      report.attackPaths.forEach(path => {
        content += `### ${path.name}\n`;
        const pathString = path.nodes.map(n => n.label).join(' -> ');
        content += `*Path:* ${pathString}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconx-report-${report.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getSeverityClass(severity: 'Critical' | 'High' | 'Medium' | 'Low'): string {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400';
      case 'High': return 'bg-orange-500/20 text-orange-300';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'Low': return 'bg-blue-500/20 text-blue-300';
    }
  }
}