import type { Metadata } from 'next';

interface BookingManagePageProps {
    params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: BookingManagePageProps): Promise<Metadata> {
    const { token } = await params;
    return {
        title: 'Gestión de Reserva',
        description: `Consulta y gestiona tu reserva con token ${token}.`,
    };
}

export default async function BookingManagePage({ params }: BookingManagePageProps) {
    const { token } = await params;

    return (
        <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h1 className="text-xl font-bold tracking-tight mb-2">Detalles de la Reserva</h1>
                <p className="text-sm text-muted-foreground mb-4">
                    Gestiona tu cita o revisa el estado de tu reserva.
                </p>
                <div className="rounded-lg bg-muted p-3 text-xs font-mono text-muted-foreground break-all">
                    Token: {token}
                </div>
            </div>
        </main>
    );
}
