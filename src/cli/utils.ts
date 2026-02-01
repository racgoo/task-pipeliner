export function setSilentMode() {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  process.stdout.write = () => true;
  process.stderr.write = () => true;
}
