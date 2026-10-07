'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    const result = isSignUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })
    setPending(false)
    if (result.error) {
      setError('Unable to complete authentication. Check your details and try again.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] p-5 text-[#20243a]"><section className="w-full max-w-md rounded-3xl border border-[#e7e8f0] bg-white p-7 shadow-xl shadow-[#302b6320]"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7066dd]">EBPS secure portal</p><h1 className="mt-3 text-2xl font-bold">{isSignUp ? 'Create staff account' : 'Sign in to ERP'}</h1><p className="mt-2 text-sm leading-6 text-[#85899d]">Emam Bukhari Private School · Kabul</p><form onSubmit={submit} className="mt-7 space-y-4">{isSignUp && <label className="block text-xs font-bold">Full name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e3e5ef] p-3 text-sm outline-none focus:border-[#7066dd]" autoComplete="name" /></label>}<label className="block text-xs font-bold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e3e5ef] p-3 text-sm outline-none focus:border-[#7066dd]" autoComplete="email" /></label><label className="block text-xs font-bold">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e3e5ef] p-3 text-sm outline-none focus:border-[#7066dd]" autoComplete={isSignUp ? 'new-password' : 'current-password'} /></label>{error && <p role="alert" className="rounded-xl bg-[#fff1f1] p-3 text-xs font-semibold text-[#c95757]">{error}</p>}<button disabled={pending} className="w-full rounded-xl bg-[#6761d9] py-3 text-xs font-bold text-white disabled:opacity-60">{pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</button></form><p className="mt-6 text-center text-xs text-[#85899d]">{isSignUp ? 'Already registered?' : 'New staff member?'} <Link className="font-bold text-[#625bd0]" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Create account'}</Link></p></section></main>
}
