import { rm } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const WORKFLOW_HISTORY_DIR = join(homedir(), '.pipeliner', 'workflow-history');

function cleanRecord() {
  rm(WORKFLOW_HISTORY_DIR, { recursive: true, force: true });
}

cleanRecord();
