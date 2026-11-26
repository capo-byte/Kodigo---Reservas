/**
 * Kodigo Reservas — Embed Widget Loader
 * Script ligero para incrustar el portal de reservas en cualquier sitio web o CMS.
 * Maneja el auto-redimensionamiento mediante postMessage para evitar barras de scroll dobles.
 */
(function (window, document) {
    'use strict';

    // Determinar la URL base de donde se sirve este script (ej. http://localhost:3000 o https://reservas.com)
    function getScriptOrigin() {
        if (document.currentScript && document.currentScript.src) {
            try {
                var url = new URL(document.currentScript.src);
                return url.origin;
            } catch {
                // fallback
            }
        }
        return window.location.origin;
    }

    var defaultOrigin = getScriptOrigin();

    // Inicializar un widget dentro de un elemento contenedor DOM
    function mountWidget(container, options) {
        if (!container) return;
        if (container.dataset.bookingWidgetLoaded === 'true') return;

        var slug = options.slug || container.dataset.slug;
        if (!slug) {
            console.warn('[BookingWidget] Atributo "data-slug" requerido en el contenedor.');
            return;
        }

        var baseUrl = (options.baseUrl || container.dataset.baseUrl || defaultOrigin).replace(/\/$/, '');
        var iframeUrl = baseUrl + '/embed/' + encodeURIComponent(slug);

        // Crear el elemento iframe
        var iframe = document.createElement('iframe');
        iframe.src = iframeUrl;
        iframe.title = 'Reservar cita en ' + slug;
        iframe.setAttribute('data-booking-slug', slug);
        iframe.setAttribute('allow', 'payment');
        iframe.setAttribute('scrolling', 'auto');
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.style.overflow = 'auto';
        iframe.style.display = 'block';
        iframe.style.minHeight = '520px';
        iframe.style.transition = 'height 0.25s ease-out';
        iframe.style.background = 'transparent';

        container.appendChild(iframe);
        container.dataset.bookingWidgetLoaded = 'true';
    }

    // Escuchar mensajes postMessage emitidos por el iframe para redimensionar la altura sin scroll doble
    window.addEventListener('message', function (event) {
        if (!event.data || typeof event.data !== 'object') return;

        if (event.data.type === 'BOOKING_WIDGET_RESIZE') {
            var targetSlug = event.data.slug;
            var height = Number(event.data.height);

            if (!height || isNaN(height)) return;

            // Buscar el iframe correspondiente por slug o por origen
            var selector = targetSlug
                ? 'iframe[data-booking-slug="' + targetSlug + '"]'
                : 'iframe[data-booking-slug]';

            var iframes = document.querySelectorAll(selector);
            for (var i = 0; i < iframes.length; i++) {
                iframes[i].style.height = Math.ceil(height) + 'px';
            }
        }

        // Si se recibe confirmación de reserva exitosa, emitir un evento DOM en el contenedor
        if (event.data.type === 'BOOKING_SUCCESS') {
            var customEvent = new CustomEvent('booking:success', {
                detail: event.data,
                bubbles: true,
            });
            window.dispatchEvent(customEvent);
        }
    });

    // Auto-inicializar elementos con atributo [data-booking-widget]
    function autoInit() {
        var elements = document.querySelectorAll('[data-booking-widget]');
        for (var i = 0; i < elements.length; i++) {
            mountWidget(elements[i], {});
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    // API programática global para React, Vue, WordPress o scripts personalizados
    window.initBookingWidget = function (config) {
        if (!config) return;
        var container = typeof config.container === 'string'
            ? document.querySelector(config.container)
            : config.container;

        if (container) {
            mountWidget(container, config);
        } else {
            console.error('[BookingWidget] Contenedor no encontrado:', config.container);
        }
    };
})(window, document);
