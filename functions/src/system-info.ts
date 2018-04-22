import { spawn } from 'child-process-promise'

export function listAvailableFonts() {
  return spawn('convert', ['-list', 'font'],
      { capture: [ 'stdout', 'stderr' ]})
  .then(result => {
    console.log(result);
    return result.stdout;
  })
}

