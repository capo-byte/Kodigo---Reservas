import Link from 'next/link';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Database,
    Globe2,
    KeyRound,
    LayoutDashboard,
    Scissors,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import { EmbedSnippetBox } from './EmbedSnippetBox';
import { PromoHeroPreview } from './PromoHeroPreview';
import { SavingsCalculator } from './SavingsCalculator';

const COMPARISON_ROWS = [
    {
        dimension: 'Salida a producción',
        diy: '8 a 14 semanas diseñando, programando y depurando backend + frontend.',
        kodigo: 'El mismo día: copias 2 líneas HTML en tu web o compartes tu enlace directo.',
    },
    {
        dimension: 'Widget en tu web actual',
        diy: 'Iframe rígido con doble barra de scroll o maquetado distinto en cada CMS.',
        kodigo: 'widget.js con auto-ajuste vía postMessage y diseño responsive mobile-first.',
    },
    {
        dimension: 'Reservas simultáneas',
        diy: 'Riesgo de doble cita si dos clientes confirman el mismo horario a la vez.',
        kodigo: 'Bloqueo transaccional por sucursal en PostgreSQL y retención de 15 min.',
    },
    {
        dimension: 'Pagos online y reembolsos',
        diy: 'Programar PaymentIntents, verificar webhooks y manejar cobros tardíos.',
        kodigo: 'Flujo listo con Stripe, llaves de idempotencia y revisión/reembolso por rol.',
    },
    {
        dimension: 'Gestión en recepción',
        diy: 'Usar hojas de cálculo o pagar otro software separado para la agenda interna.',
        kodigo: 'Dashboard incluido: agenda día/semana, bloqueos, servicios, personal y clientes.',
    },
    {
        dimension: 'Mantenimiento y caídas',
        diy: 'Pagar servidor, base de datos, respaldos y horas técnicas ante cada cambio.',
        kodigo: 'Infraestructura, pruebas y actualizaciones centralizadas sin equipo técnico propio.',
    },
];

const DEMO_LINKS = [
    {
        title: 'Portal público del salón',
        path: '/barberia-studio-sv',
        description: 'Flujo completo en 3 pasos listo para compartir por WhatsApp o Instagram.',
        tag: 'Cliente final',
        icon: Globe2,
    },
    {
        title: 'Widget aislado (iframe)',
        path: '/embed/barberia-studio-sv',
        description: 'La vista limpia sin bordes que widget.js incrusta dentro de cualquier web.',
        tag: 'Embebible',
        icon: Sparkles,
    },
    {
        title: 'Autogestión sin cuenta',
        path: '/booking/tok_test_01',
        description: 'Enlace único con token para que tu cliente revise o cancele su cita.',
        tag: 'Sin registro',
        icon: KeyRound,
    },
    {
        title: 'Dashboard — Resumen',
        path: '/negocio/barberia-studio-sv',
        description: 'Métricas del día, próximas citas, ocupación y estado de caja.',
        tag: 'Negocio',
        icon: LayoutDashboard,
    },
    {
        title: 'Dashboard — Agenda',
        path: '/negocio/barberia-studio-sv/agenda',
        description: 'Vista día/semana, citas manuales, drag & drop para mover horas y bloqueos.',
        tag: 'Operación',
        icon: CalendarDays,
    },
    {
        title: 'Catálogo, Personal y Reglas',
        path: '/negocio/barberia-studio-sv/servicios',
        description: 'Administra tarifas, especialistas, clientes y horarios de atención.',
        tag: 'Configuración',
        icon: SlidersHorizontal,
    },
];

