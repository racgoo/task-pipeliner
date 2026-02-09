import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'getting-started',
    'cli-reference',
    {
      type: 'category',
      label: 'DLS',
      items: [
        'dsl-reference/workflow-structure',
        'dsl-reference/step-types',
        'dsl-reference/captures',
        'dsl-reference/conditions',
        'dsl-reference/variables',
        'dsl-reference/profiles',
        'dsl-reference/complete-example',
      ],
    },
    'history',
    'schedule',
    'examples',
  ],
};

export default sidebars;
