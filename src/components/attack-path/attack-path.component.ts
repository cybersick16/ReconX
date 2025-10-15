// Fix: Implement AttackPathComponent for data visualization
import { Component, ChangeDetectionStrategy, input, effect, ElementRef, viewChild } from '@angular/core';
import { AttackPath } from '../../models/scan.model';
import * as d3 from 'd3';

@Component({
  selector: 'app-attack-path',
  standalone: true,
  template: `<div #container class="w-full h-full" ></div>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 400px;
      background-color: rgba(0,0,0,0.2);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttackPathComponent {
  attackPath = input.required<AttackPath>();
  container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  constructor() {
    effect(() => {
      this.renderChart();
    });
  }

  private renderChart() {
    const attackPath = this.attackPath();
    const element = this.container().nativeElement;
    if (!attackPath || !attackPath.nodes || attackPath.nodes.length === 0 || !element) return;
    
    d3.select(element).select('svg').remove(); // Clear previous render

    const width = element.clientWidth;
    const height = element.clientHeight;
    
    const links = attackPath.edges.map(d => ({ source: d.from, target: d.to }));
    const nodes = attackPath.nodes.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select(element).append("svg")
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const link = svg.append("g")
        .attr("stroke", "rgba(255,255,255,0.2)")
        .attr("stroke-opacity", 0.8)
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke-width", 2);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(this.drag(simulation) as any);
      
    node.append("circle")
      .attr("r", 20)
      .attr("fill", d => this.getNodeColor(d.type))
      .attr("stroke", "#0B0C10")
      .attr("stroke-width", 3)
      .attr("class", "attack-path-node")
      .style("--glow-color", d => this.getNodeColor(d.type));

    node.append("text")
      .text(d => d.label)
      .attr('y', 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("class", "attack-path-label");


    simulation.on("tick", () => {
      link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });
  }

  private getNodeColor(type: string): string {
    switch (type) {
      case 'entry': return '#FF5555';
      case 'vulnerability': return '#FFAA00';
      case 'asset': return '#3b82f6';
      case 'target': return '#10b981';
      default: return '#6b7280';
    }
  }

  private drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
    const dragstarted = (event: any, d: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    const dragged = (event: any, d: any) => {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    const dragended = (event: any, d: any) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }
}