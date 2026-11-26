import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BusinessProvider } from '@/components/business/BusinessProvider';
import { BusinessShell } from '@/components/business/BusinessShell';
import { MOCK_SALON } from '@/services/mocks/salon.mock';
import type { SalonProfile } from '@/types/booking.contracts';

/**
 * El panel consulta los datos del salón a partir del parámetro dinámico.
 * Permitimos que la ruta bloquee durante la navegación en lugar de intentar
 * prerenderizar una cáscara sin datos.
 */
export const instant = false;

interface BusinessLayoutProps {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

/**
 * Datos mínimos para renderizar el shell antes de que React Query cargue el
 * snapshot completo en el cliente. Cuando se conecte la API real, este helper
 * debe reemplazarse por `bookingService.getSalonProfile(slug)`.
 */
function getInitialSalon(slug: string): SalonProfile {
    return { ...MOCK_SALON, slug };
}

export const metadata: Metadata = {
    title: 'Panel de negocio',
    description:
        'Administra la agenda, los servicios, el personal y los clientes del salón.',
};

export default async function BusinessLayout({
    children,
    params,
}: BusinessLayoutProps) {
    const { slug } = await params;
    const salon = getInitialSalon(slug);

    return (
        <BusinessProvider slug={slug}>
            <BusinessShell salon={salon}>{children}</BusinessShell>
        </BusinessProvider>
    );
}
