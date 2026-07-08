import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { ImageUpload, Field, Modal } from './shared.jsx'

const wrap = { minHeight:'100vh', background:'#F3F4F6', fontFamily:"'Poppins',sans-serif", color:'#173470', overflowX:'hidden' }

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (checking) return <div style={{ ...wrap, display:'grid', placeItems:'center' }}>Cargando…</div>
  if (!session) return <Login />
  return <Dashboard session={session} />
}

/* ---------------- LOGIN ---------------- */
function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) setErr('Correo o contraseña incorrectos.')
    setBusy(false)
  }

  return (
    <div style={{ ...wrap, display:'grid', placeItems:'center', padding:20 }}>
      <form onSubmit={submit} style={{ background:'#fff', padding:'40px 34px', borderRadius:18, boxShadow:'0 20px 50px -24px rgba(23,52,112,.4)', width:'100%', maxWidth:380 }}>
        <img src="/img/logo.png" alt="Pescadería Álvarez" style={{ height:46, display:'block', margin:'0 auto 8px' }} />
        <h1 style={{ font:"400 26px 'Anton',sans-serif", textTransform:'uppercase', textAlign:'center', margin:'6px 0 4px' }}>Panel de contenido</h1>
        <p style={{ font:"500 12px 'Poppins'", color:'#9AA49A', textAlign:'center', margin:'0 0 24px' }}>Acceso solo para administrador</p>
        <label className="adm-label">Correo</label>
        <input className="adm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <div style={{ height:14 }} />
        <label className="adm-label">Contraseña</label>
        <input className="adm-input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required autoComplete="current-password" />
        {err && <p style={{ color:'#B73A44', font:"600 12px 'Poppins'", margin:'14px 0 0' }}>{err}</p>}
        <button className="adm-btn" style={{ width:'100%', marginTop:22 }} disabled={busy}>
          {busy ? <span className="spin" /> : 'Entrar'}
        </button>
        <p style={{ textAlign:'center', marginTop:18 }}><a href="/" style={{ font:"600 12px 'Poppins'", color:'#9AA49A' }}>← Volver al sitio</a></p>
      </form>
    </div>
  )
}

/* ---------------- DASHBOARD ---------------- */
const TABS = [
  ['ofertas', 'Promociones'],
  ['categorias', 'Categorías'],
  ['galeria', 'Galería'],
  ['sucursales', 'Sucursales'],
  ['textos', 'Textos'],
]

const PANEL_W = 'min(46vw, 520px)'
const PANEL_H = '55vh'
const MOBILE_BP = 820
const TAB_SECTION = { ofertas:'promociones', categorias:'menu', galeria:'galeria', sucursales:'sucursales', textos:'hero' }

function useIsMobile(bp = MOBILE_BP) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const on = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [bp])
  return m
}

