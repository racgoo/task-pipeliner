import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { StepNodeData } from '../../utils/workflowToGraph';

export type StepNodeType = Node<StepNodeData, 'stepNode'>;

function StepNodeComponent({ data, selected }: NodeProps<StepNodeType>) {
  const type = data?.stepType ?? 'run';
  return (
    <div className={`dag-step-node dag-step-node--${type} ${selected ? 'dag-step-node--selected' : ''}`}>
      <Handle type="target" id="target" position={Position.Left} className="dag-step-handle" />
      <div className="dag-step-node__label nodrag" title="Click to edit">{data?.label ?? 'Step'}</div>
      <Handle type="source" id="source" position={Position.Right} className="dag-step-handle" />
    </div>
  );
}

export default memo(StepNodeComponent);
