import type { Metadata } from 'next';
import { ClientsView } from '@/components/business/ClientsView';

export const metadata: Metadata = {
    title: 'Clientes — Panel de negocio',
};

export default function BusinessClientsPage() {
    return <ClientsView />;
}