function Dashboard({ session }) {
  const [tab, setTab] = useState('ofertas')
  const [notAdmin, setNotAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [preview, setPreview] = useState(false)
  const [pvKey, setPvKey] = useState(0)
  const [section, setSection] = useState('promociones')
  const mobile = useIsMobile()

  useEffect(() => {
    supabase.from('pesc_admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => { setNotAdmin(!data); setChecking(false) })
  }, [])

  // al cambiar de pestaña, apunta la vista previa a su sección
  useEffect(() => { setSection(TAB_SECTION[tab] || 'hero') }, [tab])

  if (checking) return <div style={{ ...wrap, display:'grid', placeItems:'center' }}>Verificando…</div>
  if (notAdmin) return (
    <div style={{ ...wrap, display:'grid', placeItems:'center', padding:20, textAlign:'center' }}>
      <div>
        <h2 style={{ font:"400 26px 'Anton',sans-serif" }}>Sin permiso</h2>
        <p style={{ color:'#9AA49A' }}>Esta cuenta no es administrador.</p>
        <button className="adm-btn adm-btn-ghost" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </div>
    </div>
  )

  return (
    <div style={wrap}>
      <div style={{
        marginRight: preview && !mobile ? PANEL_W : 0,
        marginBottom: preview && mobile ? PANEL_H : 0,
        transition:'margin .2s ease',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'12px 5vw', background:'#fff', borderBottom:'1px solid #e6e9ee', position:'sticky', top:0, zIndex:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
            <img src="/img/logo.png" alt="" style={{ height:32, flexShrink:0 }} />
            {!mobile && <span style={{ font:"700 14px 'Poppins'", color:'#173470' }}>Panel de contenido</span>}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <button className="adm-btn adm-btn-ghost" onClick={() => setPreview((v) => !v)} title="Vista previa" style={{ background: preview ? '#eaf1fb' : undefined, color: preview ? '#004AAC' : undefined }}>
              {mobile ? (preview ? '✕' : '👁') : (preview ? '✕ Ocultar vista previa' : '👁 Vista previa')}
            </button>
            <a href="/" target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost" style={{ textDecoration:'none' }}>{mobile ? 'Sitio' : 'Ver sitio'}</a>
            <button className="adm-btn adm-btn-ghost" onClick={() => supabase.auth.signOut()}>Salir</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, padding:'0 5vw', background:'#fff', borderBottom:'1px solid #e6e9ee', position:'sticky', top:61, zIndex:19, flexWrap: mobile ? 'wrap' : 'nowrap', overflowX: mobile ? 'visible' : 'auto' }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              border:'none', background:'none', cursor:'pointer', padding:'12px 8px', whiteSpace:'nowrap',
              font:`${tab===id?700:500} 13px 'Poppins'`, color: tab===id ? '#004AAC' : '#9AA49A',
              borderBottom: `2px solid ${tab===id ? '#004AAC' : 'transparent'}` }}>{label}</button>
          ))}
        </div>

        <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 5vw 90px' }}>
          {tab === 'ofertas' && <OfertasTab />}
          {tab === 'categorias' && <CategoriasTab />}
          {tab === 'galeria' && <GaleriaTab />}
          {tab === 'sucursales' && <SucursalesTab />}
          {tab === 'textos' && <TextosTab onSection={setSection} />}
        </div>
      </div>

      {preview && <PreviewPanel pvKey={pvKey} section={section} mobile={mobile} onReload={() => setPvKey((k) => k + 1)} onClose={() => setPreview(false)} />}
    </div>
  )
}

function PreviewPanel({ pvKey, section, mobile, onReload, onClose }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(0)

  // envía al iframe qué sección resaltar (al cambiar sección o al cargar)
  useEffect(() => {
    const win = ref.current?.contentWindow
    if (!win || !section) return
    const send = () => win.postMessage({ type: 'pesc-highlight', section }, '*')
    send()
    const t = setTimeout(send, 300) // reintento por si aún renderiza
    return () => clearTimeout(t)
  }, [section, loaded, pvKey])

  const panelPos = mobile
    ? { left:0, right:0, bottom:0, height:PANEL_H, width:'100%', borderTop:'1px solid #e6e9ee', boxShadow:'0 -12px 30px -18px rgba(10,23,48,.5)' }
    : { top:0, right:0, bottom:0, width:PANEL_W, borderLeft:'1px solid #e6e9ee', boxShadow:'-12px 0 30px -18px rgba(10,23,48,.5)' }

  return (
    <div style={{ position:'fixed', ...panelPos, background:'#0a1730', zIndex:30, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#173470' }}>
        <span style={{ font:"700 12px 'Poppins'", color:'#dcb877', letterSpacing:'.04em', textTransform:'uppercase' }}>Vista previa · en vivo</span>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onReload} title="Recargar" style={{ border:'none', background:'rgba(255,255,255,.12)', color:'#fff', borderRadius:7, padding:'6px 10px', cursor:'pointer', font:"600 12px 'Poppins'" }}>↻</button>
          <a href="/" target="_blank" rel="noreferrer" title="Abrir en pestaña nueva" style={{ border:'none', background:'rgba(255,255,255,.12)', color:'#fff', borderRadius:7, padding:'6px 10px', cursor:'pointer', font:"600 12px 'Poppins'", textDecoration:'none' }}>⤢</a>
          <button onClick={onClose} title="Cerrar" style={{ border:'none', background:'rgba(255,255,255,.12)', color:'#fff', borderRadius:7, padding:'6px 10px', cursor:'pointer', font:"600 12px 'Poppins'" }}>✕</button>
        </div>
      </div>
      <iframe key={pvKey} ref={ref} src="/" title="Vista previa" onLoad={() => setLoaded((n) => n + 1)} style={{ flex:1, width:'100%', border:'none', background:'#F3F4F6' }} />
      <div style={{ padding:'8px 14px', background:'#173470', font:"500 11px 'Poppins'", color:'#a9bde0', textAlign:'center' }}>
        La sección que editas se resalta aquí. Cambios en vivo.
      </div>
    </div>
  )
}

function TabHeader({ titulo, sub, onAdd, addLabel = '+ Nuevo' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
      <div>
        <h1 style={{ font:"400 30px 'Anton',sans-serif", textTransform:'uppercase', margin:0 }}>{titulo}</h1>
        {sub && <p style={{ font:"500 13px 'Poppins'", color:'#9AA49A', margin:'4px 0 0' }}>{sub}</p>}
      </div>
      {onAdd && <button className="adm-btn" onClick={onAdd}>{addLabel}</button>}
    </div>
  )
}

function Row({ img, imgRatio = '1 / 1', title, meta, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', background:'#fff', borderRadius:12, padding:12, boxShadow:'0 6px 18px -14px rgba(23,52,112,.3)' }}>
      {img !== undefined && (
        <div style={{ width:64, aspectRatio:imgRatio, background:'#eef1f5', borderRadius:9, overflow:'hidden', flexShrink:0 }}>
          {img && <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
        </div>
      )}
      <div style={{ flex:'1 1 140px', minWidth:0 }}>
        <div style={{ font:"700 15px 'Poppins'", color:'#173470' }}>{title}</div>
        {meta && <div style={{ font:"500 13px 'Poppins'", color:'#9AA49A' }}>{meta}</div>}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginLeft:'auto' }}>{children}</div>
    </div>
  )
}

