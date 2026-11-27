'use client';

import { useState } from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SnippetMode = 'html' | 'js';

const HTML_SNIPPET = `<!-- 1. Contenedor donde aparecerá tu calendario -->
<div
  data-booking-widget
  data-slug="barberia-studio-sv"
  data-base-url="http://localhost:3000"
></div>

<!-- 2. Script ligero (auto-ajusta altura sin doble scroll) -->
<script src="http://localhost:3000/widget.js" async></script>`;

const JS_SNIPPET = `<div id="agenda-salon"></div>
<script src="http://localhost:3000/widget.js"></script>
<script>
  window.initBookingWidget({
    container: '#agenda-salon',
    slug: 'barberia-studio-sv',
    baseUrl: 'http://localhost:3000',
  });

  // Escucha confirmaciones desde tu sitio web
  window.addEventListener('booking:success', (e) => {
    console.log('Reserva confirmada:', e.detail);
  });
</script>`;

export function EmbedSnippetBox() {
    const [mode, setMode] = useState<SnippetMode>('html');
    const [copied, setCopied] = useState(false);

    const activeCode = mode === 'html' ? HTML_SNIPPET : JS_SNIPPET;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(activeCode);
            setCopied(true);
            toast.success('Código copiado al portapapeles');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('No se pudo copiar automáticamente');
        }
    };

    return (
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-rose-400" />
                    <div className="flex rounded-xl bg-white/5 p-0.5">
                        <button
                            type="button"
                            onClick={() => setMode('html')}
                            className={cn(
                                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                                mode === 'html'
                                    ? 'bg-white text-zinc-950'
                                    : 'text-zinc-400 hover:text-white'
                            )}
                        >
                            HTML declarativo
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('js')}
                            className={cn(
                                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                                mode === 'js'
                                    ? 'bg-white text-zinc-950'
                                    : 'text-zinc-400 hover:text-white'
                            )}
                        >
                            JavaScript / React
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10"
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Copiado
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            Copiar snippet
                        </>
                    )}
                </button>
            </div>

            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-zinc-200 sm:text-[13px]">
                <code>{activeCode}</code>
            </pre>
        </div>
    );
}
