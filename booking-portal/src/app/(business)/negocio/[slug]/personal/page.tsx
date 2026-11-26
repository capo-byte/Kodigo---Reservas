import type { Metadata } from 'next';
import { StaffView } from '@/components/business/StaffView';

export const metadata: Metadata = {
    title: 'Personal — Panel de negocio',
};

export default function BusinessStaffPage() {
    return <StaffView />;
}
