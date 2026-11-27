import type { Metadata } from 'next';
import { PromoLanding } from '@/components/promo/PromoLanding';

export const metadata: Metadata = {
    title: 'Kodigo Reservas — Widget embebible y Dashboard para barberías y salones',
    description:
        'Integra un widget de citas en tu propia página web y controla agenda, servicios, personal, clientes y cobros desde un solo panel, sin desarrollar nada desde cero.',
};

export default function HomePage() {
    return <PromoLanding />;
}
