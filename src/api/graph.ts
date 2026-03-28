// src/api/graph.ts
import { apiFetch } from './client';

export interface GraphNode {
  id: string;
  title: string;
  collection: string;
  date: string;
  creators: Array<{ firstName: string; lastName: string }>;
  citation_count: number;
  in_library: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'semantic' | 'citation' | 'coauthor';
  weight: number;
  target_in_library: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function fetchGraphData(
  collection?: string,
  threshold = 0.75
): Promise<GraphData> {
  const params = new URLSearchParams({ threshold: String(threshold) });
  if (collection) params.set('collection', collection);
  return apiFetch<GraphData>(`/graph/nodes?${params}`);
}
