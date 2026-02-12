import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { StepNodeData } from '../../utils/workflowToGraph';

export type ParallelGroupNodeType = Node<StepNodeData, 'parallelGroup'>;

function ParallelGroupNodeComponent({ data, selected, width, height }: NodeProps<ParallelGroupNodeType>) {
  const isFirst = data?.stepIndex === 0;
  // Use width and height from props (set by React Flow based on node.width/height)
  // Fallback to defaults if not provided
  const nodeWidth = width ?? 280;
  const nodeHeight = height ?? 100;
  
  return (
    <div 
      className={`dag-parallel-group ${selected ? 'dag-step-node--selected' : ''} ${isFirst ? 'dag-step-node--first' : ''}`}
      style={{ 
        width: `${nodeWidth}px`, 
        height: `${nodeHeight}px`,
        minWidth: '200px', // Minimum: padding (10) + node width (180) + padding (10) = 200
        minHeight: '100px',
        boxSizing: 'border-box',
      }}
    >
      {!isFirst && (
        <Handle 
          type="target" 
          id="target" 
          position={Position.Left} 
          className="dag-step-handle"
          style={{ background: '#495057', border: '2px solid #fff', width: '8px', height: '8px' }}
        />
      )}
      <div className="dag-parallel-group__header">
        {isFirst && (
          <span className="dag-parallel-group__start-badge">START</span>
        )}
        <div className="dag-parallel-group__label" title="Click to edit">{data?.label ?? 'Parallel'}</div>
      </div>
      <div className="dag-parallel-group__content">
        {/* Sub-nodes will be rendered as children by React Flow */}
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

export default memo(ParallelGroupNodeComponent);

