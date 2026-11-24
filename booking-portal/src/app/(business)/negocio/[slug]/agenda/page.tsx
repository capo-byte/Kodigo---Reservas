import type { Metadata } from 'next';
import { AgendaView } from '@/components/business/AgendaView';

export const metadata: Metadata = {
    title: 'Agenda — Panel de negocio',
};

export default function BusinessAgendaPage() {
    return <AgendaView />;
}
