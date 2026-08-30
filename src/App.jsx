import { useEffect, useRef, useState } from 'react'
import {
  Bird, CalendarCheck, ChevronRight, CircleDollarSign, Download, Egg, HeartPulse, Home, Leaf,
  Menu, MessageCircle, Plus, Search, Settings, Share2, ShoppingBasket, Sparkles, Users, X,
} from 'lucide-react'
import { supabase } from './lib/supabase'

const initialBirds = []

const navItems = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'aves', label: 'Aves', icon: Bird },
  { id: 'reproduccion', label: 'Cría', icon: Egg },
  { id: 'finanzas', label: 'Finanzas', icon: CircleDollarSign },
  { id: 'tareas', label: 'Tareas', icon: CalendarCheck },
]

function App() {
  const publicAviaryId = new URLSearchParams(window.location.search).get('aviario')
  const [session, setSession] = useState(null)
  const sessionRef = useRef(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [activePage, setActivePage] = useState('inicio')
  const [birds, setBirds] = useState(initialBirds)
  const [showBirdForm, setShowBirdForm] = useState(false)
  const [editingBird, setEditingBird] = useState(null)
  const [toast, setToast] = useState('')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [profile, setProfile] = useState({ name: 'Mi aviario', photo: '', whatsapp: '', publish: false })
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      sessionRef.current = data.session
      setSession(data.session)
      setAuthLoading(false)
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) return
        if (!nextSession && sessionRef.current) return
        sessionRef.current = nextSession
        setSession(nextSession)
      })
      cleanupListener = () => listener.subscription.unsubscribe()
    }).catch(() => { if (mounted) setAuthLoading(false) })
    let cleanupListener = () => {}
    return () => { mounted = false; cleanupListener() }
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user) return
    supabase.from('aves').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data?.length) setBirds(data.map((bird) => ({ ...bird, name: bird.nombre || bird.anillo_id, ring: bird.anillo_id, mutation: bird.mutacion, sex: bird.sexo, carrier: bird.portador_recesivo, recessiveGene: bird.gen_recesivo, enVenta: bird.en_venta, color: '#d9c4a8' })))
    })
  }, [session])

  useEffect(() => {
    if (!supabase || !session?.user) return
    supabase.from('aviarios').select('*').eq('user_id', session.user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({ id: data.id, name: data.nombre, photo: data.foto_url || '', whatsapp: data.whatsapp || '', publish: data.publicar_ventas })
    })
  }, [session])

  useEffect(() => {
    const handleInstall = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', handleInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleInstall)
  }, [])

  if (!supabase) return <SetupRequired />
  if (publicAviaryId) return <PublicAviaryPage aviaryId={publicAviaryId} />

  const installApp = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const signOut = async () => {
    sessionRef.current = null
    setSession(null)
    await supabase.auth.signOut()
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-cream text-sm text-moss">Cargando tu aviario...</div>
  if (supabase && !session) return <AuthScreen onAuthenticated={(nextSession) => { sessionRef.current = nextSession; setSession(nextSession) }} />

  const navigate = (page) => setActivePage(page)
  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const addBird = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const newBird = {
      id: Date.now(), name: form.get('name'), ring: form.get('ring'), species: form.get('species'),
      mutation: form.get('mutation') || 'Sin especificar', sex: form.get('sex'), carrier: form.get('carrier'), recessiveGene: form.get('recessiveGene'), enVenta: form.get('enVenta') === 'on', photoFile: form.get('photoFile'), color: '#d9c4a8',
    }
    if (supabase && session?.user) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.user) { showToast('No se pudo confirmar tu acceso. Cierra sesión y vuelve a entrar.'); return }
      const userId = sessionData.session.user.id
      if (!userId) { showToast('No se encontró tu usuario. Cierra sesión y vuelve a entrar.'); return }
      const { data, error } = editingBird
        ? await supabase.from('aves').update({ nombre: newBird.name, anillo_id: newBird.ring, especie: newBird.species, mutacion: newBird.mutation, sexo: newBird.sex, portador_recesivo: newBird.carrier, gen_recesivo: newBird.recessiveGene || null, en_venta: newBird.enVenta }).eq('id', editingBird.id).eq('user_id', userId).select().single()
        : await supabase.rpc('crear_ave', { p_nombre: newBird.name, p_anillo_id: newBird.ring, p_especie: newBird.species, p_mutacion: newBird.mutation, p_sexo: newBird.sex, p_portador_recesivo: newBird.carrier, p_gen_recesivo: newBird.recessiveGene || null, p_en_venta: newBird.enVenta })
      if (error) { showToast(error.message.includes('function') ? 'Falta activar la función de guardado. Ejecuta repair-aves-definitivo.sql en Supabase.' : error.message.includes('JWT') ? 'Tu acceso expiró. Cierra sesión y vuelve a entrar.' : `No se pudo guardar el ave: ${error.message}`); return }
      let photoUrl = null
      if (newBird.photoFile) {
        const path = `${userId}/ave-${data.id}-${newBird.photoFile.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
        const { error: uploadError } = await supabase.storage.from('fotos-aves').upload(path, newBird.photoFile, { upsert: true, contentType: newBird.photoFile.type })
        if (uploadError) showToast(uploadError.message.includes('Bucket not found') ? 'Ave guardada. Falta crear fotos-aves para subir la imagen.' : `Ave guardada, pero no se pudo subir la foto: ${uploadError.message}`)
        else { photoUrl = supabase.storage.from('fotos-aves').getPublicUrl(path).data.publicUrl; await supabase.from('aves').update({ foto_url: photoUrl }).eq('id', data.id).eq('user_id', userId) }
      }
      setBirds((current) => editingBird ? current.map((bird) => bird.id === editingBird.id ? { ...bird, ...data, ...newBird, foto_url: photoUrl || bird.foto_url } : bird) : [{ ...data, ...newBird, foto_url: photoUrl }, ...current])
    } else setBirds((current) => [newBird, ...current])
    setShowBirdForm(false)
    setEditingBird(null)
    showToast(editingBird ? 'Ave actualizada correctamente' : 'Ave registrada correctamente')
  }

  return (
    <div className="min-h-screen bg-cream page-grain pb-24 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#dce5d8] bg-[#f8faf6] px-5 py-7 lg:flex">
        <Brand />
        <nav className="mt-12 space-y-1">
          {navItems.map((item) => <NavButton key={item.id} item={item} active={activePage === item.id} onClick={() => navigate(item.id)} />)}
        </nav>
        <div className="mt-auto rounded-2xl bg-sage/60 p-4">
          <Sparkles size={18} className="text-moss" />
          <p className="mt-3 text-sm font-semibold">Tu aviario, en orden</p>
          <p className="mt-1 text-xs leading-5 text-moss">Registra cada detalle sin soltar el ritmo del día.</p>
        </div>
        <button className="mt-5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-moss hover:bg-sage/50" onClick={() => setShowSettings(true)}><Settings size={17} /> Ajustes</button>
        {session && <button className="mt-2 px-3 py-2 text-left text-xs font-semibold text-coral" onClick={signOut}>Cerrar sesión</button>}
      </aside>

      <main className="mx-auto max-w-6xl lg:ml-64">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
          <div className="lg:hidden"><Brand compact /></div>
          <div className="hidden lg:block"><p className="text-sm font-medium text-moss">{formatToday()}</p><h1 className="mt-1 font-display text-3xl">{getGreeting()}, Val</h1></div>
          <div className="relative flex items-center gap-3">{installPrompt && <button aria-label="Instalar aplicación" title="Instalar aplicación" className="icon-button" onClick={installApp}><Download size={19} /></button>}<button aria-label="Buscar" className="icon-button" onClick={() => { setSearchOpen((current) => !current); setMobileMenuOpen(false) }}><Search size={19} /></button><button aria-label="Menú" className="icon-button lg:hidden" onClick={() => { setMobileMenuOpen((current) => !current); setSearchOpen(false) }}><Menu size={19} /></button><button aria-label="Perfil" className="avatar" title={session?.user.email || 'Modo demo'} onClick={() => setProfileOpen((current) => !current)}>{session?.user.email?.[0]?.toUpperCase() || 'V'}</button>{profileOpen && <ProfileMenu session={session} onSettings={() => { setShowSettings(true); setProfileOpen(false) }} onClose={signOut} />}</div>
        </header>
        {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} onNavigate={(page) => { setActivePage(page); setSearchOpen(false) }} />}
        {mobileMenuOpen && <MobileMenu activePage={activePage} onNavigate={(page) => { setActivePage(page); setMobileMenuOpen(false) }} />}
        <div className="px-5 sm:px-8 lg:px-12"><PageContent activePage={activePage} birds={birds} onNavigate={navigate} onAdd={() => { setEditingBird(null); setShowBirdForm(true) }} onEdit={(bird) => { setEditingBird(bird); setShowBirdForm(true) }} onToast={showToast} /></div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-[#dce5d8] bg-[#f8faf6]/95 px-2 py-2 backdrop-blur lg:hidden">
        {navItems.map((item) => <NavButton key={item.id} item={item} active={activePage === item.id} onClick={() => navigate(item.id)} mobile />)}
      </nav>
      {showBirdForm && <BirdForm bird={editingBird} onClose={() => { setShowBirdForm(false); setEditingBird(null) }} onSubmit={addBird} />}
      {showSettings && <SettingsForm profile={profile} onClose={() => setShowSettings(false)} onSave={async (nextProfile) => { let photoUrl = nextProfile.photo; if (supabase && session?.user && nextProfile.photoFile) { const path = `${session.user.id}/aviario-${Date.now()}`; const { error: uploadError } = await supabase.storage.from('fotos-aves').upload(path, nextProfile.photoFile, { upsert: true, contentType: nextProfile.photoFile.type }); if (uploadError) { showToast(uploadError.message.includes('Bucket not found') ? 'No se pudo guardar la foto. Ejecuta repair-storage.sql.' : uploadError.message); return } photoUrl = supabase.storage.from('fotos-aves').getPublicUrl(path).data.publicUrl } if (supabase && session?.user) { const { data, error } = await supabase.rpc('guardar_aviario', { p_nombre: nextProfile.name, p_foto_url: photoUrl || null, p_whatsapp: nextProfile.whatsapp || null, p_publicar_ventas: nextProfile.publish }); if (error) { showToast(error.message.includes('function') ? 'Falta activar el guardado del aviario. Ejecuta repair-aviario-definitivo.sql.' : error.message); return } setProfile({ ...nextProfile, photo: photoUrl, id: data.id }) } else setProfile({ ...nextProfile, photo: photoUrl }); setShowSettings(false); showToast('Cambios guardados correctamente') }} />}
      {toast && <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl lg:bottom-8">{toast}</div>}
    </div>
  )
}

function SetupRequired() {
  return <main className="flex min-h-screen items-center justify-center bg-cream page-grain px-5 py-8"><section className="w-full max-w-lg rounded-3xl border border-[#dce5d8] bg-[#f8faf6] p-6 shadow-[0_12px_40px_rgba(53,78,58,.08)] sm:p-8"><Brand /><p className="eyebrow mt-12">CONFIGURACIÓN PENDIENTE</p><h1 className="mt-2 font-display text-4xl">Conecta tu aviario</h1><p className="mt-3 text-sm leading-6 text-moss">Esta versión ya no usa datos de demostración. Configura Supabase en Vercel para comenzar con una cuenta y guardar tus datos.</p><div className="mt-6 rounded-2xl bg-sage/60 p-4 text-sm leading-6"><p className="font-bold">En Vercel agrega estas variables:</p><p className="mt-2 font-mono text-xs">VITE_SUPABASE_URL</p><p className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</p><p className="mt-3 text-xs text-moss">Después pulsa Redeploy. Al recargar aparecerá Crear una cuenta / Iniciar sesión.</p></div><a className="primary-button mt-6 w-full justify-center" href="https://supabase.com" target="_blank" rel="noreferrer">Abrir Supabase</a></section></main>
}

function GlobalSearch({ onClose, onNavigate }) { return <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-moss bg-white px-4 py-3 shadow-sm sm:mx-8 lg:mx-12"><Search size={18} className="text-moss" /><input autoFocus className="w-full bg-transparent text-sm outline-none" placeholder="Buscar aves, parejas, gastos..." onKeyDown={(event) => { if (event.key === 'Enter') onNavigate('aves'); if (event.key === 'Escape') onClose() }} /><button className="text-xs font-bold text-coral" onClick={onClose}>Cerrar</button></div> }
function MobileMenu({ activePage, onNavigate }) { return <div className="fixed inset-x-0 top-[72px] z-30 border-b border-[#dce5d8] bg-[#f8faf6] p-4 shadow-lg lg:hidden"><div className="space-y-1">{navItems.map((item) => <NavButton key={item.id} item={item} active={activePage === item.id} onClick={() => onNavigate(item.id)} />)}</div></div> }
function ProfileMenu({ session, onSettings, onClose }) { return <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-[#dce5d8] bg-[#f8faf6] p-3 shadow-xl"><p className="px-3 py-2 text-xs text-moss">{session?.user.email || 'Modo demo'}</p><button className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-moss hover:bg-sage" onClick={onSettings}>Personalizar aviario</button>{session && <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-coral hover:bg-[#fae9dd]" onClick={onClose}>Cerrar sesión</button>}</div> }

function PublicAviaryPage({ aviaryId }) {
  const [shared, setShared] = useState(false)
  const [aviary, setAviary] = useState(null)
  const [availableBirds, setAvailableBirds] = useState([])
  useEffect(() => {
    if (!supabase) return
    supabase.from('aviarios').select('*').eq('id', aviaryId).eq('publicar_ventas', true).single().then(async ({ data }) => {
      if (!data) return
      setAviary(data)
      const { data: birds } = await supabase.from('aves').select('*').eq('user_id', data.user_id).eq('en_venta', true).eq('estado', 'activa')
      if (birds) setAvailableBirds(birds.map((bird) => ({ ...bird, name: bird.nombre, ring: bird.anillo_id, species: bird.especie, mutation: bird.mutacion, color: '#d9c4a8' })))
    })
  }, [aviaryId])
  const share = async () => {
    if (navigator.share) await navigator.share({ title: 'Aves disponibles', url: window.location.href })
    else { await navigator.clipboard?.writeText(window.location.href); setShared(true); window.setTimeout(() => setShared(false), 1800) }
  }
  return <main className="min-h-screen bg-cream page-grain px-5 py-8"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between"><Brand compact /><button className="icon-button" onClick={share} title="Compartir catálogo" aria-label="Compartir catálogo"><Share2 size={18} /></button></div><section className="mt-8 overflow-hidden rounded-3xl border border-[#dce5d8] bg-[#f8faf6] shadow-sm"><div className="flex h-44 items-center justify-center bg-sage" style={aviary?.foto_url ? { backgroundImage: `url(${aviary.foto_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>{!aviary?.foto_url && <Bird size={78} className="text-moss/40" />}</div><div className="p-6 sm:p-8"><p className="eyebrow">CATÁLOGO PÚBLICO · {aviary?.nombre || aviaryId}</p><h1 className="mt-2 font-display text-4xl">Aves disponibles</h1><p className="mt-2 text-sm text-moss">Consulta las aves publicadas por este aviario.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{availableBirds.map((bird) => <PublicBirdCard key={bird.id} bird={bird} whatsapp={aviary?.whatsapp} />)}</div></div></section>{shared && <p className="mt-4 text-center text-sm font-semibold text-moss">Enlace copiado.</p>}</div></main>
}

function PublicBirdCard({ bird, whatsapp }) { const message = encodeURIComponent(`Hola, me interesa el ave ${bird.name} (${bird.species}, anillo ${bird.ring}). ¿Sigue disponible?`) ; const phone = whatsapp?.replace(/\D/g, '') || '5490000000000'; return <article className="panel overflow-hidden"><div className="flex h-28 items-center justify-center" style={{ backgroundColor: bird.color }}><Bird size={52} className="text-ink/30" /></div><div className="p-4"><h2 className="font-display text-2xl">{bird.name}</h2><p className="mt-1 text-xs text-moss">{bird.species} · {bird.mutation}</p><a className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-3 py-3 text-sm font-bold text-white" href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Consultar por WhatsApp</a></div></article> }

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    const password = form.get('password')
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (result.error) setMessage(result.error.message.toLowerCase().includes('invalid api key') ? 'La clave de Supabase no es válida. Usa la clave anon public del mismo proyecto.' : result.error.message)
    else if (result.data.session) onAuthenticated(result.data.session)
    else if (mode === 'signup' && !result.data.session) setConfirmationSent(true)
  }

  return <main className="flex min-h-screen items-center justify-center bg-cream page-grain px-5 py-8"><section className="w-full max-w-md rounded-3xl border border-[#dce5d8] bg-[#f8faf6] p-6 shadow-[0_12px_40px_rgba(53,78,58,.08)] sm:p-8"><Brand />{confirmationSent ? <ConfirmationMessage onBack={() => setConfirmationSent(false)} /> : <><p className="eyebrow mt-12">TU AVIARIO PRIVADO</p><h1 className="mt-2 font-display text-4xl">{mode === 'login' ? 'Bienvenido de nuevo' : 'Crear una cuenta'}</h1><p className="mt-3 text-sm leading-6 text-moss">Cada usuario tendrá sus propios registros de aves, crías, gastos y tareas.</p><form onSubmit={submit} className="mt-7"><label>Correo electrónico<input required type="email" name="email" autoComplete="email" placeholder="tu@correo.com" /></label><label className="mt-4">Contraseña<input required minLength="6" type="password" name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Mínimo 6 caracteres" /></label>{message && <p className="mt-4 rounded-xl bg-[#fae9dd] p-3 text-xs font-semibold text-coral">{message}</p>}<button disabled={loading} className="primary-button mt-6 w-full justify-center disabled:opacity-60">{loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}</button></form><button className="mt-5 w-full text-center text-sm font-semibold text-moss" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo una cuenta'}</button></>}</section></main>
}

function ConfirmationMessage({ onBack }) { return <div className="mt-12"><p className="eyebrow">CASI LISTO</p><h1 className="mt-2 font-display text-4xl">Confirma tu correo</h1><p className="mt-4 text-sm leading-6 text-moss">Te enviamos un correo de Supabase. Ábrelo y pulsa el botón de confirmación. Ese enlace te devolverá automáticamente a esta aplicación para activar tu cuenta.</p><div className="mt-6 rounded-2xl bg-sage/60 p-4 text-sm leading-6"><p className="font-bold">Si no lo ves:</p><p className="mt-1">Revisa Spam, Promociones o No deseado. Busca un correo de Supabase.</p></div><button className="primary-button mt-6 w-full justify-center" onClick={onBack}>Volver a iniciar sesión</button></div> }

function SettingsForm({ profile, onClose, onSave }) {
  const [preview, setPreview] = useState(profile.photo)
  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({ name: form.get('name'), photo: preview, photoFile: form.get('photoFile'), whatsapp: form.get('whatsapp'), publish: form.get('publish') === 'on' })
  }
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"><form onSubmit={submit} className="w-full max-w-lg rounded-t-3xl bg-[#f8faf6] p-6 shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between"><div><p className="eyebrow">PERSONALIZACIÓN</p><h2 className="mt-1 font-display text-3xl">Mi aviario</h2></div><button type="button" aria-label="Cerrar" onClick={onClose} className="icon-button"><X size={19} /></button></div><label className="mt-6">Nombre público<input name="name" defaultValue={profile.name} placeholder="Ej. Aviario Los Aromos" /></label><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-moss/40 bg-sage/30 px-4 py-5 text-sm font-semibold text-moss">{preview ? <img src={preview} alt="Vista previa del aviario" className="h-16 w-16 rounded-xl object-cover" /> : <Bird size={20} />} Elegir foto del aviario<input name="photoFile" type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)) }} /></label><label className="mt-4">WhatsApp de contacto<input name="whatsapp" defaultValue={profile.whatsapp} placeholder="56912345678" /></label><label className="mt-5 flex items-center gap-3 rounded-xl bg-sage/50 p-4 text-sm"><input type="checkbox" name="publish" defaultChecked={profile.publish} className="h-4 w-4 accent-moss" /> Mostrar mis aves disponibles para venta</label><p className="mt-3 text-xs leading-5 text-moss">Cuando guardes, podrás compartir tu catálogo desde el botón de compartir.</p><button className="primary-button mt-6 w-full justify-center" type="submit">Guardar cambios</button></form></div>
}

function Brand({ compact = false }) {
  return <div className="flex items-center gap-3"><div className="brand-mark"><Bird size={compact ? 19 : 23} /></div><span className={`font-display font-bold ${compact ? 'text-xl' : 'text-2xl'}`}>aviarii</span></div>
}

function NavButton({ item, active, onClick, mobile }) {
  const Icon = item.icon
  return <button onClick={onClick} className={`${mobile ? 'flex min-w-[58px] flex-col items-center gap-1 py-1 text-[10px]' : 'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm'} ${active ? 'bg-moss font-semibold text-white shadow-sm' : 'text-moss hover:bg-sage/60'}`}><Icon size={mobile ? 19 : 18} /><span>{item.label}</span></button>
}

function PageContent({ activePage, birds, onNavigate, onAdd, onEdit, onToast }) {
  if (activePage === 'aves') return <BirdsPage birds={birds} onAdd={onAdd} onEdit={onEdit} />
  if (activePage === 'reproduccion') return <ReproductionPage birds={birds} onToast={onToast} />
  if (activePage === 'finanzas') return <EmptyFinancePage onToast={onToast} />
  if (activePage === 'tareas') return <EmptyTasksPage onToast={onToast} />
  return <Dashboard birds={birds} onNavigate={onNavigate} />
}

function Dashboard({ birds, onNavigate }) {
  return <section className="animate-rise">
    <div className="mb-8 lg:hidden"><p className="text-sm font-medium text-moss">{formatToday()}</p><h1 className="mt-1 font-display text-3xl">{getGreeting()}, Val</h1></div>
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">RESUMEN DEL AVIARIO</p><h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Todo en calma.</h2><p className="mt-3 max-w-md text-sm leading-6 text-moss">Aquí tienes lo importante para cuidar mejor cada día.</p></div><button className="primary-button self-start sm:self-auto" onClick={() => onNavigate('aves')}><Plus size={18} /> Registrar ave</button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric icon={Bird} label="Aves registradas" value={birds.length} detail="En tu aviario" tone="green" />
      <Metric icon={Users} label="Parejas activas" value="0" detail="Sin registros" tone="peach" />
      <Metric icon={Egg} label="Huevos en curso" value="0" detail="Sin registros" tone="blue" />
      <Metric icon={Sparkles} label="Crías del año" value="0" detail="Sin registros" tone="yellow" />
    </div>
    <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
      <section className="panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">PRÓXIMAS TAREAS</p><h3 className="mt-1 font-display text-2xl">Para hoy</h3></div><button onClick={() => onNavigate('tareas')} className="text-sm font-semibold text-coral">Ver todas</button></div><div className="mt-5 rounded-xl border border-dashed border-[#dce5d8] px-4 py-6 text-center text-sm text-moss">Todavía no tienes tareas pendientes.</div></section>
      <section className="panel overflow-hidden"><div className="bg-moss p-5 text-white sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.18em] text-sage">STOCK DE ALIMENTO</p><h3 className="mt-2 font-display text-3xl">Sin registros</h3></div><Leaf size={30} strokeWidth={1.5} /></div><p className="mt-5 text-sm text-sage">Agrega tu primer alimento para controlar existencias y alertas.</p></div><div className="p-5"><button onClick={() => onNavigate('finanzas')} className="text-sm font-semibold text-coral">Ir a alimentación y gastos</button></div></section>
    </div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2"><MiniCard icon={CircleDollarSign} title="Gastos del mes" value="$ 0" meta="Sin movimientos" /><MiniCard icon={CalendarCheck} title="Actividad reciente" value="0 registros" meta="Empieza agregando datos" /></div>
  </section>
}

function Metric({ icon: Icon, label, value, detail, tone }) { return <div className={`metric metric-${tone}`}><Icon size={19} /><p className="mt-5 text-xs font-medium text-moss">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-[11px] font-semibold text-moss">{detail}</p></div> }
function TaskRow({ title, meta, color }) { return <div className="flex items-center gap-3 rounded-xl border border-[#e4ebe1] px-3 py-3"><span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-${color}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-moss">{meta}</p></div><ChevronRight size={17} className="text-moss" /></div> }
function MiniCard({ icon: Icon, title, value, meta }) { return <div className="panel flex items-center gap-4 p-5"><div className="icon-tile"><Icon size={20} /></div><div><p className="text-xs font-medium text-moss">{title}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="text-xs text-moss">{meta}</p></div></div> }

function BirdsPage({ birds, onAdd, onEdit }) {
  const [query, setQuery] = useState('')
  const filteredBirds = birds.filter((bird) => `${bird.name} ${bird.ring} ${bird.species}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="animate-rise"><div className="mb-7 flex items-end justify-between gap-3"><div><p className="eyebrow">REGISTRO DE AVES</p><h2 className="mt-2 font-display text-4xl">Tus aves</h2><p className="mt-2 text-sm text-moss">{filteredBirds.length} de {birds.length} fichas activas.</p></div><button className="primary-button" onClick={onAdd}><Plus size={18} /><span className="hidden sm:inline">Nueva ave</span><span className="sm:hidden">Añadir</span></button></div><div className="mb-5 flex items-center gap-3 rounded-xl border border-[#dce5d8] bg-white/60 px-4 py-3 text-sm text-moss"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent outline-none placeholder:text-moss/60" placeholder="Buscar por nombre, anillo o especie..." /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredBirds.map((bird) => <BirdCard key={bird.id} bird={bird} onEdit={() => onEdit(bird)} />)}</div>{!filteredBirds.length && <div className="panel p-8 text-center text-sm text-moss">No encontramos aves con esa búsqueda.</div>}</section>
}
function BirdCard({ bird, onEdit }) { return <article className="panel overflow-hidden"><div className="flex h-28 items-center justify-center bg-sage" style={bird.foto_url || bird.photo ? { backgroundImage: `url(${bird.foto_url || bird.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>{!(bird.foto_url || bird.photo) && <Bird size={54} className="text-ink/30" strokeWidth={1.2} />}</div><div className="p-4"><div className="flex items-start justify-between"><div><h3 className="font-display text-2xl">{bird.name}</h3><p className="mt-1 text-xs text-moss">Anillo {bird.ring}</p></div><button className="text-xs font-bold text-coral" onClick={onEdit}>Editar</button></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e4ebe1] pt-3 text-xs"><div><p className="text-moss">Especie</p><p className="mt-1 font-semibold">{bird.species}</p></div><div><p className="text-moss">Sexo</p><p className="mt-1 font-semibold">{bird.sex}</p></div></div><div className="mt-3 rounded-xl bg-[#f8f0d9] px-3 py-2 text-xs"><span className="font-bold text-moss">Genética: </span>{bird.carrier === 'Sí' && bird.recessiveGene ? `Portadora de ${bird.recessiveGene}` : bird.carrier === 'No' ? 'No portadora conocida' : 'Portador por confirmar'}</div></div></article> }

function ReproductionPage({ birds, onToast }) {
  const [eggDate, setEggDate] = useState('')
  const [incubationDays, setIncubationDays] = useState('14')
  const birthDate = eggDate ? addDays(eggDate, Number(incubationDays)) : ''
  const [male, female] = [birds.find((bird) => bird.sex === 'Macho'), birds.find((bird) => bird.sex === 'Hembra')]
  const lima = male
  const coco = female
  const geneticWarning = male?.carrier === 'Sí' && female?.carrier === 'Sí' && male.recessiveGene === female.recessiveGene
  if (!birds.length) return <section className="animate-rise"><p className="eyebrow">CICLO DEL AVIARIO</p><div className="mt-2 flex items-center gap-4"><div className="big-icon big-icon-coral"><Egg size={30} /></div><h2 className="font-display text-4xl">Reproducción</h2></div><div className="panel mt-8 p-8 text-center"><p className="text-sm text-moss">Agrega aves y parejas para comenzar a registrar puestas, huevos y crías.</p></div></section>
  return <section className="animate-rise"><p className="eyebrow">CICLO DEL AVIARIO</p><div className="mt-2 flex items-center gap-4"><div className="big-icon big-icon-coral"><Egg size={30} /></div><h2 className="font-display text-4xl">Reproducción</h2></div><div className="mt-7 grid gap-5 lg:grid-cols-2"><section className="panel p-5 sm:p-6"><p className="eyebrow">CALCULADOR DE ECLOSIÓN</p><h3 className="mt-2 font-display text-2xl">¿Cuándo podría nacer?</h3><p className="mt-2 text-sm leading-6 text-moss">Indica la fecha del primer huevo y los días de incubación de la especie.</p><label className="mt-5">Fecha del huevo<input type="date" value={eggDate} onChange={(event) => setEggDate(event.target.value)} /></label><label className="mt-4">Días de incubación<input type="number" min="1" max="60" value={incubationDays} onChange={(event) => setIncubationDays(event.target.value)} /></label>{birthDate && <div className="mt-5 rounded-xl bg-[#fae9dd] p-4"><p className="text-xs font-bold text-coral">FECHA ESTIMADA</p><p className="mt-1 font-display text-2xl">{formatDate(birthDate)}</p><p className="mt-1 text-xs text-moss">Es una estimación; revisa el huevo y la pareja diariamente.</p></div>}<button className="primary-button mt-5" onClick={() => onToast('Puesta lista para guardar en Supabase')}><Plus size={18} /> Guardar puesta</button></section><section className="panel p-5 sm:p-6"><p className="eyebrow">GUÍA RÁPIDA</p><h3 className="mt-2 font-display text-2xl">Cuidados durante la cría</h3><div className="mt-5 space-y-3"><Tip title="Agua limpia" text="Renueva el agua todos los días y limpia el bebedero." /><Tip title="Calma y observación" text="Evita mover la jaula y revisa sin molestar a la pareja." /><Tip title="Alimentación" text="Mantén alimento fresco y ofrece calcio según la especie." /><Tip title="Señales de alerta" text="Consulta un veterinario si hay apatía, sangrado o rechazo de la cría." /></div></section></div><section className="panel mt-5 p-5 sm:p-6"><p className="eyebrow">GENÉTICA DEL AVIARIO</p><h3 className="mt-2 font-display text-2xl">Ideas de parejas</h3><p className="mt-2 text-sm leading-6 text-moss">Sugerencias iniciales basadas en especie, mutación y portadores. Nunca cruces aves emparentadas.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><PairIdea title="Lima + Coco" text={`Lima: ${lima?.carrier || 'Desconocido'} portadora de ${lima?.recessiveGene || 'gen no indicado'}. Coco: ${coco?.carrier || 'Desconocido'}. Confirma el gen de Coco antes de planear.`} warning={geneticWarning} /><PairIdea title="Nube + otro Agapornis" text="Busca misma especie, sexo confirmado, historial familiar y registra sus genes recesivos." /></div></section></section>
}

function FinancePage({ onToast }) { return <section className="animate-rise"><p className="eyebrow">CONTROL ECONÓMICO</p><div className="mt-2 flex items-center gap-4"><div className="big-icon big-icon-sage"><CircleDollarSign size={30} /></div><h2 className="font-display text-4xl">Finanzas</h2></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><FinanceCard title="Ingresos por ventas" value="$ 420.000" detail="3 aves vendidas este año" tone="green" /><FinanceCard title="Egresos del mes" value="$ 186.400" detail="12 movimientos en agosto" tone="peach" /></div><div className="panel mt-5 p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">MOVIMIENTOS</p><h3 className="mt-2 font-display text-2xl">Últimos registros</h3></div><button className="primary-button" onClick={() => onToast('Selector de movimiento próximamente')}><Plus size={18} /> Registrar</button></div><div className="mt-5 space-y-3"><Movement icon={CircleDollarSign} title="Venta de Agapornis roseicollis" meta="Ingreso · 24 ago" amount="+$ 180.000" positive /><Movement icon={ShoppingBasket} title="Compra de alimento" meta="Egreso · 22 ago" amount="-$ 64.500" /></div></div></section> }
function FinanceCard({ title, value, detail, tone }) { return <div className={`metric metric-${tone}`}><CircleDollarSign size={19} /><p className="mt-5 text-xs font-medium text-moss">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-moss">{detail}</p></div> }
function Movement({ icon: Icon, title, meta, amount, positive }) { return <div className="flex items-center gap-3 border-b border-[#e4ebe1] pb-3"><div className="icon-tile"><Icon size={18} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title}</p><p className="text-xs text-moss">{meta}</p></div><strong className={positive ? 'text-moss' : 'text-coral'}>{amount}</strong></div> }
function Tip({ title, text }) { return <div className="flex gap-3 rounded-xl bg-sage/50 p-3"><HeartPulse size={18} className="mt-0.5 shrink-0 text-moss" /><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-moss">{text}</p></div></div> }
function PairIdea({ title, text, warning }) { return <div className={`rounded-xl border p-4 ${warning ? 'border-coral bg-[#fae9dd]' : 'border-[#e4ebe1]'}`}><div className="flex items-center gap-2"><Users size={17} className="text-coral" /><p className="font-semibold">{title}</p></div><p className="mt-2 text-xs leading-5 text-moss">{text}</p>{warning && <p className="mt-3 text-xs font-bold text-coral">Revisar: ambos podrían portar el mismo gen.</p>}</div> }
function EmptyFinancePage({ onToast }) { return <SimplePage title="Alimentación y gastos" eyebrow="CONTROL ECONÓMICO" icon={ShoppingBasket} accent="sage" text="Todavía no tienes movimientos. Registra tu primera compra, venta o egreso." action="Registrar movimiento" onAction={() => onToast('Formulario de movimientos próximamente')} /> }
function EmptyTasksPage({ onToast }) { return <SimplePage title="Tareas" eyebrow="ORGANIZACIÓN" icon={CalendarCheck} accent="sage" text="Todavía no tienes tareas pendientes. Crea una para organizar el cuidado del aviario." action="Nueva tarea" onAction={() => onToast('Formulario de tareas próximamente')} /> }
function addDays(date, days) { const result = new Date(`${date}T12:00:00`); result.setDate(result.getDate() + days); return result.toISOString().slice(0, 10) }
function formatDate(date) { return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)) }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Buenos días'; if (hour < 19) return 'Buenas tardes'; return 'Buenas noches' }
function formatToday() { return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) }

function SimplePage({ title, eyebrow, icon: Icon, accent, text, action, onAction }) { return <section className="animate-rise"><p className="eyebrow">{eyebrow}</p><div className="mt-2 flex items-center gap-4"><div className={`big-icon big-icon-${accent}`}><Icon size={30} /></div><h2 className="font-display text-4xl">{title}</h2></div><div className="panel mt-8 flex min-h-64 flex-col items-center justify-center p-8 text-center"><div className="icon-tile"><Icon size={23} /></div><p className="mt-5 max-w-sm text-sm leading-6 text-moss">{text}</p><button className="primary-button mt-5" onClick={onAction}><Plus size={18} /> {action}</button></div></section> }
function TasksPage({ onToast }) { return <section className="animate-rise"><p className="eyebrow">ORGANIZACIÓN</p><div className="flex items-end justify-between"><div><h2 className="mt-2 font-display text-4xl">Tareas</h2><p className="mt-2 text-sm text-moss">3 pendientes para cuidar el ritmo.</p></div><button className="primary-button" onClick={() => onToast('Nueva tarea próximamente')}><Plus size={18} /><span className="hidden sm:inline">Nueva tarea</span></button></div><div className="mt-7 space-y-3"><TaskRow title="Revisar pareja Lima + Coco" meta="Hoy · Alta prioridad" color="coral" /><TaskRow title="Aplicar vitaminas a Nube" meta="Mañana · Tratamiento" color="sage" /><TaskRow title="Comprar mijo y mixtura" meta="02 sep · Stock" color="yellow" /></div></section> }

function BirdForm({ onClose, onSubmit }) { const [preview, setPreview] = useState(''); return <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-3 backdrop-blur-sm sm:p-5"><form onSubmit={onSubmit} className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#f8faf6] shadow-2xl"><div className="flex shrink-0 items-center justify-between border-b border-[#e4ebe1] p-5"><div><p className="eyebrow">NUEVO REGISTRO</p><h2 className="mt-1 font-display text-3xl">Añadir un ave</h2></div><button type="button" aria-label="Cerrar" onClick={onClose} className="icon-button"><X size={19} /></button></div><div className="overflow-y-auto p-5"><div className="grid gap-4 sm:grid-cols-2"><label>Nombre<input required name="name" placeholder="Ej. Lima" /></label><label>ID / anillo<input required name="ring" placeholder="Ej. AR-032" /></label><label className="sm:col-span-2">Especie<input required name="species" placeholder="Ej. Diamante mandarín" /></label><label>Mutación<input name="mutation" placeholder="Ej. Pío clásico" /></label><label>Sexo<select name="sex" defaultValue="Indeterminado"><option>Macho</option><option>Hembra</option><option>Indeterminado</option></select></label><label>¿Portador recesivo?<select name="carrier" defaultValue="Desconocido"><option>Sí</option><option>No</option><option>Desconocido</option></select></label><label>Gen recesivo<input name="recessiveGene" placeholder="Ej. Bruno, ino, opal" /></label></div><label className="mt-4 flex items-center gap-3 rounded-xl bg-[#f8f0d9] p-4 text-sm"><input type="checkbox" name="enVenta" className="h-4 w-4 accent-moss" /> Publicar esta ave en el catálogo de venta</label><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-moss/40 bg-sage/30 px-4 py-5 text-sm font-semibold text-moss">{preview ? <img src={preview} alt="Vista previa del ave" className="h-16 w-16 rounded-xl object-cover" /> : <Bird size={19} />} Elegir foto del ave<input name="photoFile" type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)) }} /></label></div><div className="shrink-0 border-t border-[#e4ebe1] bg-[#f8faf6] p-5"><button className="primary-button w-full justify-center" type="submit">Guardar ave</button></div></form></div> }

export default App
