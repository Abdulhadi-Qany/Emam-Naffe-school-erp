'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bus,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: LayoutDashboard },
      { label: 'Students', icon: GraduationCap, count: '1,248' },
      { label: 'Faculty & staff', icon: Users },
      { label: 'Attendance', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Academics', icon: BookOpen },
      { label: 'Fees & finance', icon: CircleDollarSign, count: '12' },
      { label: 'Transport', icon: Bus },
      { label: 'Communications', icon: MessageSquare },
    ],
  },
]

const upcoming = [
  { title: 'Parent–teacher conference', date: 'Today, 2:00 PM', type: 'Meeting', color: 'purple' },
  { title: 'Term 2 fee deadline', date: 'Tomorrow, 11:59 PM', type: 'Finance', color: 'orange' },
  { title: 'Science fair submissions', date: 'Fri, 18 Oct', type: 'Academic', color: 'blue' },
]

const activity = [
  { initials: 'AK', name: 'Anika Kapoor', action: 'enrolled in Grade 8-B', time: '8 min ago', tone: 'lilac' },
  { initials: 'RM', name: 'Rohan Mehta', action: 'paid term 2 tuition fees', time: '24 min ago', tone: 'mint' },
  { initials: 'SJ', name: 'Sarah Johnson', action: 'published a new announcement', time: '1 hr ago', tone: 'peach' },
  { initials: 'DW', name: 'David Wilson', action: 'marked attendance for 8-A', time: '2 hrs ago', tone: 'sky' },
]

const bars = [38, 54, 47, 66, 58, 75, 61, 84, 72, 88, 68, 79]