/* ---------------- OFERTAS ---------------- */
function OfertasTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('pesc_ofertas').select('*').order('orden', { ascending: true })
    setRows(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggle(o) { await supabase.from('pesc_ofertas').update({ activa: !o.activa }).eq('id', o.id); load() }
  async function remove(o) { if (confirm(`¿Borrar "${o.titulo}"?`)) { await supabase.from('pesc_ofertas').delete().eq('id', o.id); load() } }

  return (
    <>
      <TabHeader titulo="Promociones" sub="Solo las activas aparecen en la landing." onAdd={() => setEditing('new')} addLabel="+ Nueva oferta" />
      {loading ? <p style={{ color:'#9AA49A' }}>Cargando…</p> : (
        <div style={{ display:'grid', gap:12 }}>
          {rows.map((o) => (
            <div key={o.id} style={{ opacity:o.activa?1:0.55 }}>
              <Row img={o.imagen_url} title={o.titulo}
                meta={<><span>{o.precio_antes != null && <s>${o.precio_antes} </s>}<b style={{ color:'#B28E57' }}>${o.precio_ahora}{o.unidad}</b></span><span style={{ marginLeft:10, color:'#c2c8cf' }}>orden {o.orden}</span></>}>
                <button className="adm-btn adm-btn-ghost" onClick={() => toggle(o)}>{o.activa ? '🟢 Activa' : '⚪ Oculta'}</button>
                <button className="adm-btn adm-btn-ghost" onClick={() => setEditing(o)}>Editar</button>
                <button className="adm-btn adm-btn-danger" onClick={() => remove(o)}>Borrar</button>
              </Row>
            </div>
          ))}
        </div>
      )}
      {editing && <OfertaForm oferta={editing==='new'?null:editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </>
  )
}

function OfertaForm({ oferta, onClose, onSaved }) {
  const [f, setF] = useState(oferta ? {
    titulo:oferta.titulo, precio_antes:oferta.precio_antes??'', precio_ahora:oferta.precio_ahora,
    unidad:oferta.unidad, imagen_url:oferta.imagen_url??'', activa:oferta.activa, orden:oferta.orden,
  } : { titulo:'', precio_antes:'', precio_ahora:'', unidad:'/kg', imagen_url:'', activa:true, orden:0 })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  async function save(e) {
    e.preventDefault(); setSaving(true); setErr('')
    const payload = {
      titulo:f.titulo.trim(), precio_antes:f.precio_antes===''?null:Number(f.precio_antes),
      precio_ahora:Number(f.precio_ahora), unidad:f.unidad.trim()||'/kg',
      imagen_url:f.imagen_url||null, activa:!!f.activa, orden:Number(f.orden)||0,
    }
    const q = oferta ? supabase.from('pesc_ofertas').update(payload).eq('id', oferta.id) : supabase.from('pesc_ofertas').insert(payload)
    const { error } = await q
    if (error) { setErr('Error: ' + error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <Modal title={oferta ? 'Editar oferta' : 'Nueva oferta'} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Título"><input className="adm-input" value={f.titulo} onChange={(e)=>set('titulo',e.target.value)} required /></Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Precio antes (opcional)"><input className="adm-input" type="number" step="0.01" value={f.precio_antes} onChange={(e)=>set('precio_antes',e.target.value)} /></Field>
          <Field label="Precio ahora"><input className="adm-input" type="number" step="0.01" value={f.precio_ahora} onChange={(e)=>set('precio_ahora',e.target.value)} required /></Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Unidad"><input className="adm-input" value={f.unidad} onChange={(e)=>set('unidad',e.target.value)} /></Field>
          <Field label="Orden"><input className="adm-input" type="number" value={f.orden} onChange={(e)=>set('orden',e.target.value)} /></Field>
        </div>
        <Field label="Imagen"><ImageUpload value={f.imagen_url} onChange={(u)=>set('imagen_url',u)} /></Field>
        <label style={{ display:'flex', alignItems:'center', gap:8, margin:'4px 0 4px', cursor:'pointer' }}>
          <input type="checkbox" checked={f.activa} onChange={(e)=>set('activa',e.target.checked)} />
          <span style={{ font:"600 13px 'Poppins'", color:'#4b5661' }}>Mostrar en la landing</span>
        </label>
        {err && <p style={{ color:'#B73A44', font:"600 12px 'Poppins'" }}>{err}</p>}
        <FormButtons onClose={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

/* ---------------- CATEGORIAS ---------------- */
function CategoriasTab() {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(null)
  async function load() { setLoading(true); const { data } = await supabase.from('pesc_categorias').select('*').order('orden',{ascending:true}); setRows(data||[]); setLoading(false) }
  useEffect(() => { load() }, [])
  async function remove(c) { if (confirm(`¿Borrar "${c.titulo}"?`)) { await supabase.from('pesc_categorias').delete().eq('id', c.id); load() } }
  return (
    <>
      <TabHeader titulo="Categorías" sub='Tarjetas de la sección "Del mar a tu mesa".' onAdd={() => setEditing('new')} addLabel="+ Nueva categoría" />
      {loading ? <p style={{ color:'#9AA49A' }}>Cargando…</p> : (
        <div style={{ display:'grid', gap:12 }}>
          {rows.map((c) => (
            <Row key={c.id} img={c.imagen_url} title={c.titulo} meta={<>{c.descripcion}<span style={{ marginLeft:10, color:'#c2c8cf' }}>orden {c.orden}</span></>}>
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditing(c)}>Editar</button>
              <button className="adm-btn adm-btn-danger" onClick={() => remove(c)}>Borrar</button>
            </Row>
          ))}
        </div>
      )}
      {editing && <CategoriaForm cat={editing==='new'?null:editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </>
  )
}

function CategoriaForm({ cat, onClose, onSaved }) {
  const [f, setF] = useState(cat ? { titulo:cat.titulo, descripcion:cat.descripcion??'', imagen_url:cat.imagen_url??'', orden:cat.orden } : { titulo:'', descripcion:'', imagen_url:'', orden:0 })
  const [saving, setSaving] = useState(false); const [err, setErr] = useState('')
  const set = (k,v) => setF((s)=>({ ...s, [k]:v }))
  async function save(e) {
    e.preventDefault(); setSaving(true); setErr('')
    const payload = { titulo:f.titulo.trim(), descripcion:f.descripcion.trim()||null, imagen_url:f.imagen_url||null, orden:Number(f.orden)||0 }
    const q = cat ? supabase.from('pesc_categorias').update(payload).eq('id', cat.id) : supabase.from('pesc_categorias').insert(payload)
    const { error } = await q
    if (error) { setErr('Error: '+error.message); setSaving(false); return }
    onSaved()
  }
  return (
    <Modal title={cat ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Título"><input className="adm-input" value={f.titulo} onChange={(e)=>set('titulo',e.target.value)} required /></Field>
        <Field label="Descripción"><input className="adm-input" value={f.descripcion} onChange={(e)=>set('descripcion',e.target.value)} placeholder="Camarón, pulpo, callo de hacha" /></Field>
        <Field label="Orden"><input className="adm-input" type="number" value={f.orden} onChange={(e)=>set('orden',e.target.value)} /></Field>
        <Field label="Imagen"><ImageUpload value={f.imagen_url} onChange={(u)=>set('imagen_url',u)} ratio="16 / 11" /></Field>
        {err && <p style={{ color:'#B73A44', font:"600 12px 'Poppins'" }}>{err}</p>}
        <FormButtons onClose={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

/* ---------------- GALERIA ---------------- */
function GaleriaTab() {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(null)
  async function load() { setLoading(true); const { data } = await supabase.from('pesc_galeria').select('*').order('orden',{ascending:true}); setRows(data||[]); setLoading(false) }
  useEffect(() => { load() }, [])
  async function remove(g) { if (confirm('¿Borrar esta imagen de la galería?')) { await supabase.from('pesc_galeria').delete().eq('id', g.id); load() } }
  return (
    <>
      <TabHeader titulo="Galería" sub='La imagen "destacada" ocupa el recuadro grande.' onAdd={() => setEditing('new')} addLabel="+ Nueva imagen" />
      {loading ? <p style={{ color:'#9AA49A' }}>Cargando…</p> : (
        <div style={{ display:'grid', gap:12 }}>
          {rows.map((g) => (
            <Row key={g.id} img={g.imagen_url} imgRatio="1 / 1" title={g.destacado ? '★ Destacada' : 'Imagen'} meta={<>orden {g.orden}</>}>
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditing(g)}>Editar</button>
              <button className="adm-btn adm-btn-danger" onClick={() => remove(g)}>Borrar</button>
            </Row>
          ))}
        </div>
      )}
      {editing && <GaleriaForm item={editing==='new'?null:editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </>
  )
}

function GaleriaForm({ item, onClose, onSaved }) {
  const [f, setF] = useState(item ? { imagen_url:item.imagen_url??'', destacado:item.destacado, orden:item.orden } : { imagen_url:'', destacado:false, orden:0 })
  const [saving, setSaving] = useState(false); const [err, setErr] = useState('')
  const set = (k,v) => setF((s)=>({ ...s, [k]:v }))
  async function save(e) {
    e.preventDefault()
    if (!f.imagen_url) { setErr('Sube una imagen.'); return }
    setSaving(true); setErr('')
    const payload = { imagen_url:f.imagen_url, destacado:!!f.destacado, orden:Number(f.orden)||0 }
    const q = item ? supabase.from('pesc_galeria').update(payload).eq('id', item.id) : supabase.from('pesc_galeria').insert(payload)
    const { error } = await q
    if (error) { setErr('Error: '+error.message); setSaving(false); return }
    onSaved()
  }
  return (
    <Modal title={item ? 'Editar imagen' : 'Nueva imagen'} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Imagen"><ImageUpload value={f.imagen_url} onChange={(u)=>set('imagen_url',u)} ratio="1 / 1" /></Field>
        <Field label="Orden"><input className="adm-input" type="number" value={f.orden} onChange={(e)=>set('orden',e.target.value)} /></Field>
        <label style={{ display:'flex', alignItems:'center', gap:8, margin:'4px 0', cursor:'pointer' }}>
          <input type="checkbox" checked={f.destacado} onChange={(e)=>set('destacado',e.target.checked)} />
          <span style={{ font:"600 13px 'Poppins'", color:'#4b5661' }}>Destacada (recuadro grande)</span>
        </label>
        {err && <p style={{ color:'#B73A44', font:"600 12px 'Poppins'" }}>{err}</p>}
        <FormButtons onClose={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

/* ---------------- SUCURSALES ---------------- */
function SucursalesTab() {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(null)
  async function load() { setLoading(true); const { data } = await supabase.from('pesc_sucursales').select('*').order('orden',{ascending:true}); setRows(data||[]); setLoading(false) }
  useEffect(() => { load() }, [])
  async function remove(s) { if (confirm(`¿Borrar "${s.nombre}"?`)) { await supabase.from('pesc_sucursales').delete().eq('id', s.id); load() } }
  return (
    <>
      <TabHeader titulo="Sucursales" sub="Datos de contacto que aparecen en la landing." onAdd={() => setEditing('new')} addLabel="+ Nueva sucursal" />
      {loading ? <p style={{ color:'#9AA49A' }}>Cargando…</p> : (
        <div style={{ display:'grid', gap:12 }}>
          {rows.map((s) => (
            <Row key={s.id} title={s.nombre} meta={<>{s.direccion}<span style={{ marginLeft:10, color:'#c2c8cf' }}>orden {s.orden}</span></>}>
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditing(s)}>Editar</button>
              <button className="adm-btn adm-btn-danger" onClick={() => remove(s)}>Borrar</button>
            </Row>
          ))}
        </div>
      )}
      {editing && <SucursalForm suc={editing==='new'?null:editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </>
  )
}

function SucursalForm({ suc, onClose, onSaved }) {
  const init = suc || { nombre:'', badge:'', subtitulo:'', direccion:'', horario:'Todos los días de 8am a 5pm', telefono:'', whatsapp:'', orden:0 }
  const [f, setF] = useState({ ...init })
  const [saving, setSaving] = useState(false); const [err, setErr] = useState('')
  const set = (k,v) => setF((s)=>({ ...s, [k]:v }))
  async function save(e) {
    e.preventDefault(); setSaving(true); setErr('')
    const payload = {
      nombre:f.nombre.trim(), badge:f.badge?.trim()||null, subtitulo:f.subtitulo?.trim()||null,
      direccion:f.direccion?.trim()||null, horario:f.horario?.trim()||null,
      telefono:f.telefono?.trim()||null, whatsapp:f.whatsapp?.trim()||null, orden:Number(f.orden)||0,
    }
    const q = suc ? supabase.from('pesc_sucursales').update(payload).eq('id', suc.id) : supabase.from('pesc_sucursales').insert(payload)
    const { error } = await q
    if (error) { setErr('Error: '+error.message); setSaving(false); return }
    onSaved()
  }
  return (
    <Modal title={suc ? 'Editar sucursal' : 'Nueva sucursal'} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Nombre"><input className="adm-input" value={f.nombre} onChange={(e)=>set('nombre',e.target.value)} required /></Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Etiqueta (badge)"><input className="adm-input" value={f.badge||''} onChange={(e)=>set('badge',e.target.value)} placeholder="Mariscos" /></Field>
          <Field label="Subtítulo"><input className="adm-input" value={f.subtitulo||''} onChange={(e)=>set('subtitulo',e.target.value)} /></Field>
        </div>
        <Field label="Dirección"><input className="adm-input" value={f.direccion||''} onChange={(e)=>set('direccion',e.target.value)} /></Field>
        <Field label="Horario"><input className="adm-input" value={f.horario||''} onChange={(e)=>set('horario',e.target.value)} /></Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Teléfono (mostrado)"><input className="adm-input" value={f.telefono||''} onChange={(e)=>set('telefono',e.target.value)} placeholder="662 262 0690" /></Field>
          <Field label="WhatsApp (solo números)"><input className="adm-input" value={f.whatsapp||''} onChange={(e)=>set('whatsapp',e.target.value)} placeholder="526622620690" /></Field>
        </div>
        <Field label="Orden"><input className="adm-input" type="number" value={f.orden} onChange={(e)=>set('orden',e.target.value)} /></Field>
        {err && <p style={{ color:'#B73A44', font:"600 12px 'Poppins'" }}>{err}</p>}
        <FormButtons onClose={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

/* ---------------- TEXTOS DEL SITIO (config) ---------------- */
function TextosTab({ onSection }) {
  const [d, setD] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('pesc_config').select('data').eq('id', 1).maybeSingle().then(({ data }) => setD(data?.data || {}))
  }, [])

  if (!d) return <p style={{ color:'#9AA49A' }}>Cargando…</p>

  // helpers de edición inmutable por sección
  const sec = (k) => d[k] || {}
  const setSec = (k, patch) => setD((s) => ({ ...s, [k]: { ...(s[k] || {}), ...patch } }))

  async function save() {
    setSaving(true); setMsg('')
    const { error } = await supabase.from('pesc_config').update({ data: d }).eq('id', 1)
    setSaving(false)
    setMsg(error ? 'Error: ' + error.message : '✓ Guardado. Se refleja en la vista previa al instante.')
  }

  const hero = sec('hero'), promos = sec('promos_heading'), bl = sec('boneless')
  const menu = sec('menu'), nos = sec('nosotros'), gal = sec('galeria'), cta = sec('cta'), gen = sec('general'), foot = sec('footer')

  return (
    <div>
      <TabHeader titulo="Textos del sitio" sub="Encabezados, textos e imágenes de fondo de cada sección." />

      <Card t="General" section="nav" onSection={onSection}>
        <Field label="WhatsApp principal (solo números, con lada país)"><input className="adm-input" value={gen.whatsapp||''} onChange={(e)=>setSec('general',{whatsapp:e.target.value})} placeholder="526622620690" /></Field>
      </Card>

      <Card t="Hero (portada)" section="hero" onSection={onSection}>
        <Field label="Etiqueta superior"><input className="adm-input" value={hero.badge||''} onChange={(e)=>setSec('hero',{badge:e.target.value})} /></Field>
        <Field label="Título (una línea por renglón)">
          <textarea className="adm-input" rows={3} value={(hero.titulo_lineas||[]).join('\n')} onChange={(e)=>setSec('hero',{titulo_lineas:e.target.value.split('\n')})} />
        </Field>
        <Field label="Subtítulo"><textarea className="adm-input" rows={2} value={hero.subtitulo||''} onChange={(e)=>setSec('hero',{subtitulo:e.target.value})} /></Field>
        <Field label="Imagen de fondo"><ImageUpload value={hero.imagen_url} onChange={(u)=>setSec('hero',{imagen_url:u})} ratio="16 / 9" /></Field>
      </Card>

      <Card t="Cinta de precios (ticker)" section="ticker" onSection={onSection}>
        <Field label="Frases (una por renglón)">
          <textarea className="adm-input" rows={5} value={(d.ticker||[]).join('\n')} onChange={(e)=>setD((s)=>({ ...s, ticker:e.target.value.split('\n').filter(Boolean) }))} />
        </Field>
      </Card>

      <Card t="Encabezado de Promociones" section="promociones" onSection={onSection}>
        <Field label="Etiqueta"><input className="adm-input" value={promos.eyebrow||''} onChange={(e)=>setSec('promos_heading',{eyebrow:e.target.value})} /></Field>
        <Field label="Título"><input className="adm-input" value={promos.titulo||''} onChange={(e)=>setSec('promos_heading',{titulo:e.target.value})} /></Field>
        <Field label="Subtítulo"><input className="adm-input" value={promos.subtitulo||''} onChange={(e)=>setSec('promos_heading',{subtitulo:e.target.value})} /></Field>
      </Card>

      <Card t="Bloque Boneless" section="boneless" onSection={onSection}>
        <Field label="Título"><input className="adm-input" value={bl.titulo||''} onChange={(e)=>setSec('boneless',{titulo:e.target.value})} /></Field>
        <Field label="Subtítulo"><input className="adm-input" value={bl.subtitulo||''} onChange={(e)=>setSec('boneless',{subtitulo:e.target.value})} /></Field>
        <Field label="Imagen"><ImageUpload value={bl.imagen_url} onChange={(u)=>setSec('boneless',{imagen_url:u})} ratio="1 / 1" /></Field>
        <label className="adm-label">Precios</label>
        {(bl.precios||[]).map((p, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:8 }}>
            <input className="adm-input" value={p.k} placeholder="Pescado" onChange={(e)=>setSec('boneless',{precios:bl.precios.map((x,j)=>j===i?{...x,k:e.target.value}:x)})} />
            <input className="adm-input" value={p.v} placeholder="$245" onChange={(e)=>setSec('boneless',{precios:bl.precios.map((x,j)=>j===i?{...x,v:e.target.value}:x)})} />
            <button type="button" className="adm-btn adm-btn-danger" onClick={()=>setSec('boneless',{precios:bl.precios.filter((_,j)=>j!==i)})}>×</button>
          </div>
        ))}
        <button type="button" className="adm-btn adm-btn-ghost" onClick={()=>setSec('boneless',{precios:[...(bl.precios||[]),{k:'',v:''}]})}>+ Agregar precio</button>
      </Card>

      <Card t='Encabezado "Del mar a tu mesa"' section="menu" onSection={onSection}>
        <Field label="Etiqueta"><input className="adm-input" value={menu.eyebrow||''} onChange={(e)=>setSec('menu',{eyebrow:e.target.value})} /></Field>
        <Field label="Título"><input className="adm-input" value={menu.titulo||''} onChange={(e)=>setSec('menu',{titulo:e.target.value})} /></Field>
        <Field label="Subtítulo"><textarea className="adm-input" rows={2} value={menu.subtitulo||''} onChange={(e)=>setSec('menu',{subtitulo:e.target.value})} /></Field>
      </Card>

      <Card t="Sección Nosotros" section="nosotros" onSection={onSection}>
        <Field label="Etiqueta"><input className="adm-input" value={nos.eyebrow||''} onChange={(e)=>setSec('nosotros',{eyebrow:e.target.value})} /></Field>
        <Field label="Título"><input className="adm-input" value={nos.titulo||''} onChange={(e)=>setSec('nosotros',{titulo:e.target.value})} /></Field>
        <Field label="Párrafo 1"><textarea className="adm-input" rows={2} value={nos.p1||''} onChange={(e)=>setSec('nosotros',{p1:e.target.value})} /></Field>
        <Field label="Párrafo 2"><textarea className="adm-input" rows={2} value={nos.p2||''} onChange={(e)=>setSec('nosotros',{p2:e.target.value})} /></Field>
        <Field label="Imagen"><ImageUpload value={nos.imagen_url} onChange={(u)=>setSec('nosotros',{imagen_url:u})} ratio="4 / 5" /></Field>
        <label className="adm-label">Estadísticas</label>
        {(nos.stats||[]).map((st, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr auto', gap:8, marginBottom:8 }}>
            <input className="adm-input" value={st.num} placeholder="7" onChange={(e)=>setSec('nosotros',{stats:nos.stats.map((x,j)=>j===i?{...x,num:e.target.value}:x)})} />
            <input className="adm-input" value={st.label} placeholder="Días a la semana" onChange={(e)=>setSec('nosotros',{stats:nos.stats.map((x,j)=>j===i?{...x,label:e.target.value}:x)})} />
            <button type="button" className="adm-btn adm-btn-danger" onClick={()=>setSec('nosotros',{stats:nos.stats.filter((_,j)=>j!==i)})}>×</button>
          </div>
        ))}
        <button type="button" className="adm-btn adm-btn-ghost" onClick={()=>setSec('nosotros',{stats:[...(nos.stats||[]),{num:'',label:''}]})}>+ Agregar estadística</button>
      </Card>

      <Card t="Encabezado de Galería" section="galeria" onSection={onSection}>
        <Field label="Etiqueta"><input className="adm-input" value={gal.eyebrow||''} onChange={(e)=>setSec('galeria',{eyebrow:e.target.value})} /></Field>
        <Field label="Título"><input className="adm-input" value={gal.titulo||''} onChange={(e)=>setSec('galeria',{titulo:e.target.value})} /></Field>
      </Card>

      <Card t="Llamado final (CTA)" section="cta" onSection={onSection}>
        <Field label="Título"><input className="adm-input" value={cta.titulo||''} onChange={(e)=>setSec('cta',{titulo:e.target.value})} /></Field>
        <Field label="Texto"><textarea className="adm-input" rows={2} value={cta.texto||''} onChange={(e)=>setSec('cta',{texto:e.target.value})} /></Field>
      </Card>

      <Card t="Pie de página" section="footer" onSection={onSection}>
        <Field label="Texto"><input className="adm-input" value={foot.texto||''} onChange={(e)=>setSec('footer',{texto:e.target.value})} /></Field>
      </Card>

      <div style={{ position:'sticky', bottom:0, background:'#F3F4F6', padding:'16px 0', display:'flex', alignItems:'center', gap:14 }}>
        <button className="adm-btn" onClick={save} disabled={saving}>{saving ? <span className="spin" /> : 'Guardar cambios'}</button>
        {msg && <span style={{ font:"600 13px 'Poppins'", color: msg.startsWith('Error') ? '#B73A44' : '#2e8b57' }}>{msg}</span>}
      </div>
    </div>
  )
}

function Card({ t, section, onSection, children }) {
  const notify = () => { if (section && onSection) onSection(section) }
  return (
    <div onFocusCapture={notify} onClickCapture={notify}
      style={{ background:'#fff', borderRadius:14, padding:'22px 22px 24px', marginBottom:16, boxShadow:'0 6px 18px -14px rgba(23,52,112,.3)' }}>
      <h3 style={{ font:"700 15px 'Poppins'", color:'#004AAC', margin:'0 0 16px' }}>{t}</h3>
      {children}
    </div>
  )
}

function FormButtons({ onClose, saving }) {
  return (
    <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
      <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="adm-btn" disabled={saving}>{saving ? <span className="spin" /> : 'Guardar'}</button>
    </div>
  )
}
