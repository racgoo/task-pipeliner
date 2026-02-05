import { useState } from 'react';
import WorkflowBuilder from './components/WorkflowBuilder';
import ScheduleBuilder from './components/ScheduleBuilder';
import './App.css';
import './components/WorkflowBuilder.css';

type Tab = 'workflow' | 'schedule';

function App() {
  const [tab, setTab] = useState<Tab>('workflow');

  return (
    <>
      <div className="app-tabs">
        <button
          type="button"
          className={`app-tab ${tab === 'workflow' ? 'active' : ''}`}
          onClick={() => setTab('workflow')}
        >
          Workflow
        </button>
        <button
          type="button"
          className={`app-tab ${tab === 'schedule' ? 'active' : ''}`}
          onClick={() => setTab('schedule')}
        >
          Schedule
        </button>
      </div>
      {tab === 'workflow' ? <WorkflowBuilder /> : <ScheduleBuilder />}
    </>
  );
}

export default App;