export function SchoolErpDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Overview')
  const [period, setPeriod] = useState('This month')
  const [notice, setNotice] = useState('')

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#20243a]">
      {notice && <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-xl bg-[#20243a] px-4 py-3 text-sm font-medium text-white shadow-xl"><Check size={16} className="text-[#72d8b2]" />{notice}</div>}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[258px] border-r border-[#e7e9f1] bg-white transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between px-2 pb-8 pt-1">
            <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#292b55] text-white shadow-sm"><GraduationCap size={20} /></div><div><p className="text-[15px] font-bold tracking-tight">Lumen<span className="text-[#8177e8]">OS</span></p><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9eb4]">School operations</p></div></div>
            <button onClick={() => setMenuOpen(false)} className="rounded-lg p-1 text-[#9a9eb4] lg:hidden" aria-label="Close menu"><X size={18} /></button>
          </div>
          <div className="mb-5 rounded-2xl bg-[#f5f3ff] p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-lg bg-white text-[#7066dd] shadow-sm"><ShieldCheck size={17} /></div><div><p className="text-xs font-bold">Westbridge Academy</p><p className="text-[10px] text-[#8786a6]">Admin workspace</p></div></div><ChevronDown size={15} className="text-[#8986ac]" /></div></div>
          <nav className="flex-1 space-y-7 overflow-y-auto">{navGroups.map((group) => <div key={group.label}><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a4a7b9]">{group.label}</p><div className="space-y-1">{group.items.map(({ label, icon: Icon, count }) => <button key={label} onClick={() => { setActiveNav(label); showNotice(`${label} view selected`) }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${activeNav === label ? 'bg-[#eeedff] text-[#625bd0]' : 'text-[#777b91] hover:bg-[#f7f7fb] hover:text-[#3c4060]'}`}><span className="flex items-center gap-3"><Icon size={17} strokeWidth={activeNav === label ? 2.3 : 1.8} />{label}</span>{count && <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${activeNav === label ? 'bg-white text-[#7771d9]' : 'bg-[#f1f2f7] text-[#a0a3b5]'}`}>{count}</span>}</button>)}</div></div>)}</nav>
          <div className="border-t border-[#edf0f5] pt-4"><button onClick={() => showNotice('Settings are ready to configure')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#777b91] hover:bg-[#f7f7fb]"><Settings size={17} />Settings</button><div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f8f8fc] p-3"><div className="grid size-8 place-items-center rounded-full bg-[#dce8f7] text-xs font-bold text-[#4d6d98]">JD</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">Jordan Davis</p><p className="text-[10px] text-[#999caf]">Super admin</p></div><MoreHorizontal size={16} className="text-[#a1a4b4]" /></div></div>
        </div>
      </aside>

      <div className="lg:pl-[258px]"><header className="flex h-[76px] items-center justify-between border-b border-[#e8eaf1] bg-white/80 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="rounded-xl border border-[#e8eaf1] p-2 text-[#70758d] lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={19} /></button><div><p className="text-xs font-medium text-[#a0a3b3]">Tuesday, October 15, 2024</p><h1 className="text-lg font-bold tracking-tight">Good morning, Jordan <span aria-hidden="true">✦</span></h1></div></div><div className="flex items-center gap-2 md:gap-4"><button className="hidden items-center gap-2 rounded-xl border border-[#e7e9f0] bg-white px-3 py-2 text-xs font-semibold text-[#8b8fa3] shadow-sm md:flex"><Search size={15} />Search anything <kbd className="ml-2 rounded border border-[#e8e9ef] px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button><button onClick={() => showNotice('You are all caught up')} className="relative rounded-xl p-2.5 text-[#777b91] hover:bg-[#f5f6fa]" aria-label="Notifications"><Bell size={19} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#ef7c72]" /></button><div className="hidden h-7 w-px bg-[#ebedf3] md:block" /><div className="grid size-9 place-items-center rounded-full bg-[#dce8f7] text-xs font-bold text-[#4d6d98]">JD</div></div></header>
        <main className="mx-auto max-w-[1440px] p-5 md:p-8"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#8488a0]"><span>Workspace</span><span>/</span><span className="text-[#625bd0]">{activeNav}</span></div><h2 className="text-2xl font-bold tracking-tight text-[#232640]">School overview</h2><p className="mt-1 text-sm text-[#888ca1]">Here&apos;s what&apos;s happening across your campus today.</p></div><div className="flex gap-2"><button onClick={() => showNotice('Report export started')} className="rounded-xl border border-[#e3e5ee] bg-white px-3.5 py-2.5 text-xs font-bold text-[#62677e] shadow-sm hover:bg-[#fafaff]"><FileText size={15} className="mr-2 inline" />Export report</button><button onClick={() => showNotice('New student form opened')} className="rounded-xl bg-[#6761d9] px-4 py-2.5 text-xs font-bold text-white shadow-[0_5px_14px_rgba(103,97,217,0.24)] hover:bg-[#5953cb]"><span className="mr-1 text-base">+</span> Add student</button></div></div>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total students" value="1,248" change="8.2%" sub="vs. last term" icon={<GraduationCap size={19} />} tone="purple" /><MetricCard label="Today&apos;s attendance" value="94.8%" change="2.4%" sub="vs. yesterday" icon={<ClipboardCheck size={19} />} tone="mint" /><MetricCard label="Fee collection" value="$284,920" change="12.8%" sub="vs. last month" icon={<WalletCards size={19} />} tone="peach" /><MetricCard label="Staff on campus" value="86 / 92" change="93.5%" sub="present today" icon={<Users size={19} />} tone="sky" /></section>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]"><section className="rounded-2xl border border-[#e8eaf1] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,80,0.025)] md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-sm font-bold">Attendance overview</h3><p className="mt-1 text-xs text-[#999daf]">Daily attendance across all grades</p></div><select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-[#e6e8f0] bg-white px-2.5 py-2 text-xs font-semibold text-[#73788d] outline-none"><option>This month</option><option>This term</option><option>This year</option></select></div><div className="flex items-end gap-3 border-b border-[#eff0f5] pb-4 pt-6 sm:gap-5">{bars.map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center gap-2"><div className="relative w-full"><div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[#272a4e] px-1.5 py-1 text-[9px] text-white group-hover:block">{height + 10}%</div><div style={{ height: `${height * 1.55}px` }} className={`w-full rounded-t-md transition-all ${index === 9 ? 'bg-[#6963da]' : 'bg-[#e0dffc] group-hover:bg-[#b9b4f4]'}`} /></div><span className="text-[10px] text-[#afb2c0]">{['1','3','5','7','9','11','13','15','17','19','21','23'][index]}</span></div>)}</div><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-[#8e92a6]"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#6963da]" />Present <b className="ml-1 text-[#363a55]">94.8%</b></span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#e0dffc]" />Absent <b className="ml-1 text-[#363a55]">3.1%</b></span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#f5c2a9]" />Late <b className="ml-1 text-[#363a55]">2.1%</b></span></div></section>
            <section className="rounded-2xl border border-[#e8eaf1] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,80,0.025)] md:p-6"><div className="mb-5 flex items-start justify-between"><div><h3 className="text-sm font-bold">Upcoming</h3><p className="mt-1 text-xs text-[#999daf]">Keep an eye on what&apos;s next</p></div><button onClick={() => showNotice('Calendar opened')} className="text-xs font-bold text-[#6963da]">View calendar <ArrowUpRight size={13} className="ml-1 inline" /></button></div><div className="space-y-3">{upcoming.map((item) => <button onClick={() => showNotice(`${item.title} selected`)} key={item.title} className="flex w-full items-center gap-3 rounded-xl border border-[#f0f1f5] p-3 text-left transition hover:border-[#dcdaf8] hover:bg-[#fbfaff]"><div className={`grid size-9 shrink-0 place-items-center rounded-lg ${item.color === 'purple' ? 'bg-[#eeedff] text-[#756ee0]' : item.color === 'orange' ? 'bg-[#fff1e7] text-[#e89055]' : 'bg-[#e9f3ff] text-[#5892cb]'}`}>{item.color === 'purple' ? <CalendarDays size={17} /> : item.color === 'orange' ? <WalletCards size={17} /> : <Sparkles size={17} />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.title}</p><p className="mt-1 text-[11px] text-[#999daf]">{item.date}</p></div><span className="rounded-md bg-[#f6f6fa] px-2 py-1 text-[10px] font-semibold text-[#9699aa]">{item.type}</span></button>)}</div></section></div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]"><section className="rounded-2xl border border-[#e8eaf1] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,80,0.025)] md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-sm font-bold">Recent activity</h3><p className="mt-1 text-xs text-[#999daf]">Latest updates from your school</p></div><button onClick={() => showNotice('Activity log opened')} className="text-xs font-bold text-[#6963da]">View all <ArrowUpRight size={13} className="ml-1 inline" /></button></div><div className="divide-y divide-[#f0f1f5]">{activity.map((item) => <div key={item.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className={`grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-bold ${item.tone === 'lilac' ? 'bg-[#eeeaff] text-[#7169ca]' : item.tone === 'mint' ? 'bg-[#e2f7ee] text-[#4a9a78]' : item.tone === 'peach' ? 'bg-[#fff0e7] text-[#c77b55]' : 'bg-[#e5f2ff] text-[#5b8db9]'}`}>{item.initials}</div><p className="min-w-0 flex-1 text-xs text-[#85899d]"><b className="font-bold text-[#3a3e58]">{item.name}</b> {item.action}</p><span className="shrink-0 text-[10px] text-[#b0b3c1]">{item.time}</span></div>)}</div></section><section className="rounded-2xl border border-[#e8eaf1] bg-[#292b55] p-5 text-white shadow-[0_4px_20px_rgba(40,44,80,0.08)] md:p-6"><div className="mb-6 flex items-start justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a7a6d5]">Quick actions</p><h3 className="text-lg font-bold">What would you like to do?</h3></div><Activity size={20} className="text-[#8680df]" /></div><div className="grid grid-cols-2 gap-2.5">{['Mark attendance', 'Create invoice', 'Send announcement', 'Add staff'].map((label) => <button key={label} onClick={() => showNotice(`${label} opened`)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-[11px] font-semibold text-[#e6e5f6] transition hover:bg-white/10"><span className="mb-2 block text-lg text-[#a9a4f4]">{label === 'Mark attendance' ? '✓' : label === 'Create invoice' ? '$' : label === 'Send announcement' ? '↗' : '+'}</span>{label}</button>)}</div></section></div>
        </main>
      </div>
    </div>
  )
}

function MetricCard({ label, value, change, sub, icon, tone }: { label: string; value: string; change: string; sub: string; icon: React.ReactNode; tone: 'purple' | 'mint' | 'peach' | 'sky' }) {
  const tones = { purple: 'bg-[#eeedff] text-[#6e67d9]', mint: 'bg-[#e5f8ef] text-[#51a47e]', peach: 'bg-[#fff0e7] text-[#db8a5c]', sky: 'bg-[#e8f3ff] text-[#5793ca]' }
  return <div className="rounded-2xl border border-[#e8eaf1] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,80,0.025)]"><div className="mb-4 flex items-center justify-between"><div className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div><span className="flex items-center gap-1 text-[10px] font-bold text-[#54a780]"><ArrowUpRight size={12} />{change}</span></div><p className="text-xs font-medium text-[#989bad]">{label}</p><div className="mt-1 flex items-baseline gap-2"><p className="text-[25px] font-bold tracking-tight text-[#292d48]">{value}</p><span className="text-[10px] font-medium text-[#a5a8b7]">{sub}</span></div></div>
}

export default SchoolErpDashboard
