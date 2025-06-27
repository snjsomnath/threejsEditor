import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DesignExplorationGraph, DesignNode } from '../types/designExploration';
import { designExplorationService } from '../services/DesignExplorationService';

interface MiniGraphWindowProps {
  onOpenFullGraph: () => void;
}

// Add CSS to disable all animations on this component
const miniGraphStyles = `
  .mini-graph-no-animation,
  .mini-graph-no-animation * {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
  .mini-graph-no-animation:hover {
    transform: none !important;
  }
`;

export const MiniGraphWindow: React.FC<MiniGraphWindowProps> = ({ onOpenFullGraph }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graph, setGraph] = useState<DesignExplorationGraph>(designExplorationService.getGraph());
  const [isHovered, setIsHovered] = useState(false);

  // Inject CSS to disable animations on mount
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = miniGraphStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    const handleGraphUpdate = (updatedGraph: DesignExplorationGraph) => {
      setGraph(updatedGraph);
    };

    designExplorationService.addListener(handleGraphUpdate);
    
    return () => {
      designExplorationService.removeListener(handleGraphUpdate);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 120;
    const height = 60;
    const nodeRadius = 3;

    // Transform edges to D3 link format
    const linkData = graph.edges.map(edge => ({
      source: edge.from,
      target: edge.to
    }));

    // Create a simple force simulation for layout
    const simulation = d3.forceSimulation(graph.nodes as any)
      .force("link", d3.forceLink(linkData).id((d: any) => d.id).distance(20))
      .force("charge", d3.forceManyBody().strength(-30))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(nodeRadius + 2));

    // Draw edges
    const linkElements = svg.append("g")
      .selectAll("line")
      .data(linkData)
      .enter().append("line")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1)
      .attr("opacity", 0.6);

    // Draw nodes
    const nodeElements = svg.append("g")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d: DesignNode) => 
        d.id === graph.currentNodeId ? "#10b981" : "#3b82f6"
      )
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      linkElements
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeElements
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

    // Stop simulation after a short time to save CPU
    setTimeout(() => simulation.stop(), 1000);

  }, [graph]);

  return (
    <div 
      className="fixed bottom-4 left-4 z-30 mini-graph-no-animation"
      style={{ 
        transform: 'translateZ(0)', // Force hardware acceleration to prevent reflows
        willChange: 'auto' // Remove will-change to prevent unnecessary compositing
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpenFullGraph}
    >
      <div 
        className={`bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl p-2 cursor-pointer ${
          isHovered ? 'bg-gray-800/90' : ''
        }`}
        style={{ 
          width: '200px', // Fixed width (120px SVG + 24px padding)
          height: '200px', // Reduced height to fit content better
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="text-xs text-gray-300 mb-1 text-center">Design Graph</div>
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: '60px' }}>
          {graph.nodes.length <= 1 ? (
            <div className="text-xs text-gray-500 text-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1"></div>
              <div>Save configs to</div>
              <div>build graph</div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="120"
              height="60"
              className="block"
            />
          )}
        </div>
        <div className="text-xs text-gray-400 text-center" style={{ marginTop: '4px' }}>
          {graph.nodes.length} design{graph.nodes.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};
