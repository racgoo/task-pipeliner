/**
 * Converts workflow steps to React Flow nodes and edges for DAG view.
 */
import type { Node, Edge } from '@xyflow/react';
import type { Step } from '../types/workflow';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;
const SPACING_X = 240;
const SPACING_Y = 80;
const PARALLEL_PADDING = 10; // Reduced from 20
const PARALLEL_BRANCH_SPACING = 12; // Reduced from 20

export interface StepNodeData extends Record<string, unknown> {
  label: string;
  stepIndex: number;
  stepType: string;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function getStepLabel(step: Step, index: number): string {
  if ('run' in step) {
    return `Run: ${truncate(step.run, 30)}`;
  }
  if ('choose' in step) {
    return `Choose: ${truncate(step.choose.message, 25)}`;
  }
  if ('prompt' in step) {
    return `Prompt: ${truncate(step.prompt.message, 25)}`;
  }
  if ('parallel' in step) {
    const n = step.parallel.length;
    return `Parallel (${n} branch${n !== 1 ? 'es' : ''})`;
  }
  if ('fail' in step) {
    return `Fail: ${truncate(step.fail.message, 25)}`;
  }
  return `Step ${index + 1}`;
}

function getStepType(step: Step): string {
  if ('run' in step) return 'run';
  if ('choose' in step) return 'choose';
  if ('prompt' in step) return 'prompt';
  if ('parallel' in step) return 'parallel';
  if ('fail' in step) return 'fail';
  return 'unknown';
}

/**
 * Converts workflow steps to nodes and edges for a linear left-to-right DAG.
 * Node id = step index as string.
 * For parallel steps, creates a group node with sub-nodes for each branch.
 */
export function workflowToGraph(steps: Step[]): {
  nodes: Node<StepNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<StepNodeData>[] = [];
  const edges: Edge[] = [];
  let currentX = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isParallel = 'parallel' in step && step.parallel.length > 0;

    if (isParallel) {
      // Create parallel group node
      const parallelStep = step as Extract<Step, { parallel: Step[] }>;
      const branchCount = parallelStep.parallel.length;
      const HEADER_HEIGHT = 32;
      
      // Create sub-nodes first to calculate their positions
      // Position is relative to parent node (0,0 is top-left of parent)
      // These are display-only, not draggable
      const branchStartY = HEADER_HEIGHT + PARALLEL_PADDING;
      const childNodes: Array<{ x: number; y: number; width: number; height: number }> = [];
      
      parallelStep.parallel.forEach((branchStep, branchIndex) => {
        const childY = branchStartY + branchIndex * (NODE_HEIGHT + PARALLEL_BRANCH_SPACING);
        childNodes.push({
          x: PARALLEL_PADDING,
          y: childY,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        });
      });

      // Calculate parent size based on children positions and sizes
      // Find the maximum X and Y coordinates of children
      const maxChildX = Math.max(...childNodes.map(n => n.x + n.width), NODE_WIDTH + PARALLEL_PADDING);
      const maxChildY = branchCount > 0 
        ? Math.max(...childNodes.map(n => n.y + n.height), HEADER_HEIGHT + PARALLEL_PADDING)
        : HEADER_HEIGHT + PARALLEL_PADDING;
      
      // Calculate group dimensions with padding
      // Border is 2px, so we need extra padding at bottom to prevent clipping
      // Use actual calculated width, not forced minimum, to avoid extra right padding
      const groupWidth = maxChildX + PARALLEL_PADDING; // Use actual width, not forced minimum
      // Add extra padding: PARALLEL_PADDING for spacing + 2px for border + small buffer
      const groupHeight = maxChildY + PARALLEL_PADDING + 4; // Extra padding: PARALLEL_PADDING + 2px border + 2px buffer

      // Main parallel group node
      nodes.push({
        id: String(i),
        type: 'parallelGroup',
        position: { x: currentX, y: 50 },
        width: groupWidth,
        height: groupHeight,
        data: {
          label: getStepLabel(step, i),
          stepIndex: i,
          stepType: 'parallel',
        },
        style: {
          width: `${groupWidth}px`,
          height: `${groupHeight}px`,
          minWidth: '280px',
          minHeight: `${HEADER_HEIGHT + PARALLEL_PADDING * 2}px`,
        },
      });

      // Create sub-nodes for each parallel branch
      parallelStep.parallel.forEach((branchStep, branchIndex) => {
        const branchNodeId = `${i}-branch-${branchIndex}`;
        const childPos = childNodes[branchIndex];
        nodes.push({
          id: branchNodeId,
          type: 'stepNode',
          position: {
            x: childPos.x,
            y: childPos.y,
          },
          width: childPos.width,
          height: childPos.height,
          parentId: String(i),
          extent: 'parent',
          draggable: false,
          selectable: false,
          data: {
            label: getStepLabel(branchStep, branchIndex),
            stepIndex: i,
            stepType: getStepType(branchStep),
            isParallelBranch: true,
            branchIndex,
          },
        });
        // Note: Parallel branches run simultaneously, so no edges between them
      });

      currentX += groupWidth + SPACING_X;
    } else {
      // Regular step node
      nodes.push({
        id: String(i),
        type: 'stepNode',
        position: { x: currentX, y: 50 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          label: getStepLabel(step, i),
          stepIndex: i,
          stepType: getStepType(step),
        },
      });
      currentX += SPACING_X;
    }
  }

  // Create edges between main steps
  for (let i = 0; i < steps.length - 1; i++) {
    edges.push({
      id: `e${i}-${i + 1}`,
      source: String(i),
      target: String(i + 1),
      sourceHandle: 'source',
      targetHandle: 'target',
    });
  }

  return { nodes, edges };
}

export { NODE_WIDTH, NODE_HEIGHT, SPACING_X, SPACING_Y, PARALLEL_PADDING, PARALLEL_BRANCH_SPACING };
