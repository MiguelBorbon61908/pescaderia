import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'

// Hook: revela elementos [data-reveal] al entrar en viewport
function useReveal(dep) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target) }
      }),
      { threshold: 0.12 }
    )
    el.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [dep])
  return ref
}

function money(n) {
  if (n == null) return ''
  return '$' + Number(n).toLocaleString('es-MX')
}

const SECTION_LABELS = {
  nav: 'Barra / WhatsApp', hero: 'Portada (Hero)', ticker: 'Cinta de precios',
  promociones: 'Promociones', boneless: 'Bloque Boneless', menu: 'Del mar a tu mesa',
  nosotros: 'Nosotros', galeria: 'Galería', sucursales: 'Sucursales', cta: 'Llamado final', footer: 'Pie de página',
}

// Desplaza a la sección y dibuja un recuadro-etiqueta temporal encima
function highlightSection(section) {
  const el = document.querySelector(`[data-section="${section}"]`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })

  document.querySelectorAll('.pesc-hl-overlay').forEach((n) => n.remove())
  const r = el.getBoundingClientRect()
  const ov = document.createElement('div')
  ov.className = 'pesc-hl-overlay'
  Object.assign(ov.style, {
    position: 'absolute',
    top: (r.top + window.scrollY - 6) + 'px',
    left: (r.left + window.scrollX - 6) + 'px',
    width: (r.width + 12) + 'px',
    height: (r.height + 12) + 'px',
    border: '3px solid #B73A44',
    borderRadius: '12px',
    boxShadow: '0 0 0 4px rgba(183,58,68,.18)',
    pointerEvents: 'none',
    zIndex: 9999,
    animation: 'hlPulse 1.1s ease-in-out 2',
  })
  const chip = document.createElement('div')
  chip.textContent = '✏️ ' + (SECTION_LABELS[section] || section)
  Object.assign(chip.style, {
    position: 'absolute', top: '-14px', left: '12px',
    background: '#B73A44', color: '#fff', font: "700 12px 'Poppins',sans-serif",
    padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap',
    boxShadow: '0 6px 16px -6px rgba(183,58,68,.6)',
  })
  ov.appendChild(chip)
  document.body.appendChild(ov)
  clearTimeout(highlightSection._t)
  ov.style.transition = 'opacity .5s ease'
  highlightSection._t = setTimeout(() => {
    ov.style.opacity = '0'
    setTimeout(() => ov.remove(), 500)
  }, 2600)
}

const BADGE_COLORS = ['#65AAD0', '#B28E57']