export function PromoLanding() {
    return (
        <div className="relative min-h-screen overflow-x-clip bg-[#F6F4F0] text-stone-900">
            {/* Halos difuminados sutiles de fondo */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[-140px] h-[440px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-rose-300/25 via-orange-200/25 to-stone-200/10 blur-[110px]"
            />

            {/* Navegación flotante con efecto glass */}
            <header className="sticky top-4 z-40 mx-auto max-w-6xl px-4">
                <nav
                    aria-label="Navegación principal"
                    className="flex items-center justify-between gap-4 rounded-full border border-stone-900/10 bg-[#F6F4F0]/80 px-4 py-2.5 shadow-[0_10px_30px_-15px_rgba(20,20,23,0.18)] backdrop-blur-xl sm:px-6"
                >
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-stone-950 text-xs font-bold text-white">
                            KR
                        </span>
                        <span className="text-sm font-semibold tracking-tight text-stone-950">
                            Kodigo Reservas
                        </span>
                    </Link>

                    <div className="hidden items-center gap-6 text-xs font-medium text-stone-600 md:flex">
                        <a href="#producto" className="transition-colors hover:text-stone-950">
                            Qué incluye
                        </a>
                        <a href="#ahorro" className="transition-colors hover:text-stone-950">
                            Por qué conviene
                        </a>
                        <a href="#integracion" className="transition-colors hover:text-stone-950">
                            Integración
                        </a>
                        <a href="#demos" className="transition-colors hover:text-stone-950">
                            Probar demos
                        </a>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/barberia-studio-sv"
                            className="hidden rounded-full border border-stone-900/15 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-stone-800 transition-colors hover:bg-white sm:inline-flex"
                        >
                            Ver portal cliente
                        </Link>
                        <Link
                            href="/negocio/barberia-studio-sv"
                            className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                        >
                            Abrir dashboard
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-12 sm:pt-16">
                {/* HERO ASIMÉTRICO */}
                <section className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
                    <div className="space-y-6 lg:col-span-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/75 px-3.5 py-1.5 text-xs font-medium text-stone-700 backdrop-blur-md">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Sistema completo para barberías y salones
                        </div>

                        <h1 className="text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-stone-950 sm:text-5xl">
                            Tu widget de citas en la web y tu dashboard en recepción, sin programarlos desde cero.
                        </h1>

                        <p className="max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
                            Conectas reservas online en tu propia página con dos líneas HTML y manejas la
                            agenda diaria, servicios, personal y cobros desde un solo panel. Nosotros
                            resolvemos la ingeniería que te costaría meses y miles de dólares construir
                            por tu cuenta.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <Link
                                href="/barberia-studio-sv"
                                className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-950/15 transition-all hover:bg-stone-800"
                            >
                                Probar reserva como cliente
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/negocio/barberia-studio-sv/agenda"
                                className="inline-flex items-center gap-2 rounded-2xl border border-stone-900/15 bg-white/80 px-5 py-3 text-sm font-medium text-stone-900 backdrop-blur-md transition-all hover:bg-white"
                            >
                                Explorar agenda del negocio
                            </Link>
                        </div>

                        {/* Tres datos concretos, sin relleno */}
                        <div className="grid grid-cols-3 gap-3 border-t border-stone-900/10 pt-6">
                            <div>
                                <p className="font-mono text-lg font-semibold tabular-nums text-stone-950">
                                    3 pasos
                                </p>
                                <p className="text-xs text-stone-600">
                                    Reserva sin crear cuenta ni contraseña
                                </p>
                            </div>
                            <div>
                                <p className="font-mono text-lg font-semibold tabular-nums text-stone-950">
                                    2 líneas
                                </p>
                                <p className="text-xs text-stone-600">
                                    Para incrustar el widget en tu sitio
                                </p>
                            </div>
                            <div>
                                <p className="font-mono text-lg font-semibold tabular-nums text-stone-950">
                                    6 módulos
                                </p>
                                <p className="text-xs text-stone-600">
                                    En el panel diario de tu equipo
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6">
                        <PromoHeroPreview />
                    </div>
                </section>

                {/* QUÉ OFRECEMOS EXACTAMENTE */}
                <section id="producto" className="mt-24 space-y-8 scroll-mt-24">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                            Qué incluye el servicio
                        </p>
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-4xl">
                            Dos caras conectadas: comodidad para quien reserva y control para quien atiende.
                        </h2>
                        <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
                            No vendemos una plantilla visual vacía ni un enlace genérico que saca al
                            cliente de tu marca. Entregamos el flujo de punta a punta listo para operar.
                        </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Tarjeta 1: Widget + Portal */}
                        <div className="relative overflow-hidden rounded-[28px] border border-stone-900/10 bg-white/75 p-7 backdrop-blur-xl sm:p-8">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-300/25 blur-3xl"
                            />
                            <div className="relative space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-800">
                                        <Scissors className="h-3.5 w-3.5 text-rose-600" />
                                        1. Widget embebible &amp; Portal
                                    </span>
                                    <Link
                                        href="/embed/barberia-studio-sv"
                                        className="text-xs font-medium text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline"
                                    >
                                        Ver /embed
                                    </Link>
                                </div>

                                <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                                    Tu cliente reserva en 30 segundos sin salir de tu sitio web.
                                </h3>

                                <ul className="space-y-3 text-sm text-stone-700">
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>
                                            <strong>Embebido limpio sin doble scroll:</strong> el script{' '}
                                            <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs">
                                                widget.js
                                            </code>{' '}
                                            ajusta la altura del iframe automáticamente según el paso.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>
                                            <strong>Flujo mobile-first en 3 pasos:</strong> elección de
                                            servicio/especialista, calendario con selector de zona horaria
                                            y confirmación inmediata.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>
                                            <strong>Autogestión sin contraseñas:</strong> cada cita genera
                                            un enlace seguro (
                                            <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs">
                                                /booking/[token]
                                            </code>
                                            ) e historial local para consultar o cancelar sin registrarse.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>
                                            <strong>¿No tienes página web?</strong> También incluye un
                                            portal propio en{' '}
                                            <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs">
                                                /tu-salon
                                            </code>{' '}
                                            listo para pegar en tu biografía de Instagram.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Tarjeta 2: Dashboard del negocio */}
                        <div className="relative overflow-hidden rounded-[28px] border border-stone-900 bg-zinc-950 p-7 text-zinc-100 sm:p-8">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-rose-500/25 blur-3xl"
                            />
                            <div className="relative space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-zinc-100">
                                        <LayoutDashboard className="h-3.5 w-3.5 text-orange-300" />
                                        2. Dashboard Administrativo
                                    </span>
                                    <Link
                                        href="/negocio/barberia-studio-sv"
                                        className="text-xs font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                                    >
                                        Ver /negocio
                                    </Link>
                                </div>

                                <h3 className="text-2xl font-semibold tracking-tight text-white">
                                    Recepción organizada y cada barbero con su agenda al día.
                                </h3>

                                <ul className="space-y-3 text-sm text-zinc-300">
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                                        <span>
                                            <strong>Agenda día y semana interactiva:</strong> crea citas
                                            manuales (teléfono o walk-in) y reprograma arrastrando bloques
                                            entre horas o especialistas.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                                        <span>
                                            <strong>Bloqueos y estados reales:</strong> bloquea almuerzos o
                                            ausencias, marca citas atendidas, registra inasistencias
                                            liberando el espacio al instante.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                                        <span>
                                            <strong>Catálogo, personal y clientes:</strong> actualiza
                                            tarifas sin alterar reservas previas, configura días laborales
                                            y consulta historial con notas internas.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                                        <span>
                                            <strong>Reglas y permisos por sucursal:</strong> define horarios,
                                            intervalos, políticas de pago y accesos diferenciados para
                                            recepcionista y administrador.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Capa técnica incluida */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: Database,
                                title: 'Cero citas encimadas',
                                text: 'Bloqueo transaccional en PostgreSQL por sucursal e instante.',
                            },
                            {
                                icon: Clock3,
                                title: 'Retención de 15 min',
                                text: 'Si pagan en línea, el espacio se aparta y se libera si expira.',
                            },
                            {
                                icon: CreditCard,
                                title: 'Stripe + Idempotencia',
                                text: 'Evita cobros dobles, valida webhooks y separa pago en local u online.',
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Aislamiento multi-sucursal',
                                text: 'Cada negocio opera aislado por identificador y permisos por rol.',
                            },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-stone-900/8 bg-white/65 p-5 backdrop-blur-md"
                                >
                                    <Icon className="h-5 w-5 text-stone-900" />
                                    <h3 className="mt-3 text-sm font-semibold text-stone-950">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-stone-600">
                                        {item.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* POR QUÉ TE AHORRA GASTOS FRENTE A HACERLO POR TU CUENTA */}
                <section id="ahorro" className="mt-24 space-y-8 scroll-mt-24">
                    <div className="relative">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-rose-300/20 blur-3xl"
                        />
                        <div className="max-w-3xl space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                                Ahorro frente a desarrollo propio
                            </p>
                            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-4xl">
                                Lo que implica construirlo por tu cuenta vs. activarlo ya resuelto.
                            </h2>
                            <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
                                Un calendario bonito parece sencillo hasta que entran los casos reales:
                                dos clientes reservando el mismo minuto, cambios de horario sin perder
                                citas viejas, cobros fallidos en Stripe, zonas horarias y un panel que
                                recepción entienda sin capacitación técnica.
                            </p>
                        </div>
                    </div>

                    {/* Tabla comparativa directa */}
                    <div className="overflow-hidden rounded-[28px] border border-stone-900/10 bg-white/75 shadow-sm backdrop-blur-xl">
                        <div className="grid grid-cols-1 border-b border-stone-900/10 bg-stone-100/80 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-stone-600 md:grid-cols-12">
                            <div className="md:col-span-3">Aspecto clave</div>
                            <div className="hidden md:col-span-4 md:block">
                                Si lo construyes por tu cuenta
                            </div>
                            <div className="hidden text-stone-950 md:col-span-5 md:block">
                                Con Kodigo Reservas
                            </div>
                        </div>

                        <div className="divide-y divide-stone-900/8">
                            {COMPARISON_ROWS.map((row) => (
                                <div
                                    key={row.dimension}
                                    className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-12 md:items-center md:gap-4"
                                >
                                    <div className="text-sm font-semibold text-stone-950 md:col-span-3">
                                        {row.dimension}
                                    </div>
                                    <div className="flex items-start gap-2 text-xs leading-relaxed text-stone-600 md:col-span-4 sm:text-sm">
                                        <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                        <span>{row.diy}</span>
                                    </div>
                                    <div className="flex items-start gap-2 rounded-xl bg-stone-950/[0.04] p-2.5 text-xs font-medium leading-relaxed text-stone-900 md:col-span-5 sm:text-sm">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>{row.kodigo}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calculadora interactiva */}
                    <SavingsCalculator />
                </section>

                {/* INTEGRACIÓN + DEMOS EN VIVO */}
                <section id="integracion" className="mt-24 space-y-12 scroll-mt-24">
                    <div className="grid items-center gap-8 lg:grid-cols-12">
                        <div className="space-y-4 lg:col-span-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                                Integración en tu sitio actual
                            </p>
                            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                                Pega dos líneas en tu página y empieza a recibir citas.
                            </h2>
                            <p className="text-sm leading-relaxed text-stone-600">
                                Funciona sobre HTML estático, WordPress, Webflow, React o cualquier CMS.
                                No necesitas reconstruir tu sitio web ni contratar a un desarrollador cada
                                vez que cambies un precio o un horario.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link
                                    href="/embed/barberia-studio-sv"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                                >
                                    Abrir /embed/barberia-studio-sv
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                                <Link
                                    href="/booking/tok_test_01"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-900/15 bg-white/80 px-4 py-2.5 text-xs font-medium text-stone-800 transition-colors hover:bg-white"
                                >
                                    Ver autogestión por token
                                </Link>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <EmbedSnippetBox />
                        </div>
                    </div>

                    {/* Rutas reales para probar todo el proyecto ahora mismo */}
                    <div id="demos" className="space-y-5 scroll-mt-24">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                                    Demos funcionales en este proyecto
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">
                                    Prueba cada módulo en vivo ahora mismo
                                </h2>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-900/10 bg-white/80 px-3 py-1 text-xs text-stone-600">
                                <Users className="h-3.5 w-3.5" />
                                Salón de prueba: <strong className="text-stone-900">barberia-studio-sv</strong>
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {DEMO_LINKS.map((demo) => {
                                const Icon = demo.icon;
                                return (
                                    <Link
                                        key={demo.path}
                                        href={demo.path}
                                        className="group flex flex-col justify-between rounded-2xl border border-stone-900/10 bg-white/75 p-5 backdrop-blur-lg transition-all hover:-translate-y-0.5 hover:border-stone-900/25 hover:bg-white hover:shadow-lg hover:shadow-stone-950/5"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-900 transition-colors group-hover:bg-stone-950 group-hover:text-white">
                                                    <Icon className="h-4 w-4" />
                                                </span>
                                                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                                                    {demo.tag}
                                                </span>
                                            </div>
                                            <h3 className="mt-4 text-base font-semibold text-stone-950">
                                                {demo.title}
                                            </h3>
                                            <p className="mt-1 text-xs leading-relaxed text-stone-600">
                                                {demo.description}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-stone-200/70 pt-3 font-mono text-[11px] text-stone-500">
                                            <span className="truncate">{demo.path}</span>
                                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-stone-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer limpio */}
            <footer className="mx-auto max-w-6xl px-4 pb-8">
                <div className="relative overflow-hidden rounded-[28px] bg-stone-950 px-6 py-8 text-zinc-300 sm:px-10">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl"
                    />
                    <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-base font-semibold text-white">Kodigo Reservas</p>
                            <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-400">
                                Widget embebible de reservas, portal público y dashboard operativo para
                                barberías y salones multi-sucursal.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs">
                            <Link
                                href="/barberia-studio-sv"
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/10"
                            >
                                Portal cliente
                            </Link>
                            <Link
                                href="/embed/barberia-studio-sv"
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/10"
                            >
                                Widget embed
                            </Link>
                            <Link
                                href="/negocio/barberia-studio-sv"
                                className="rounded-full bg-white px-4 py-2 font-medium text-stone-950 transition-colors hover:bg-zinc-200"
                            >
                                Dashboard negocio
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
