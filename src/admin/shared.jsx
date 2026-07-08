import { useState } from 'react'
import { supabase, BUCKET } from '../lib/supabase.js'

export async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function ImageUpload({ value, onChange, ratio = '1 / 1' }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setErr('')
    try { onChange(await uploadImage(file)) }
    catch (x) { setErr('No se pudo subir: ' + x.message) }
    setBusy(false)
  }
  return (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div style={{ width:72, aspectRatio:ratio, borderRadius:9, background:'#eef1f5', overflow:'hidden', flexShrink:0 }}>
          {value && <img src={value} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
        </div>
        <label className="adm-btn adm-btn-ghost" style={{ cursor:'pointer' }}>
          {busy ? 'Subiendo…' : (value ? 'Cambiar imagen' : 'Subir imagen')}
          <input type="file" accept="image/*" onChange={onFile} style={{ display:'none' }} disabled={busy} />
        </label>
      </div>
      {err && <p style={{ color:'#B73A44', font:"600 12px 'Poppins'", margin:'8px 0 0' }}>{err}</p>}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label className="adm-label">{label}</label>}
      {children}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(10,23,48,.5)', display:'grid', placeItems:'center', padding:20, zIndex:100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:'#fff', borderRadius:18, padding:28, width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto' }}>
        <h2 style={{ font:"400 24px 'Anton',sans-serif", textTransform:'uppercase', margin:'0 0 18px' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
