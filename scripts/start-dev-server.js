// Persistent dev-server launcher (survives shell teardown).
import { spawn } from 'node:child_process'

const server = spawn(
  'cmd',
  ['/c', 'cd /d f:\\school-erp-development && npm run dev -- -p 3000'],
  { detached: true, stdio: ['ignore', 'ignore', 'ignore'] }
)
server.unref()

setTimeout(() => {
  console.log('launcher: next dev started (pid ' + process.pid + ')')
  process.exit(0)
}, 6000)
