import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { workflowToGraph } from '../../utils/workflowToGraph';
import type { Step } from '../../types/workflow';
import type { StepNodeData } from '../../utils/workflowToGraph';
import StepNode from './StepNode';
import './DagView.css';

const nodeTypes = { stepNode: StepNode };

export type NodePositions = Record<string, { x: number; y: number }>;

export interface DagViewProps {
  steps: Step[];
  selectedStepIndex: number | null;
  onSelectStep: (index: number | null) => void;
  fillContainer?: boolean;
  customPositions?: NodePositions;
  onPositionsChange?: (positions: NodePositions) => void;
}

/** Calls fitView when node count changes */
function FitViewOnNodesChange() {
  const { fitView } = useReactFlow();
  const nodes = useNodes();
  const prevLen = useRef(nodes.length);
  useEffect(() => {
    if (nodes.length !== prevLen.current) {
      prevLen.current = nodes.length;
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 200 }));
    }
  }, [nodes.length, fitView]);
  return null;
}

/**
 * Inner flow: uses useNodesState/useEdgesState so React Flow has internal state.
 * Parent gives key={steps.length} so we remount when step count changes and get correct initial nodes.
 */
function DagFlowInner({
  steps,
  selectedStepIndex,
  onSelectStep,
  customPositions,
  onPositionsChange,
}: Pick<DagViewProps, 'steps' | 'selectedStepIndex' | 'onSelectStep' | 'customPositions' | 'onPositionsChange'>) {
  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => workflowToGraph(steps),
    [steps]
  );

  const initialNodes = useMemo(
    () =>
      baseNodes.map((n) => ({
        ...n,
        position: customPositions?.[n.id] ?? n.position,
      })),
    [baseNodes, customPositions]
  );

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node<StepNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(baseEdges);

  useEffect(() => {
    setNodes((prev) =>
      baseNodes.map((n) => {
        const custom = customPositions?.[n.id];
        if (custom) return { ...n, position: custom };
        const existing = prev.find((x) => x.id === n.id);
        if (existing?.position) return { ...n, position: existing.position };
        return n;
      })
    );
    setEdges(baseEdges);
  }, [baseNodes, baseEdges, customPositions, setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChangeBase>[0]) => {
      setNodes((prev) => {
        const next = applyNodeChanges(changes, prev);
        if (onPositionsChange) {
          const positions: NodePositions = {};
          next.forEach((node) => {
            positions[node.id] = node.position;
          });
          onPositionsChange(positions);
        }
        return next;
      });
    },
    [setNodes, onPositionsChange]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as StepNodeData;
      const idx = data?.stepIndex;
      if (typeof idx === 'number') onSelectStep(idx);
    },
    [onSelectStep]
  );

  const onPaneClick = useCallback(() => onSelectStep(null), [onSelectStep]);

  const selectedNodeIds = useMemo(
    () => (selectedStepIndex == null ? [] : [String(selectedStepIndex)]),
    [selectedStepIndex]
  );

  const nodesWithSelection = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: selectedNodeIds.includes(n.id),
      })),
    [nodes, selectedNodeIds]
  );

  return (
    <>
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChangeBase}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ className: 'dag-flow-edge', style: { strokeWidth: 1.5 } }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background />
        <Controls />
        <MiniMap />
        <FitViewOnNodesChange />
      </ReactFlow>
    </>
  );
}

export default function DagView({
  steps,
  selectedStepIndex,
  onSelectStep,
  fillContainer = false,
  customPositions,
  onPositionsChange,
}: DagViewProps) {
  return (
    <div
      className={`dag-view ${fillContainer ? 'dag-view--fill' : ''}`}
      style={{ width: '100%', minHeight: fillContainer ? 400 : 400, height: fillContainer ? '100%' : 400 }}
    >
      <ReactFlowProvider>
        <DagFlowInner
          key={`dag-flow-${steps.length}`}
          steps={steps}
          selectedStepIndex={selectedStepIndex}
          onSelectStep={onSelectStep}
          customPositions={customPositions}
          onPositionsChange={onPositionsChange}
        />
      </ReactFlowProvider>
    </div>
  );
}
