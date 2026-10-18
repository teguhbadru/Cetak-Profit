'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/browser'

export default function LogoutButton() {
  const router = useRouter()
  const [busy,setBusy] = useState(false)
  return <button disabled={busy} onClick={async () => {
    setBusy(true)
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }} style={{background:'#237eae',color:'white',padding:'10px 18px',border:0,borderRadius:8}}>
    {busy?'Memproses…':'Keluar'}
  </button>
}
