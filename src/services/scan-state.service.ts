
import { Injectable, signal } from '@angular/core';
// Fix: Import ScanReport from the newly created models file.
import { ScanReport } from '../models/scan.model';

@Injectable({
  providedIn: 'root'
})
export class ScanStateService {
  selectedReport = signal<ScanReport | null>(null);

  constructor() { }
}
