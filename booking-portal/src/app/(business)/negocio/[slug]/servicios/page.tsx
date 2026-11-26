import type { Metadata } from 'next';
import { ServicesView } from '@/components/business/ServicesView';

export const metadata: Metadata = {
    title: 'Servicios — Panel de negocio',
};

export default function BusinessServicesPage() {
    return <ServicesView />;
}
