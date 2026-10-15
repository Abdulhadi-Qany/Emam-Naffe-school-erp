// Temporary smoke test for the payroll module — exercises the full API workflow.
const BASE = process.env.BASE_URL || 'http://localhost:3000'
let passed = 0
let failed = 0

function check(name, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name} ${detail}`)
  }
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, json }
}

const moneyClose = (a, b) => Math.abs(Number(a) - Number(b)) < 0.01

async function main() {
  console.log('1) Salary structures list')
  const structures = await call('GET', '/api/finance/salary-structures')
  check('status 200', structures.status === 200, `got ${structures.status}`)
  check('3 seeded structures', structures.json?.data?.length === 3, `got ${structures.json?.data?.length}`)
  check('staff names joined', Boolean(structures.json?.data?.[0]?.staffName))

  console.log('2) Create a 4th staff member (no salary structure yet)')
  const newStaff = await call('POST', '/api/staff', {
    firstName: 'Test',
    fatherName: 'SmokeTest',
    familyName: 'Instructor',
    gender: 'male',
    schoolId: 'school-ebps-main',
    employmentType: 'full_time',
    joinDate: '2026-01-01',
    designation: 'Lab Assistant',
  })
  check('status 201', newStaff.status === 201, `got ${newStaff.status} ${JSON.stringify(newStaff.json)}`)
  const staffId = newStaff.json?.id

  console.log('3) Generate payroll run for 2026-10')
  const run1 = await call('POST', '/api/finance/payroll', {
    periodStart: '2026-10-01T00:00:00.000Z',
    periodEnd: '2026-10-31T00:00:00.000Z',
  })
  check('status 201', run1.status === 201, `got ${run1.status} ${JSON.stringify(run1.json)}`)
  check('3 payslips generated', run1.json?.payslipCount === 3, `got ${run1.json?.payslipCount}`)
  check('warning for staff without structure', run1.json?.warnings?.some((w) => w.includes('Test Instructor')), JSON.stringify(run1.json?.warnings))
  check('solar hijri period label 1405-07', run1.json?.run?.periodLabel === '1405-07', `got ${run1.json?.run?.periodLabel}`)
  const runId = run1.json?.run?.id

  console.log('4) Duplicate period rejected')
  const dup = await call('POST', '/api/finance/payroll', {
    periodStart: '2026-10-05T00:00:00.000Z',
    periodEnd: '2026-10-25T00:00:00.000Z',
  })
  check('status 409', dup.status === 409, `got ${dup.status}`)

  console.log('5) Run detail + math verification')
  const detail = await call('GET', `/api/finance/payroll/${runId}`)
  check('status 200', detail.status === 200, `got ${detail.status}`)
  check('3 payslips', detail.json?.payslips?.length === 3, `got ${detail.json?.payslips?.length}`)
  const slip = detail.json?.payslips?.[0]
  if (slip) {
    const gross =
      Number(slip.basicSalary) + Number(slip.houseAllowance) + Number(slip.transportAllowance) +
      Number(slip.foodAllowance) + Number(slip.positionAllowance) + Number(slip.performanceBonus)
    check('gross = earnings sum', moneyClose(slip.grossSalary, gross), `${slip.grossSalary} vs ${gross}`)
    const deductions = Number(slip.taxDeduction) + Number(slip.loanRepayment) + Number(slip.absenceDeduction) + Number(slip.otherDeductions)
    check('deductions total correct', moneyClose(slip.totalDeductions, deductions))
    check('net = gross - deductions', moneyClose(slip.netSalary, gross - deductions))
    check('slip number format', /^EBPS-PAY-1405-\d{4}$/.test(slip.slipNumber), slip.slipNumber)
    check('staff name joined on slip', Boolean(slip.staffName))
  }
  const totals = detail.json?.run
  const sumGross = detail.json.payslips.reduce((s, p) => s + Number(p.grossSalary), 0)
  check('run total gross = sum of slips', moneyClose(totals.totalGross, sumGross), `${totals.totalGross} vs ${sumGross}`)

  console.log('6) Workflow: approve -> pay')
  const approve = await call('PATCH', `/api/finance/payroll/${runId}`, { action: 'approve' })
  check('approve 200', approve.status === 200, `got ${approve.status} ${JSON.stringify(approve.json)}`)
  check('status approved', approve.json?.run?.status === 'approved')
  const approveAgain = await call('PATCH', `/api/finance/payroll/${runId}`, { action: 'approve' })
  check('double approve 409', approveAgain.status === 409, `got ${approveAgain.status}`)
  const pay = await call('PATCH', `/api/finance/payroll/${runId}`, { action: 'pay' })
  check('pay 200', pay.status === 200, `got ${pay.status} ${JSON.stringify(pay.json)}`)
  check('status paid', pay.json?.run?.status === 'paid')
  const detailAfterPay = await call('GET', `/api/finance/payroll/${runId}`)
  check('all payslips paid', detailAfterPay.json?.payslips?.every((p) => p.status === 'paid'))
  const payAgain = await call('PATCH', `/api/finance/payroll/${runId}`, { action: 'pay' })
  check('double pay 409', payAgain.status === 409, `got ${payAgain.status}`)

  console.log('7) Salary structure CRUD for 4th staff')
  const createStructure = await call('POST', '/api/finance/salary-structures', {
    staffId,
    basicSalary: 12000,
    houseAllowance: 2000,
    transportAllowance: 1000,
    taxDeduction: 400,
    paymentMethod: 'cash',
    bankName: 'Kabul Bank',
  })
  check('create 201', createStructure.status === 201, `got ${createStructure.status} ${JSON.stringify(createStructure.json)}`)
  const structureId = createStructure.json?.id
  check('money stored as 2dp strings', createStructure.json?.basicSalary === '12000.00', `got ${createStructure.json?.basicSalary}`)
  const dupStructure = await call('POST', '/api/finance/salary-structures', { staffId, basicSalary: 1 })
  check('duplicate structure 409', dupStructure.status === 409, `got ${dupStructure.status}`)
  const update = await call('PUT', `/api/finance/salary-structures/${structureId}`, { basicSalary: 13000, isActive: true })
  check('update 200', update.status === 200, `got ${update.status}`)
  check('updated basic 13000.00', update.json?.basicSalary === '13000.00', `got ${update.json?.basicSalary}`)
  const invalid = await call('POST', '/api/finance/salary-structures', { staffId: 'does-not-exist' })
  check('unknown staff 404', invalid.status === 404, `got ${invalid.status}`)

  console.log('8) Second payroll run for 2026-11 (4 staff, no warnings)')
  const run2 = await call('POST', '/api/finance/payroll', {
    periodStart: '2026-11-01T00:00:00.000Z',
    periodEnd: '2026-11-30T00:00:00.000Z',
  })
  check('status 201', run2.status === 201, `got ${run2.status} ${JSON.stringify(run2.json)}`)
  check('4 payslips generated', run2.json?.payslipCount === 4, `got ${run2.json?.payslipCount}`)
  check('no warnings', (run2.json?.warnings?.length ?? 0) === 0, JSON.stringify(run2.json?.warnings))
  const runs = await call('GET', '/api/finance/payroll')
  check('2 runs listed', runs.json?.data?.length === 2, `got ${runs.json?.data?.length}`)

  console.log('9) Payroll page renders')
  const page = await fetch(`${BASE}/finance/payroll`)
  check('page status 200', page.status === 200, `got ${page.status}`)
  const html = await page.text()
  check('page contains Payroll Runs', html.includes('Payroll Runs'))

  console.log('10) Cleanup: remove 4th staff + structure')
  await call('DELETE', `/api/finance/salary-structures/${structureId}`)
  if (staffId) await call('DELETE', `/api/staff/${staffId}`)

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Smoke test crashed:', error)
  process.exit(1)
})

