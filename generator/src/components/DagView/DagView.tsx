import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodes,
  applyNodeChanges,
  useUpdateNodeInternals,
  type Node,
  type Connection,
  type Edge,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { workflowToGraph, NODE_WIDTH, NODE_HEIGHT, PARALLEL_PADDING, PARALLEL_BRANCH_SPACING } from '../../utils/workflowToGraph';
import type { Step } from '../../types/workflow';
import type { StepNodeData } from '../../utils/workflowToGraph';
import StepNode from './StepNode';
import ParallelGroupNode from './ParallelGroupNode';
import './DagView.css';

const nodeTypes = { 
  stepNode: StepNode,
  parallelGroup: ParallelGroupNode,
};

const FALLBACK_WIDTH = 800;
const FALLBACK_HEIGHT = 400;
const HEADER_HEIGHT = 32;
const MIN_PARALLEL_WIDTH = 280;
const EDGE_STYLE = {
  strokeWidth: 2.5,
  stroke: '#64748b',
} as const;
const MARKER_END = {
  type: 'arrowclosed' as const,
  color: '#64748b',
  width: 20,
  height: 20,
} as const;

export type NodePositions = Record<string, { x: number; y: number }>;

export interface DagViewProps {
  steps: Step[];
  selectedStepIndex: number | null;
  onSelectStep: (index: number | null) => void;
  fillContainer?: boolean;
  customPositions?: NodePositions;
  onPositionsChange?: (positions: NodePositions) => void;
  centerOnFirstNode?: boolean;
}

/**
 * Creates a standardized edge configuration
 */
function createEdgeConfig(edge: { id: string; source: string; target: string }): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: 'source',
    targetHandle: 'target',
    type: 'smoothstep',
    animated: false,
    markerEnd: MARKER_END,
    style: EDGE_STYLE,
    className: 'dag-flow-edge',
  };
}

/**
 * Calculate parallel group size based on its child nodes
 * This matches the calculation logic in workflowToGraph.ts
 */
function calculateParallelGroupSize(
  parentNode: Node<StepNodeData>,
  allNodes: Node<StepNodeData>[]
): { width: number; height: number } {
  const childNodes = allNodes.filter(n => n.parentId === parentNode.id);
  
  if (childNodes.length === 0) {
    return {
      width: MIN_PARALLEL_WIDTH,
      height: HEADER_HEIGHT + PARALLEL_PADDING * 2,
    };
  }
  
  // Calculate child positions using the same logic as workflowToGraph.ts
  // This ensures consistency and correct sizing
  // HEADER_HEIGHT (32px) includes header padding (6px top + 6px bottom = 12px) + content height
  // Add PARALLEL_PADDING after header to separate first child from header border
  const branchStartY = HEADER_HEIGHT + PARALLEL_PADDING;
  const branchCount = childNodes.length;
  
  if (branchCount === 0) {
    return {
      width: MIN_PARALLEL_WIDTH,
      height: HEADER_HEIGHT + PARALLEL_PADDING * 2,
    };
  }
  
  // Calculate the position of the last child node
  const lastChildIndex = branchCount - 1;
  const lastChildY = branchStartY + lastChildIndex * (NODE_HEIGHT + PARALLEL_BRANCH_SPACING);
  const lastChildBottom = lastChildY + NODE_HEIGHT;
  
  // Calculate max X (all children have same width and x position)
  // Use actual child node width if available, otherwise use NODE_WIDTH
  const actualChildWidth = childNodes[0]?.width ?? NODE_WIDTH;
  const maxChildX = PARALLEL_PADDING + actualChildWidth;
  const maxChildY = lastChildBottom;
  
  // Calculate group dimensions with padding (matching workflowToGraph.ts)
  // Border is 2px, so we need extra padding at bottom to prevent clipping
  // Also ensure first child has proper spacing from header
  // Calculate actual needed width: left padding + child width + right padding
  // Don't force MIN_PARALLEL_WIDTH if actual width is smaller - use actual width
  const actualWidth = maxChildX + PARALLEL_PADDING;
  const width = actualWidth; // Use actual calculated width, not forced minimum
  // Add extra padding: PARALLEL_PADDING for spacing + 2px for border + small buffer
  const height = maxChildY + PARALLEL_PADDING + 4; // Extra padding: PARALLEL_PADDING + 2px border + 2px buffer
  
  return { width, height };
}

