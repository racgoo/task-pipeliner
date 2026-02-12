import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { StepNodeData } from '../../utils/workflowToGraph';

export type StepNodeType = Node<StepNodeData, 'stepNode'>;

function StepNodeComponent({ data, selected }: NodeProps<StepNodeType>) {
  const type = data?.stepType ?? 'run';
  // Only show "Start" if it's the first step AND not a parallel branch
  const isFirst = data?.stepIndex === 0 && !data?.isParallelBranch;
  return (
    <div className={`dag-step-node dag-step-node--${type} ${selected ? 'dag-step-node--selected' : ''} ${isFirst ? 'dag-step-node--first' : ''}`}>
      {!isFirst && (
        <Handle 
          type="target" 
          id="target" 
          position={Position.Left} 
          className="dag-step-handle"
          style={{ background: '#495057', border: '2px solid #fff', width: '8px', height: '8px' }}
        />
      )}
      <div className="dag-step-node__label" title="Click to edit">
        {isFirst && (
          <span className="dag-step-node__start-badge">START</span>
        )}
        {data?.label ?? 'Step'}
      </div>
      <Handle 
        type="source" 
        id="source" 
        position={Position.Right} 
        className="dag-step-handle"
        style={{ background: '#495057', border: '2px solid #fff', width: '8px', height: '8px' }}
      />
    </div>
  );
}

export default memo(StepNodeComponent);
