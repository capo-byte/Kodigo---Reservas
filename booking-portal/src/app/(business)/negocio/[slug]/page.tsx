import type { Metadata } from 'next';
import { OverviewView } from '@/components/business/OverviewView';

export const metadata: Metadata = {
    title: 'Resumen — Panel de negocio',
};

export default function BusinessOverviewPage() {
    return <OverviewView />;
}
