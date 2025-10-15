// Fix: Implement a service to provide mock scan data
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { ScanReport, Vulnerability } from '../models/scan.model';

@Injectable({
  providedIn: 'root'
})
export class ScanDataService {
  private scanTimeouts = new Map<string, number[]>();

  private mockData: ScanReport[] = [
    {
      id: 'scan-001',
      name: 'Production Kubernetes Cluster Scan',
      targetUrl: 'prod.example.com',
      status: 'Completed',
      timestamp: '2023-10-27T10:00:00Z',
      summary: { critical: 2, high: 1, medium: 3, low: 5 },
      vulnerabilities: [
        { id: 'vuln-001', severity: 'Critical', name: 'Remote Code Execution in API Gateway', description: 'A deserialization vulnerability in the public-facing API gateway allows unauthenticated attackers to execute arbitrary code.', affectedAsset: 'api-gateway-pod-xyz', remediation: 'Update library to version 2.5.1 or newer.' },
        { id: 'vuln-002', severity: 'Critical', name: 'Exposed Kubernetes ETCD Database', description: 'The ETCD database is publicly accessible without authentication, exposing cluster secrets.', affectedAsset: 'k8s-master-node-1', remediation: 'Apply network policies to restrict access to the ETCD port (2379) to only within the cluster control plane.' },
        { id: 'vuln-003', severity: 'High', name: 'Privileged Container in logging namespace', description: 'A container is running with host-level privileges, breaking isolation and allowing potential host compromise.', affectedAsset: 'legacy-monitoring-agent-abc', remediation: 'Remove privileged flag and grant specific capabilities using security contexts.' },
      ],
      attackPaths: [
        {
          id: 'ap-1',
          name: 'Internet to Crown Jewels DB',
          nodes: [
            { id: 'internet', label: 'Internet', type: 'entry' },
            { id: 'api-gateway', label: 'API Gateway', type: 'asset' },
            { id: 'vuln-001-node', label: 'RCE Vulnerability', type: 'vulnerability' },
            { id: 'internal-network', label: 'Internal Network', type: 'asset' },
            { id: 'customer-db', label: 'Customer DB', type: 'target' },
          ],
          edges: [
            { from: 'internet', to: 'api-gateway' },
            { from: 'api-gateway', to: 'vuln-001-node' },
            { from: 'vuln-001-node', to: 'internal-network' },
            { from: 'internal-network', to: 'customer-db' },
          ]
        }
      ]
    },
    {
      id: 'scan-002',
      name: 'Staging Environment Web App Scan',
      targetUrl: 'staging.example.com',
      status: 'Completed',
      timestamp: '2023-10-26T15:30:00Z',
      summary: { critical: 0, high: 2, medium: 8, low: 12 },
      vulnerabilities: [
        { id: 'vuln-004', severity: 'High', name: 'Cross-Site Scripting (XSS) in search bar', description: 'The search input field is not properly sanitized, allowing for stored XSS attacks.', affectedAsset: 'webapp-instance-1', remediation: 'Implement input validation and output encoding on all user-supplied data.' },
        { id: 'vuln-005', severity: 'High', name: 'SQL Injection in user profile page', description: 'User profile endpoint is vulnerable to SQL injection via the user ID parameter.', affectedAsset: 'user-database-main', remediation: 'Use parameterized queries or prepared statements to access the database.' },
      ],
      attackPaths: []
    }
  ];

  private reports$ = new BehaviorSubject<ScanReport[]>(this.mockData);

  getScanReports(): Observable<ScanReport[]> {
    return this.reports$.asObservable();
  }

  startScan(targetUrl: string, profile: 'quick' | 'full'): void {
    const currentReports = this.reports$.getValue();
    const newScanId = `scan-${String(currentReports.length + 1).padStart(3, '0')}`;
    
    const newScan: ScanReport = {
      id: newScanId,
      name: `Scan for ${targetUrl}`,
      targetUrl: targetUrl,
      timestamp: new Date().toISOString(),
      status: 'Queued',
      summary: { critical: 0, high: 0, medium: 0, low: 0 },
      vulnerabilities: [],
      attackPaths: [],
    };
    
    this.reports$.next([newScan, ...currentReports]);
    
    const timeouts: number[] = [];
    
    const t1 = setTimeout(() => {
      const reports = this.reports$.getValue();
      const scanIndex = reports.findIndex(r => r.id === newScanId);
      if (scanIndex > -1) {
        const updatedScan = { ...reports[scanIndex], status: 'Scanning' as const };
        const newReports = [...reports];
        newReports[scanIndex] = updatedScan;
        this.reports$.next(newReports);
      }
    }, 2000); // Queued for 2s
    
    timeouts.push(t1);

    const scanDuration = profile === 'quick' ? 8000 : 15000;

    const t2 = setTimeout(() => {
      const reports = this.reports$.getValue();
      const scanIndex = reports.findIndex(r => r.id === newScanId);
      if (scanIndex > -1) {
        const mockVulns: Vulnerability[] = [
          { id: `vuln-${newScanId}-001`, severity: 'High', name: 'Outdated Web Server Version', description: 'Server is running an outdated version with known vulnerabilities.', affectedAsset: targetUrl, remediation: 'Upgrade web server to the latest stable version.' },
          { id: `vuln-${newScanId}-002`, severity: 'Medium', name: 'Missing Security Headers', description: 'Important security headers like CSP are not configured.', affectedAsset: targetUrl, remediation: 'Configure appropriate security headers in the web server configuration.' },
        ];
        if (profile === 'full') {
            mockVulns.push({ id: `vuln-${newScanId}-003`, severity: 'Low', name: 'Verbose Server Banners', description: 'Server banners reveal too much information about the technology stack.', affectedAsset: targetUrl, remediation: 'Configure the server to minimize information disclosed in banners.' });
        }
        
        const summary = mockVulns.reduce((acc, v) => {
            if (v.severity === 'High') acc.high++;
            if (v.severity === 'Medium') acc.medium++;
            if (v.severity === 'Low') acc.low++;
            return acc;
        }, {critical: 0, high: 0, medium: 0, low: 0});

        const updatedScan = {
          ...reports[scanIndex],
          status: 'Completed' as const,
          summary: summary,
          vulnerabilities: mockVulns,
        };
        const newReports = [...reports];
        newReports[scanIndex] = updatedScan;
        this.reports$.next(newReports);
      }
      this.scanTimeouts.delete(newScanId);
    }, 2000 + scanDuration);
    
    timeouts.push(t2);
    this.scanTimeouts.set(newScanId, timeouts);
  }

  cancelScan(scanId: string): void {
    const timeouts = this.scanTimeouts.get(scanId);
    if (timeouts) {
      timeouts.forEach(clearTimeout);
      this.scanTimeouts.delete(scanId);
    }
    
    const currentReports = this.reports$.getValue();
    this.reports$.next(currentReports.filter(r => r.id !== scanId));
  }
}