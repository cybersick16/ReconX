// Fix: Define data models for the application
export interface ScanReport {
  id: string;
  name:string;
  timestamp: string;
  status: 'Completed' | 'Scanning' | 'Queued';
  targetUrl?: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  vulnerabilities: Vulnerability[];
  attackPaths: AttackPath[];
}

export interface Vulnerability {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  name: string;
  description: string;
  affectedAsset: string;
  remediation: string;
}

export interface AttackPath {
  id: string;
  name: string;
  nodes: AttackPathNode[];
  edges: AttackPathEdge[];
}

export interface AttackPathNode {
  id: string;
  label: string;
  type: 'entry' | 'asset' | 'vulnerability' | 'target';
}

export interface AttackPathEdge {
  from: string;
  to: string;
}
