import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const services = [
  {
    number: '01',
    title: 'Ideas que toman forma',
    description: 'Convierte una intuicion en una experiencia visual clara, lista para compartir y hacer crecer.',
    icon: 'auto_awesome',
  },
  {
    number: '02',
    title: 'Trabajo sin interrupciones',
    description: 'Un espacio centralizado para explorar, iterar y mantener cada decision creativa en contexto.',
    icon: 'hub',
  },
  {
    number: '03',
    title: 'Resultados con proposito',
    description: 'Herramientas inteligentes que respetan tu criterio y aceleran el camino hasta la version final.',
    icon: 'track_changes',
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (email.trim()) setSent(true);
  };

  return (
    <div className="landing-shell min-h-screen overflow-hidden">
      <style>{`
        .landing-shell { background: #071014; color: #edf5f2; font-family: Inter, sans-serif; }
        .landing-shell .landing-display { font-family: Inter, sans-serif; letter-spacing: -0.04em; }
        .landing-shell .landing-grid { background-image: linear-gradient(rgba(127, 170, 158, .08) 1px, transparent 1px), linear-gradient(90deg, rgba(127, 170, 158, .08) 1px, transparent 1px); background-size: 42px 42px; }
        .landing-shell .landing-glow { background: radial-gradient(circle, rgba(181, 255, 103, .22), transparent 68%); }
        .landing-shell .landing-card { background: rgba(13, 28, 31, .82); border: 1px solid rgba(157, 202, 186, .18); }
        .landing-shell .landing-line { border-color: rgba(157, 202, 186, .18); }
        .landing-shell .landing-link { color: #b7c9c3; transition: color .2s ease; }
        .landing-shell .landing-link:hover { color: #c7ff75; }
        .landing-shell .landing-button { background: #c7ff75; color: #071014; transition: transform .2s ease, box-shadow .2s ease; }
        .landing-shell .landing-button:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(199, 255, 117, .2); }
        .landing-shell .landing-button:focus-visible, .landing-shell a:focus-visible, .landing-shell input:focus-visible { outline: 2px solid #c7ff75; outline-offset: 3px; }
        .landing-shell .landing-input { background: rgba(7, 16, 20, .7); border: 1px solid rgba(157, 202, 186, .28); color: #edf5f2; }
        .landing-shell .landing-input::placeholder { color: #78918a; }
      `}</style>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="#inicio" className="flex items-center gap-3" aria-label="CanvasAI, ir al inicio">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c7ff75] text-[#071014]">
            <span className="material-symbols-outlined">flare</span>
          </span>
          <span className="text-lg font-bold tracking-tight">Canvas<span className="text-[#c7ff75]">AI</span></span>
        </a>
        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Navegacion principal">
          <a className="landing-link" href="#servicios">A que nos dedicamos</a>
          <a className="landing-link" href="#nosotros">Sobre nosotros</a>
          <a className="landing-link" href="#contacto">Contacto</a>
        </nav>
        <button type="button" onClick={() => navigate('/login')} className="landing-button rounded-lg px-4 py-2.5 text-sm font-bold">
          Iniciar sesion
        </button>
      </header>

      <main id="inicio">
        <section className="relative isolate mx-auto min-h-[630px] max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pt-28">
          <div className="landing-grid absolute inset-0 -z-10 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="landing-glow absolute -right-32 top-10 -z-10 h-[520px] w-[520px] rounded-full blur-3xl" />
          <div className="max-w-4xl">
            <p className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#c7ff75]"><span className="h-px w-8 bg-[#c7ff75]" /> Estudio creativo aumentado</p>
            <h1 className="landing-display max-w-4xl text-5xl font-semibold leading-[.98] sm:text-7xl lg:text-8xl">Dale un lugar a tus <span className="text-[#c7ff75]">mejores ideas.</span></h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#b7c9c3]">CanvasAI une tu vision con herramientas inteligentes para crear, probar y llevar proyectos extraordinarios al mundo.</p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => navigate('/login')} className="landing-button inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-bold">Comenzar ahora <span className="material-symbols-outlined text-lg">arrow_forward</span></button>
              <a href="#servicios" className="landing-link inline-flex items-center gap-2 text-sm font-semibold">Explorar el estudio <span className="material-symbols-outlined text-lg">south</span></a>
            </div>
          </div>
          <div className="absolute bottom-14 right-8 hidden max-w-[240px] border-l border-[#c7ff75] pl-5 text-sm leading-6 text-[#b7c9c3] lg:block">Un nuevo tipo de espacio de trabajo para equipos que piensan hacia adelante.</div>
        </section>

        <section id="servicios" className="border-y landing-line bg-[#0b191c] px-6 py-20 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#c7ff75]">El punto de partida</p><h2 className="landing-display text-4xl font-semibold text-[#edf5f2] sm:text-5xl">A que nos dedicamos</h2></div><p className="max-w-sm text-sm leading-6 text-[#8ca59d]">Menos friccion entre lo que imaginas y lo que haces realidad.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((service) => <article key={service.number} className="landing-card group rounded-xl p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c7ff75]/50"><div className="mb-14 flex items-start justify-between"><span className="text-sm font-bold text-[#c7ff75]">{service.number}</span><span className="material-symbols-outlined text-3xl text-[#87a99d] transition group-hover:text-[#c7ff75]">{service.icon}</span></div><h3 className="mb-3 text-xl font-bold">{service.title}</h3><p className="text-sm leading-6 text-[#8ca59d]">{service.description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="nosotros" className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#c7ff75]">Nuestra razon</p><h2 className="landing-display max-w-sm text-4xl font-semibold sm:text-5xl">La tecnologia debe abrir posibilidades.</h2></div>
          <div className="max-w-2xl self-end text-lg leading-8 text-[#b7c9c3]"><p>Construimos CanvasAI para que la tecnologia se sienta como una extension de tu criterio, no como una barrera entre tu y tu trabajo. Creemos en la colaboracion, la curiosidad y en las herramientas que hacen espacio para pensar mejor.</p><p className="mt-6 text-sm leading-6 text-[#8ca59d]">Un equipo pequeno con una pregunta grande: ¿como seria crear si cada idea tuviera el espacio que merece?</p></div>
        </section>
      </main>

      <footer id="contacto" className="border-t landing-line bg-[#050d10] px-6 py-14 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_auto] md:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#c7ff75]">Hablemos</p><h2 className="landing-display max-w-md text-4xl font-semibold">Tu proxima gran idea empieza aqui.</h2><p className="mt-4 text-sm text-[#8ca59d]">Escribenos a hola@canvasai.studio</p></div><div className="w-full md:w-80"><form onSubmit={handleSubmit} className="flex border-b border-[#456057] pb-2"><label htmlFor="contact-email" className="sr-only">Tu correo electronico</label><input id="contact-email" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setSent(false); }} placeholder="Tu correo electronico" className="landing-input min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm focus:outline-none" /><button type="submit" className="text-sm font-bold text-[#c7ff75]">{sent ? 'Enviado' : 'Contactar'}</button></form><p className="mt-3 text-xs text-[#708982]">Tambien estamos en LinkedIn y X.</p></div></div>
        <div className="mx-auto mt-16 flex max-w-7xl flex-col justify-between gap-3 border-t landing-line pt-5 text-xs text-[#708982] sm:flex-row"><span>© 2026 CanvasAI. Todos los derechos reservados.</span><span>Creado para quienes no se quedan en el primer borrador.</span></div>
      </footer>
    </div>
  );
};

export default LandingPage;