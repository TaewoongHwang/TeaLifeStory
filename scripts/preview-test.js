import { spawn } from 'node:child_process'
import { testBase } from './test-base.js'
const vite = 'node_modules/vite/bin/vite.js'
const env = { ...process.env, VITE_BASE_PATH: testBase }
const build = spawn(process.execPath, [vite, 'build'], { stdio: 'inherit', env })
build.on('exit', (code) => {
  if (code !== 0) process.exit(code || 1)
  const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'inherit', env })
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.kill(); process.exit(0) })
  server.on('exit', (exitCode) => process.exit(exitCode || 0))
})
