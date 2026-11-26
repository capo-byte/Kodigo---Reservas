'use client';

import { useEffect } from 'react';

interface EmbedIframeBridgeProps {
    slug: string;
}

/**
 * Componente puente para comunicación postMessage entre el iframe de /embed/[slug]
 * y la ventana padre donde esté incrustado el widget.js.
 * 
 * Envía la altura exacta del documento en cada redimensionamiento para evitar
 * el doble scrollbar (scroll anidado).
 */
export function EmbedIframeBridge({ slug }: EmbedIframeBridgeProps) {
    useEffect(() => {
        // Solo operamos si estamos dentro de un iframe
        if (typeof window === 'undefined' || window.self === window.top) {
            return;
        }

        let lastHeight = 0;

        const sendHeight = () => {
            const body = document.body;
            const height = Math.ceil(Math.max(body.scrollHeight, body.offsetHeight));
            if (height === lastHeight) return;
            lastHeight = height;

            window.parent.postMessage(
                {
                    type: 'BOOKING_WIDGET_RESIZE',
                    slug,
                    height,
                },
                '*'
            );
        };

        // Medir de inmediato
        sendHeight();

        // Escuchar cambios de tamaño con ResizeObserver en body
        const resizeObserver = new ResizeObserver(() => {
            sendHeight();
        });
        resizeObserver.observe(document.body);

        // Medir tras cargar recursos e imágenes
        window.addEventListener('load', sendHeight);
        window.addEventListener('resize', sendHeight);

        // Polling de seguridad los primeros 3 segundos para transiciones suaves de CSS
        const interval = setInterval(sendHeight, 600);
        const timer = setTimeout(() => clearInterval(interval), 3000);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('load', sendHeight);
            window.removeEventListener('resize', sendHeight);
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [slug]);

    return null;
}