/**
 * Handles fitView and centering when nodes change
 */
function FitViewOnNodesChange({ centerOnFirstNode }: { centerOnFirstNode?: boolean }) {
  const { fitView, getNode, setCenter } = useReactFlow();
  const nodes = useNodes();
  const prevNodeCount = useRef(nodes.length);
  const hasCenteredRef = useRef(false);
  
  useEffect(() => {
    if (nodes.length !== prevNodeCount.current) {
      prevNodeCount.current = nodes.length;
      fitView({ padding: 0.2, duration: 200 });
    }
  }, [nodes.length, fitView]);

  useEffect(() => {
    if (centerOnFirstNode && !hasCenteredRef.current && nodes.length > 0) {
      const firstNode = getNode('0');
      if (firstNode?.position) {
          const nodeX = firstNode.position.x + (firstNode.width || 180) / 2;
          const nodeY = firstNode.position.y + (firstNode.height || 44) / 2;
          setCenter(nodeX, nodeY, { zoom: 1, duration: 300 });
        hasCenteredRef.current = true;
      }
    }
    if (!centerOnFirstNode) {
      hasCenteredRef.current = false;
    }
  }, [centerOnFirstNode, nodes.length, getNode, setCenter]);

  return null;
}

function DagFlowInner({
  steps,
  selectedStepIndex,
  onSelectStep,
  customPositions,
  onPositionsChange,
  centerOnFirstNode,
  width,
  height,
}: Pick<DagViewProps, 'steps' | 'selectedStepIndex' | 'onSelectStep' | 'customPositions' | 'onPositionsChange' | 'centerOnFirstNode'> & {
  width: number;
  height: number;
}) {
  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => workflowToGraph(steps),
    [steps]
  );

  const initialNodes = useMemo(
    () =>
      baseNodes.map((n) => ({
        ...n,
        position: customPositions?.[n.id] ?? n.position,
        width: n.width ?? 180,
        height: n.height ?? 44,
      })),
    [baseNodes, customPositions]
  );

  const [nodes, setNodes] = useNodesState<Node<StepNodeData>>(initialNodes);
  const prevPositionsRef = useRef<NodePositions>({});
  const updateNodeInternals = useUpdateNodeInternals();

  const initialEdges = useMemo(
    () => baseEdges.map(createEdgeConfig),
    [baseEdges]
  );

  const [edgesState, setEdgesState] = useEdgesState(initialEdges);
  const [userEdges, setUserEdges] = useState<Edge[]>([]);

  // Update edges when baseEdges change
  useEffect(() => {
    setEdgesState(baseEdges.map(createEdgeConfig));
  }, [baseEdges, setEdgesState]);

  // Update nodes and recalculate parallel group sizes
  useEffect(() => {
    setNodes((prev) => {
      // Step 1: First, collect all nodes from baseNodes (including children)
      // For parallel groups, we'll recalculate size, so ignore their size from baseNodes
      const nodesWithUpdatedChildren = baseNodes.map((n) => {
        const existing = prev.find((x) => x.id === n.id);
        const isParallelGroup = n.type === 'parallelGroup';
        const isParallelBranch = n.data?.isParallelBranch === true;
        const custom = customPositions?.[n.id];
        
        // For parallel branches (children), always use position and size from baseNodes
        if (isParallelBranch) {
          return {
            ...n,
            position: n.position,
            width: n.width,
            height: n.height,
          };
        }
        
        // Preserve properties for non-parallel nodes to avoid re-initialization
        const preservedProps = existing && !isParallelGroup ? {
          width: existing.width,
          height: existing.height,
          measured: existing.measured,
        } : {};
        
        // For parallel groups, remove ALL size-related properties from baseNodes
        // We will recalculate them based on children
        const nodeData = isParallelGroup 
          ? { 
              ...n, 
              // Remove all size-related properties
              width: undefined, 
              height: undefined, 
              measured: undefined,
              style: n.style ? { ...n.style, width: undefined, height: undefined } : undefined,
            }
          : n;
        
        // Handle custom positions
        if (custom) {
          prevPositionsRef.current[n.id] = custom;
          return { ...nodeData, position: custom, ...preservedProps };
        }
        
        // Preserve existing position for non-parallel nodes
        if (existing?.position && !isParallelGroup) {
          prevPositionsRef.current[n.id] = existing.position;
          return { ...nodeData, position: existing.position, ...preservedProps };
        }
        
        prevPositionsRef.current[n.id] = nodeData.position;
        return { ...nodeData, ...preservedProps };
      });
      
      // Step 2: Calculate parallel group sizes based on children
      // This MUST happen after children are updated
      const parallelGroupSizes = new Map<string, { width: number; height: number }>();
      nodesWithUpdatedChildren.forEach((n) => {
        if (n.type === 'parallelGroup') {
          const { width, height } = calculateParallelGroupSize(n, nodesWithUpdatedChildren);
          parallelGroupSizes.set(n.id, { width, height });
        }
      });
      
      // Step 3: Apply calculated sizes to parallel groups
      const finalNodes = nodesWithUpdatedChildren.map((n) => {
        if (n.type === 'parallelGroup') {
          const size = parallelGroupSizes.get(n.id);
          if (size) {
            // Create a COMPLETELY NEW node object with calculated size
            // Remove measured to force React Flow to remeasure
            return {
              ...n,
              width: size.width,
              height: size.height,
              measured: undefined, // Force remeasure
              style: {
                width: `${size.width}px`,
                height: `${size.height}px`,
                minWidth: `${PARALLEL_PADDING * 2 + NODE_WIDTH}px`, // Minimum: padding + node width + padding
                minHeight: `${HEADER_HEIGHT + PARALLEL_PADDING * 2}px`,
              },
            };
          }
        }
        return n;
      });
      
      return finalNodes;
    });
  }, [baseNodes, customPositions, setNodes]);
  
  // Force React Flow to update node internals after nodes are updated
  // Only update when node count or sizes change, not on every drag
  const prevNodeCountRef = useRef(nodes.length);
  const prevNodeSizesRef = useRef<Map<string, { width: number | undefined; height: number | undefined }>>(new Map());
  
  useEffect(() => {
    const parallelGroupNodes = nodes.filter(n => n.type === 'parallelGroup');
    
    // Only update if node count changed or node sizes changed
    const nodeCountChanged = parallelGroupNodes.length !== prevNodeCountRef.current;
    let sizesChanged = false;
    
    if (!nodeCountChanged) {
      for (const node of parallelGroupNodes) {
        const prevSize = prevNodeSizesRef.current.get(node.id);
        if (!prevSize || prevSize.width !== node.width || prevSize.height !== node.height) {
          sizesChanged = true;
          break;
        }
      }
    }
    
    if (nodeCountChanged || sizesChanged) {
      prevNodeCountRef.current = parallelGroupNodes.length;
      prevNodeSizesRef.current.clear();
      parallelGroupNodes.forEach(node => {
        prevNodeSizesRef.current.set(node.id, { width: node.width, height: node.height });
      });
      
      // Use requestAnimationFrame to ensure this runs after React Flow processes the update
      requestAnimationFrame(() => {
        parallelGroupNodes.forEach(node => {
          updateNodeInternals(node.id);
        });
      });
    }
  }, [nodes, updateNodeInternals]);

  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges>[0]) => {
      setNodes((prev) => {
        // Preserve ALL node properties before applying changes to prevent initialization errors
        const nodePropertiesMap = new Map<string, Node<StepNodeData>>();
        prev.forEach(node => {
          nodePropertiesMap.set(node.id, node);
        });
        
        // Completely ignore ALL changes for child nodes - they are not draggable
        const filteredChanges: Parameters<typeof applyNodeChanges>[0] = [];
        
        for (const change of changes) {
          // Skip ALL changes for child nodes - they should never be dragged
          if ('id' in change) {
            const nodeId = change.id as string;
            const node = prev.find(n => n.id === nodeId);
            
            // If this is a child node, completely ignore the change
            if (node?.parentId) {
              continue; // Skip this change entirely - child nodes are not draggable
            }
            
            // Allow changes for non-child nodes
            filteredChanges.push(change);
          } else {
            // Allow non-node changes (like select, etc)
            filteredChanges.push(change);
          }
        }
        
        const next = applyNodeChanges(filteredChanges, prev) as Node<StepNodeData>[];
        
        // Ensure all nodes have ALL required properties to prevent "not initialized" errors
        // Merge changes with preserved properties
        const finalNodes = next.map(node => {
          const preservedNode = nodePropertiesMap.get(node.id);
          
          // If node doesn't exist in preserved map, use current node
          if (!preservedNode) {
            return node;
          }
          
          // Merge: use new position/selected/etc from changes, but preserve width/height/measured
          const mergedNode: Node<StepNodeData> = {
            ...preservedNode, // Start with all preserved properties
            ...node, // Override with changes (position, selected, etc)
            // But ensure width, height, and measured are always preserved
            width: preservedNode.width ?? node.width ?? 180,
            height: preservedNode.height ?? node.height ?? 44,
            measured: preservedNode.measured ?? node.measured,
          };
          
          // Handle child nodes - reset position to original relative position
          if (mergedNode.parentId) {
            const parentNode = next.find(n => n.id === mergedNode.parentId);
            if (parentNode) {
              const baseNode = baseNodes.find(n => n.id === mergedNode.id);
              if (baseNode) {
                mergedNode.position = {
                  x: baseNode.position.x,
                  y: baseNode.position.y,
                };
              }
            }
          }
          
          return mergedNode;
        });
        
        if (onPositionsChange) {
          const positions: NodePositions = {};
          let hasChanges = false;
          
          // Only track positions of non-child nodes
          for (const node of finalNodes) {
            if (!node.parentId) {
            positions[node.id] = node.position;
              const prevPos = prevPositionsRef.current[node.id];
              if (!prevPos || prevPos.x !== node.position.x || prevPos.y !== node.position.y) {
                hasChanges = true;
              }
            }
          }
          
          if (hasChanges) {
            prevPositionsRef.current = positions;
          onPositionsChange(positions);
          }
        }
        
        return finalNodes;
      });
    },
    [setNodes, onPositionsChange, baseNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as StepNodeData;
      const idx = data?.stepIndex;
      if (typeof idx === 'number') {
        onSelectStep(idx);
      }
    },
    [onSelectStep]
  );

  const onPaneClick = useCallback(() => onSelectStep(null), [onSelectStep]);
  
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.target === '0') {
        return; // Prevent connecting to the first node
      }
      
      const newEdge: Edge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        sourceHandle: connection.sourceHandle || 'source',
        targetHandle: connection.targetHandle || 'target',
        markerEnd: MARKER_END,
        style: EDGE_STYLE,
        type: 'smoothstep',
        className: 'dag-flow-edge',
      };
      setUserEdges((prev) => [...prev, newEdge]);
    },
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges>[0]) => {
        const baseEdgeIds = new Set(baseEdges.map(e => e.id));
      
      // Filter out attempts to remove base edges
      const filteredChanges = changes.filter(change => {
        if (change.type === 'remove' && 'id' in change && change.id) {
          return !baseEdgeIds.has(change.id);
        }
        return true;
      });
      
      setEdgesState((prev) => applyEdgeChanges(filteredChanges, prev) as typeof prev);
      
      // Handle user-created edges
        const removeIds = new Set(
          changes
          .filter(change => change.type === 'remove' && 'id' in change && change.id)
          .map(change => ('id' in change ? change.id : '') as string)
          .filter(Boolean)
        );
        
      setUserEdges((prev) => prev.filter(e => !removeIds.has(e.id)));
    },
    [baseEdges, setEdgesState]
  );
  
  const allEdges = useMemo(() => {
    const baseEdgeIds = new Set(baseEdges.map(e => e.id));
    const filteredUserEdges = userEdges.filter(e => !baseEdgeIds.has(e.id));
    return [...edgesState, ...filteredUserEdges];
  }, [edgesState, userEdges, baseEdges]);

  const selectedNodeIds = useMemo(
    () => (selectedStepIndex == null ? [] : [String(selectedStepIndex)]),
    [selectedStepIndex]
  );

  const nodesWithSelection = useMemo(
    () =>
      nodes.map((n) => {
        const isParallelBranch = n.data?.isParallelBranch === true;
        const hasParent = !!n.parentId;
        return {
        ...n,
        selected: selectedNodeIds.includes(n.id),
          // Completely disable dragging for child nodes
          draggable: (isParallelBranch || hasParent) ? false : (n.draggable ?? true),
          selectable: isParallelBranch ? false : n.selectable,
        };
      }),
    [nodes, selectedNodeIds]
  );

  // Handle node drag start - completely block child node drags
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // If this is a child node, completely block the drag
      if (node.parentId) {
        // Child nodes are not draggable - prevent all interaction
        event.stopPropagation();
        event.preventDefault();
        return;
      }
    },
    []
  );

  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // If dragging a child node, it should have been blocked
      if (node.parentId) {
        return;
      }
    },
    []
  );

  const onNodeDragStop = useCallback(() => {
    // No state to reset
  }, []);

  return (
      <ReactFlow
        nodes={nodesWithSelection}
        edges={allEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        width={width}
        height={height}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable
        panOnDrag={true} // Allow panning with left mouse button and trackpad - child nodes are not draggable so they won't trigger panning
        deleteKeyCode={null} // Disable delete key (Backspace/Delete) to prevent accidental step deletion
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ 
          className: 'dag-flow-edge', 
        style: EDGE_STYLE,
          type: 'smoothstep',
          animated: false,
        markerEnd: MARKER_END,
        }}
        connectionLineStyle={{ strokeWidth: 2.5, stroke: '#0d6efd', strokeDasharray: '5, 5' }}
        style={{ width: '100%', height: '100%', minHeight: 400 }}
      >
        <Background />
        <Controls />
        <MiniMap 
        style={{ width: 120, height: 80 }}
          nodeColor={(node) => {
            const data = node.data as StepNodeData;
          return data?.stepIndex === 0 ? '#0d6efd' : '#94a3b8';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <FitViewOnNodesChange centerOnFirstNode={centerOnFirstNode} />
      </ReactFlow>
  );
}

export default function DagView({
  steps,
  selectedStepIndex,
  onSelectStep,
  fillContainer = false,
  customPositions,
  onPositionsChange,
  centerOnFirstNode = false,
}: DagViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    
    const updateSize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    };
    
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    });
    
    ro.observe(el);
    updateSize();
    
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={`dag-view ${fillContainer ? 'dag-view--fill' : ''}`}
      style={{ width: '100%', minHeight: 400, height: fillContainer ? '100%' : 400 }}
    >
      <div
        ref={wrapRef}
        className="dag-view__canvas-wrap"
        style={{ width: '100%', height: fillContainer ? '100%' : 400, minHeight: 400 }}
      >
        <ReactFlowProvider>
          <DagFlowInner
            key={`dag-flow-${steps.length}`}
            steps={steps}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={onSelectStep}
            customPositions={customPositions}
            onPositionsChange={onPositionsChange}
            centerOnFirstNode={centerOnFirstNode}
            width={size.width}
            height={size.height}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
