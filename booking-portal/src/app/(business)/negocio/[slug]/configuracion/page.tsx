import type { Metadata } from 'next';
import { SettingsView } from '@/components/business/SettingsView';

export const metadata: Metadata = {
    title: 'Configuración — Panel de negocio',
};

export default function BusinessSettingsPage() {
    return <SettingsView />;
}
