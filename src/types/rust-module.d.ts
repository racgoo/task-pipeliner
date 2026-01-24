/**
 * Type definitions for Rust NAPI module
 */

// Production: .node file in dist directory
declare module '../task-pipeliner-rs.node' {
  export function runTask(command: string): Promise<boolean>;
  export function runTaskSync(command: string): boolean;
}

// Development: .node file in rust/target
declare module '../../rust/target/release/task-pipeliner-rs.node' {
  export function runTask(command: string): Promise<boolean>;
  export function runTaskSync(command: string): boolean;
}

