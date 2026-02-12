/**
 * Converts workflow steps to React Flow nodes and edges for DAG view.
 */
import type { Node, Edge } from '@xyflow/react';
import type { Step } from '../types/workflow';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;
const SPACING_X = 240;
const SPACING_Y = 80;

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
 */
export function workflowToGraph(steps: Step[]): {
  nodes: Node<StepNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<StepNodeData>[] = steps.map((step, i) => ({
    id: String(i),
    type: 'stepNode',
    position: { x: i * SPACING_X, y: 50 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    data: {
      label: getStepLabel(step, i),
      stepIndex: i,
      stepType: getStepType(step),
    },
  }));

  const edges: Edge[] = [];
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

export { NODE_WIDTH, NODE_HEIGHT, SPACING_X, SPACING_Y };
