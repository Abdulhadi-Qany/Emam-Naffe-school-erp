// scripts/audit-be-fe.ts
// Cross-reference frontend API calls vs backend v1/v2 routes + envelope compat.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

function walk(dir: string, ext: string[], acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    let s
    try { s = statSync(p) } catch { continue }
    if (s.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(name)) continue
      walk(p, ext, acc)
    } else if (ext.some((e) => name.endsWith(e))) acc.push(p)
  }
  return acc
}

function normDynamic(p: string): string {
  // /exams/[id]/marks -> /exams/:id/marks ; also ${...} template -> :p
  return p.replace(/\/\[[^\]]+\]/g, '/:id')
}

// ---- Backend routes ----
function backendRoutes(v2Only: boolean): Set<string> {
  const apiRoot = v2Only ? join(ROOT, 'app/api/v2') : join(ROOT, 'app/api')
  const set = new Set<string>()
  for (const f of walk(apiRoot, ['.ts'])) {
    if (!f.endsWith('route.ts')) continue
    let r = f.replace(join(ROOT, 'app'), '').replace(/\\/g, '/').replace(/\/route\.ts$/, '')
    if (!v2Only && r.startsWith('/api/v2')) continue // exclude v2 from v1 set
    set.add(normDynamic(r))
  }
  return set
}
const v1 = backendRoutes(false)
const v2 = backendRoutes(true)

// ---- Frontend calls ----
const feFiles = [join(ROOT, 'app'), join(ROOT, 'components')].flatMap((d) => walk(d, ['.ts', '.tsx']))
const fePaths = new Set<string>()
const re = /['"`](\/api\/[^'"`]+?)['"`]/
for (const f of feFiles) {
  const txt = readFileSync(f, 'utf8')
  let m
  while ((m = re.exec(txt))) {
    let raw = m[1]
    // strip template ${...} and query strings
    raw = raw.replace(/\$\{[^}]+\}/g, 'ID').split('?')[0].replace(/\/ID$/,'')
    if (!raw || raw === '/api') continue
    fePaths.add(normDynamic(raw))
  }
}

const fe = [...fePaths].sort()
const rows: { path: string; v1: boolean; v2: boolean; status: string }[] = []
for (const p of fe) {
  const inV1 = v1.has(p)
  const inV2 = v2.has(p)
  let status: string
  if (inV2) status = 'CLEAN (v2)'
  else if (inV1) status = 'v1 only'
  else status = '*** MISSING ***'
  rows.push({ path: p, v1: inV1, v2: inV2, status })
}

const clean = rows.filter((r) => r.v2).length
const v1only = rows.filter((r) => r.v1 && !r.v2).length
const missing = rows.filter((r) => !r.v1 && !r.v2)

console.log('=========== BACKEND <-> FRONTEND COMPAT AUDIT ===========')
console.log('Backend route files: v1=' + v1.size + '  v2=' + v2.size)
console.log('Frontend unique API paths: ' + fe.length)
console.log('')
console.log('SUMMARY')
console.log('  Served by CLEAN v2 : ' + clean + '  (' + Math.round((clean / fe.length) * 100) + '%)')
console.log('  Served by v1 only  : ' + v1only + '  (' + Math.round((v1only / fe.length) * 100) + '%)')
console.log('  MISSING (no route) : ' + missing.length)
console.log('')
if (missing.length) {
  console.log('--- MISSING PATHS (frontend calls, backend has none) ---')
  for (const r of missing) console.log('  ' + r.path)
  console.log('')
}
console.log('--- FRONTEND PATHS -> ROUTE STATUS (first 200) ---')
for (const r of rows.slice(0, 200)) console.log('  ' + r.status.padEnd(14) + ' ' + r.path)
