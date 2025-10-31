"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getAllLinkRelations } from "@/lib/db";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { LinkRelation } from "@/types";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  path: string;
  group: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

export default function GraphPage() {
  const router = useRouter();
  const { files } = useAppStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [isClient, setIsClient] = useState(false);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !svgRef.current || files.length === 0) return;

    const loadGraphData = async () => {
      const links = await getAllLinkRelations();
      renderGraph(files, links);
    };

    loadGraphData();

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [files, isClient]);

  const renderGraph = (files: any[], links: LinkRelation[]) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Build nodes from files
    const nodes: GraphNode[] = files.map((file, index) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      group: Math.floor(index / 5), // Group by index for coloring
    }));

    // Build links from relations
    const graphLinks: GraphLink[] = links.map((link) => ({
      source: link.sourceFileId,
      target: link.targetFileId,
      value: 1,
    }));

    // Create force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(graphLinks)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    // Create arrow markers for links
    svg
      .append("defs")
      .selectAll("marker")
      .data(["end"])
      .enter()
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Create links
    const link = g
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphLinks)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    // Create nodes
    const node = g
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d) => d3.schemeCategory10[d.group % 10])
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        router.push(`/editor/${d.id}`);
      })
      .call(
        d3
          .drag<any, GraphNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      );

    // Add labels
    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.name.replace(".md", ""))
      .attr("font-size", 10)
      .attr("dx", 12)
      .attr("dy", 4)
      .style("pointer-events", "none");

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Store zoom functions
    (svg.node() as any).__zoom = zoom;
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = (svg.node() as any).__zoom;
    if (zoom) {
      svg.transition().call(zoom.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = (svg.node() as any).__zoom;
    if (zoom) {
      svg.transition().call(zoom.scaleBy, 0.7);
    }
  };

  const handleFit = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = (svg.node() as any).__zoom;
    if (zoom) {
      svg
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <svg
          className="h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6v2a1 1 0 01-2 0V5zM20 5a1 1 0 00-1-1h-4a1 1 0 100 2h2v2a1 1 0 102 0V5zM4 19a1 1 0 001 1h4a1 1 0 100-2H6v-2a1 1 0 10-2 0v3zM20 19a1 1 0 01-1 1h-4a1 1 0 110-2h2v-2a1 1 0 112 0v3z"
          />
        </svg>
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Files to Visualize</h2>
          <p className="text-sm text-gray-600">
            Create markdown files and link them to see the relationship graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-white shadow-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-white shadow-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleFit}
          className="bg-white shadow-md"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="absolute top-4 left-4 z-10 bg-white shadow-md rounded-lg p-3">
        <p className="text-sm font-medium">{files.length} files</p>
        <p className="text-xs text-gray-600">Click nodes to edit</p>
      </div>

      {/* D3 Graph SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "#f9fafb" }}
      />
    </div>
  );
}