function PromoCard({ o, i }) {
  return (
    <div className="promo-card" data-reveal
      style={{ background:'#fff', borderRadius:14, overflow:'hidden',
        boxShadow:'0 10px 24px -14px rgba(23,52,112,.25)', transitionDelay:`${i*0.06}s` }}>
      <div style={{ height:170, overflow:'hidden' }}>
        <img src={o.imagen_url || '/img/logo.png'} alt={o.titulo}
          style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      </div>
      <div style={{ padding:'18px 18px 20px' }}>
        <h3 style={{ font:"700 15px 'Poppins'", color:'#173470', margin:'0 0 6px' }}>{o.titulo}</h3>
        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
          {o.precio_antes != null && (
            <span style={{ font:"600 13px 'Poppins'", color:'#9AA49A', textDecoration:'line-through' }}>{money(o.precio_antes)}</span>
          )}
          <span style={{ font:"400 30px 'Anton',sans-serif", color:'#B28E57' }}>
            {money(o.precio_ahora)}<span style={{ font:"600 12px 'Poppins'", color:'#9AA49A' }}>{o.unidad}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [cfg, setCfg] = useState(null)
  const [ofertas, setOfertas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [galeria, setGaleria] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function loadAll() {
      const [c, o, cat, gal, suc] = await Promise.all([
        supabase.from('pesc_config').select('data').eq('id', 1).maybeSingle(),
        supabase.from('pesc_ofertas').select('*').eq('activa', true).order('orden', { ascending: true }),
        supabase.from('pesc_categorias').select('*').order('orden', { ascending: true }),
        supabase.from('pesc_galeria').select('*').order('orden', { ascending: true }),
        supabase.from('pesc_sucursales').select('*').order('orden', { ascending: true }),
      ])
      if (!alive) return
      setCfg(c.data?.data || {})
      setOfertas(o.data || [])
      setCategorias(cat.data || [])
      setGaleria(gal.data || [])
      setSucursales(suc.data || [])
      setLoading(false)
    }
    loadAll()

    // Realtime: cualquier cambio del admin recarga el contenido en vivo
    const channel = supabase
      .channel('pesc-contenido')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesc_ofertas' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesc_config' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesc_categorias' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesc_galeria' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesc_sucursales' }, loadAll)
      .subscribe()

    return () => { alive = false; supabase.removeChannel(channel) }
  }, [])

  // Resalte contextual: el panel admin envía qué sección se está editando
  useEffect(() => {
    function onMsg(ev) {
      const m = ev.data
      if (!m || m.type !== 'pesc-highlight') return
      highlightSection(m.section)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const containerRef = useReveal(loading)

  if (loading || !cfg) {
    return <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', color:'#9AA49A', fontFamily:"'Poppins',sans-serif" }}>Cargando…</div>
  }

  const g = cfg.general || {}
  const wa = `https://wa.me/${g.whatsapp || '526622620690'}?text=Hola%2C%20quiero%20hacer%20un%20pedido`
  const hero = cfg.hero || {}
  const ph = cfg.promos_heading || {}
  const bl = cfg.boneless || {}
  const menu = cfg.menu || {}
  const nos = cfg.nosotros || {}
  const galH = cfg.galeria || {}
  const cta = cfg.cta || {}
  const footer = cfg.footer || {}
  const ticker = (cfg.ticker && cfg.ticker.length ? cfg.ticker : ['MARISCOS FRESCOS'])

  return (
    <div ref={containerRef} style={{ background:'#F3F4F6', overflowX:'clip' }}>

      {/* NAV */}
      <div data-section="nav" style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 5vw', background:'rgba(243,244,246,.9)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(23,52,112,.08)' }}>
        <img src="/img/logo.png" style={{ height:44, objectFit:'contain' }} alt="Pescadería Álvarez" />
        <div style={{ display:'flex', alignItems:'center', gap:28 }}>
          <a href="#promociones" className="navlink">Promociones</a>
          <a href="#menu" className="navlink">Menú</a>
          <a href="#sucursales" className="navlink">Sucursales</a>
          <a href="#nosotros" className="navlink">Nosotros</a>
          <a href={wa} target="_blank" rel="noreferrer" className="cta-btn" style={{ font:"700 12px 'Poppins'", color:'#fff', background:'#B73A44', padding:'11px 20px', borderRadius:24, animation:'pulseGlow 2.8s ease-in-out infinite' }}>WhatsApp</a>
        </div>
      </div>

      {/* HERO */}
      <div data-section="hero" style={{ position:'relative', height:'88vh', minHeight:560, overflow:'hidden' }}>
        <img src={hero.imagen_url || '/img/hero.png'} alt="Botana de mariscos Álvarez" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', animation:'kenBurns 18s ease-in-out infinite alternate' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,#0a1730 8%,rgba(10,23,48,.55) 50%,rgba(10,23,48,.15) 100%)' }} />
        <div style={{ position:'absolute', left:'5vw', right:'5vw', bottom:64, zIndex:1, maxWidth:640 }}>
          <span style={{ display:'inline-block', font:"700 11px 'Poppins'", letterSpacing:'.14em', textTransform:'uppercase', color:'#dcb877', border:'1px solid rgba(220,184,119,.6)', padding:'6px 14px', borderRadius:20, opacity:0, animation:'fadeUp .6s ease-out .1s forwards' }}>{hero.badge}</span>
          <h1 style={{ font:"400 clamp(40px,7vw,84px)/.92 'Anton',sans-serif", color:'#fff', textTransform:'uppercase', margin:'18px 0 6px', opacity:0, animation:'fadeUp .7s ease-out .25s forwards' }}>
            {(hero.titulo_lineas || ['Fresco.','Directo.','Hoy.']).map((l, i) => <span key={i}>{l}<br/></span>)}
          </h1>
          <div style={{ height:4, background:'#B28E57', borderRadius:2, margin:'14px 0 18px', animation:'drawLine 1s ease-out .9s forwards', width:0 }} />
          <p style={{ font:"400 16px/1.55 'Poppins'", color:'#e7e4dc', maxWidth:400, margin:'0 0 26px', opacity:0, animation:'fadeUp .6s ease-out .5s forwards' }}>{hero.subtitulo}</p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', opacity:0, animation:'fadeUp .6s ease-out .65s forwards' }}>
            <a href={wa} target="_blank" rel="noreferrer" className="cta-btn" style={{ display:'inline-block', font:"700 13px 'Poppins'", color:'#0a1730', background:'#fff', padding:'15px 28px', borderRadius:2 }}>Pedir por WhatsApp →</a>
            <a href="#promociones" className="cta-btn" style={{ display:'inline-block', font:"700 13px 'Poppins'", color:'#fff', border:'1.5px solid rgba(255,255,255,.6)', padding:'15px 28px', borderRadius:2 }}>Ver promociones</a>
          </div>
        </div>
        <div data-section="ticker" style={{ position:'absolute', left:0, right:0, bottom:0, zIndex:1, background:'#173470', overflow:'hidden', padding:'11px 0' }}>
          <div style={{ display:'flex', gap:44, whiteSpace:'nowrap', animation:'marquee 16s linear infinite', font:"700 12px 'Poppins'", color:'#dcb877', letterSpacing:'.04em' }}>
            {Array(2).fill(0).map((_, k) => (
              <span key={k} style={{ display:'flex', gap:44 }}>
                {ticker.map((t, i) => <span key={i} style={{ display:'flex', gap:44 }}><span>{t}</span><span>·</span></span>)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PROMOCIONES */}
      <div id="promociones" data-section="promociones" style={{ padding:'100px 5vw 80px', maxWidth:1280, margin:'0 auto' }}>
        <div data-reveal style={{ textAlign:'center', marginBottom:12 }}>
          <span style={{ font:"700 11px 'Poppins'", letterSpacing:'.14em', textTransform:'uppercase', color:'#B73A44' }}>{ph.eyebrow}</span>
          <h2 style={{ font:"400 44px/1.02 'Anton',sans-serif", color:'#173470', textTransform:'uppercase', margin:'10px 0 8px' }}>{ph.titulo}</h2>
          <p style={{ font:"500 13px 'Poppins'", color:'#9AA49A', margin:0 }}>{ph.subtitulo}</p>
        </div>

        {ofertas.length === 0 ? (
          <p style={{ textAlign:'center', color:'#9AA49A', marginTop:48 }}>Pronto nuevas promociones. Escríbenos por WhatsApp.</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:22, marginTop:48 }}>
            {ofertas.map((o, i) => <PromoCard key={o.id} o={o} i={i} />)}
          </div>
        )}

        {/* Boneless highlight */}
        <div data-reveal data-section="boneless" style={{ marginTop:26, background:'#173470', borderRadius:18, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1.2fr', alignItems:'stretch' }}>
          <div style={{ position:'relative', minHeight:220 }}>
            <img src={bl.imagen_url || '/img/boneless.png'} alt="Boneless 3 salsas" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
          <div style={{ padding:'30px 34px', display:'flex', flexDirection:'column', justifyContent:'center', gap:14 }}>
            <div>
              <h3 style={{ font:"400 30px 'Anton',sans-serif", color:'#fff', textTransform:'uppercase', margin:'0 0 4px' }}>{bl.titulo}</h3>
              <p style={{ font:"500 12px 'Poppins'", color:'#a9bde0', margin:0 }}>{bl.subtitulo}</p>
            </div>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {(bl.precios || []).map((p, i) => (
                <div key={i}>
                  <div style={{ font:"600 11px 'Poppins'", color:'#65AAD0', textTransform:'uppercase', letterSpacing:'.04em' }}>{p.k}</div>
                  <div style={{ font:"400 26px 'Anton',sans-serif", color:'#dcb877' }}>{p.v}<span style={{ font:"600 11px 'Poppins'", color:'#a9bde0' }}>/kg</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MENU / CATEGORIAS */}
      <div id="menu" data-section="menu" style={{ background:'#fff', padding:'90px 5vw' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div data-reveal style={{ textAlign:'center', marginBottom:48 }}>
            <span style={{ font:"700 11px 'Poppins'", letterSpacing:'.14em', textTransform:'uppercase', color:'#004AAC' }}>{menu.eyebrow}</span>
            <h2 style={{ font:"400 44px/1.02 'Anton',sans-serif", color:'#173470', textTransform:'uppercase', margin:'10px 0 8px' }}>{menu.titulo}</h2>
            <p style={{ font:"400 14px/1.6 'Poppins'", color:'#9AA49A', maxWidth:520, margin:'0 auto' }}>{menu.subtitulo}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:26 }}>
            {categorias.map((c, i) => (
              <div key={c.id} data-reveal style={{ borderRadius:16, overflow:'hidden', position:'relative', height:280, transitionDelay:`${i*0.06}s` }}>
                <img src={c.imagen_url || '/img/logo.png'} alt={c.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(10,23,48,.75),transparent 55%)' }} />
                <div style={{ position:'absolute', left:20, bottom:16 }}>
                  <h3 style={{ font:"400 24px 'Anton',sans-serif", color:'#fff', textTransform:'uppercase', margin:0 }}>{c.titulo}</h3>
                  <p style={{ font:"500 12px 'Poppins'", color:'#dbe3f0', margin:'2px 0 0' }}>{c.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOSOTROS */}
      <div id="nosotros" data-section="nosotros" style={{ padding:'100px 5vw', maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
        <div data-reveal style={{ position:'relative' }}>
          <div style={{ position:'absolute', inset:'-16px -16px auto auto', width:'70%', height:'70%', border:'3px solid #B28E57', borderRadius:16, zIndex:0 }} />
          <img src={nos.imagen_url || '/img/mariscos.png'} alt="Producto fresco Álvarez" style={{ width:'100%', borderRadius:16, position:'relative', zIndex:1, boxShadow:'0 24px 48px -20px rgba(23,52,112,.4)', animation:'floatSlow 6s ease-in-out infinite' }} />
        </div>
        <div data-reveal style={{ transitionDelay:'.1s' }}>
          <span style={{ font:"700 11px 'Poppins'", letterSpacing:'.14em', textTransform:'uppercase', color:'#B73A44' }}>{nos.eyebrow}</span>
          <h2 style={{ font:"400 42px/1.05 'Anton',sans-serif", color:'#173470', textTransform:'uppercase', margin:'14px 0 18px' }}>{nos.titulo}</h2>
          <p style={{ font:"400 15px/1.7 'Poppins'", color:'#4b5661', margin:'0 0 16px' }}>{nos.p1}</p>
          <p style={{ font:"400 15px/1.7 'Poppins'", color:'#4b5661', margin:'0 0 26px' }}>{nos.p2}</p>
          <div style={{ display:'flex', gap:28 }}>
            {(nos.stats || []).map((s, i) => (
              <div key={i}><div style={{ font:"400 34px 'Anton',sans-serif", color:'#004AAC' }}>{s.num}</div><div style={{ font:"600 11px 'Poppins'", color:'#9AA49A', textTransform:'uppercase' }}>{s.label}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* GALERÍA */}
      <div data-section="galeria" style={{ background:'#173470', padding:'90px 5vw' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div data-reveal style={{ textAlign:'center', marginBottom:44 }}>
            <span style={{ font:"700 11px 'Poppins'", letterSpacing:'.14em', textTransform:'uppercase', color:'#65AAD0' }}>{galH.eyebrow}</span>
            <h2 style={{ font:"400 40px/1.02 'Anton',sans-serif", color:'#fff', textTransform:'uppercase', margin:'10px 0 0' }}>{galH.titulo}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridAutoRows:150, gap:14 }}>
            {galeria.map((it, i) => (
              <div key={it.id} className="gal-item" data-reveal style={{ borderRadius:12, transitionDelay:`${i*0.05}s`, ...(it.destacado ? { gridColumn:'span 2', gridRow:'span 2' } : {}) }}>
                <img src={it.imagen_url} alt="Galería Álvarez" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUCURSALES */}
      <div id="sucursales" data-section="sucursales" style={{ padding:'100px 5vw', maxWidth:1280, margin:'0 auto' }}>
        <div data-reveal style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ font:"700 11px 'Poppins'", letterSpacing:'.14em', textTransform:'uppercase', color:'#004AAC' }}>Encuéntranos</span>
          <h2 style={{ font:"400 44px/1.02 'Anton',sans-serif", color:'#173470', textTransform:'uppercase', margin:'10px 0 0' }}>Nuestras sucursales</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:26 }}>
          {sucursales.map((s, i) => (
            <div key={s.id} className="branch-card" data-reveal style={{ background:'#fff', borderRadius:16, padding:32, boxShadow:'0 10px 28px -16px rgba(23,52,112,.25)', transitionDelay:`${i*0.08}s` }}>
              {s.badge && <span style={{ font:"700 10px 'Poppins'", letterSpacing:'.08em', textTransform:'uppercase', color:'#fff', background:BADGE_COLORS[i % BADGE_COLORS.length], padding:'5px 12px', borderRadius:20 }}>{s.badge}</span>}
              <h3 style={{ font:"400 26px 'Anton',sans-serif", color:'#173470', textTransform:'uppercase', margin:'16px 0 4px' }}>{s.nombre}</h3>
              {s.subtitulo && <p style={{ font:"500 13px 'Poppins'", color:'#9AA49A', margin:'0 0 18px' }}>{s.subtitulo}</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:10, font:"400 14px/1.5 'Poppins'", color:'#4b5661' }}>
                {s.direccion && <div>📍 {s.direccion}</div>}
                {s.horario && <div>🕗 {s.horario}</div>}
                {s.telefono && <div>📞 <a href={`tel:${s.telefono.replace(/\s/g,'')}`}>{s.telefono}</a></div>}
              </div>
              {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="cta-btn" style={{ display:'inline-block', marginTop:20, font:"700 12px 'Poppins'", color:'#fff', background:'#B73A44', padding:'11px 22px', borderRadius:24 }}>Escribir por WhatsApp</a>}
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div data-reveal data-section="cta" style={{ margin:'0 auto 100px', maxWidth:1280, marginLeft:'auto', marginRight:'auto', background:'linear-gradient(120deg,#004AAC,#173470)', borderRadius:24, padding:'60px 40px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(220,184,119,.35),transparent 70%)', top:-100, right:-60 }} />
        <h2 style={{ position:'relative', font:"400 clamp(30px,5vw,50px)/1.02 'Anton',sans-serif", color:'#fff', textTransform:'uppercase', margin:'0 0 14px' }}>{cta.titulo}</h2>
        <p style={{ position:'relative', font:"400 15px/1.6 'Poppins'", color:'#cfe0f5', maxWidth:420, margin:'0 auto 28px' }}>{cta.texto}</p>
        <a href={wa} target="_blank" rel="noreferrer" className="cta-btn" style={{ position:'relative', display:'inline-block', font:"700 14px 'Poppins'", color:'#0a1730', background:'#fff', padding:'16px 32px', borderRadius:30, animation:'pulseGlow 2.8s ease-in-out infinite' }}>Pedir por WhatsApp →</a>
      </div>

      {/* FOOTER */}
      <div data-section="footer" style={{ background:'#0a1730', padding:'44px 5vw', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <img src="/img/logo.png" alt="Pescadería Álvarez" style={{ height:38, objectFit:'contain', filter:'brightness(0) invert(1)', opacity:.85 }} />
        <p style={{ font:"400 12px 'Poppins'", color:'#8ea2c4', margin:0 }}>{footer.texto} · <a href="/admin" style={{ color:'#8ea2c4' }}>Admin</a></p>
      </div>
    </div>
  )
}
