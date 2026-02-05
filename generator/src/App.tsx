import { useState } from 'react';
import WorkflowBuilder from './components/WorkflowBuilder';
import ScheduleBuilder from './components/ScheduleBuilder';
import './App.css';
import './components/WorkflowBuilder.css';

type Tab = 'workflow' | 'schedule';

function App() {
  const [tab, setTab] = useState<Tab>('workflow');

  return (
    <div className="app-shell">
      <header className="app-tabs-wrap">
        <div className="app-tabs">
          <span className="app-brand">Task Pipeliner</span>
          <nav className="app-tabs-nav" aria-label="Generator type">
            <button
              type="button"
              className={`app-tab ${tab === 'workflow' ? 'active' : ''}`}
              onClick={() => setTab('workflow')}
              aria-current={tab === 'workflow' ? 'page' : undefined}
            >
              Workflow
            </button>
            <button
              type="button"
              className={`app-tab ${tab === 'schedule' ? 'active' : ''}`}
              onClick={() => setTab('schedule')}
              aria-current={tab === 'schedule' ? 'page' : undefined}
            >
              Schedule
            </button>
          </nav>
        </div>
      </header>
      <main className="app-content">
        {tab === 'workflow' ? <WorkflowBuilder /> : <ScheduleBuilder />}
      </main>
    </div>
  );
}

export default App;
