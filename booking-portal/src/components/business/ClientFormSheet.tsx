'use client';

import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useBusiness } from '@/components/business/BusinessProvider';
import { FormField } from '@/components/business/shared';
import { BusinessClient } from '@/types/booking.contracts';

interface ClientFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client?: BusinessClient | null;
}

export function ClientFormSheet({
    open,
    onOpenChange,
    client,
}: ClientFormSheetProps) {
    if (!open) {
        return null;
    }

    return (
        <ClientForm
            key={client?.id ?? 'new-client'}
            client={client ?? null}
            onOpenChange={onOpenChange}
        />
    );
}

function ClientForm({
    client,
    onOpenChange,
}: {
    client: BusinessClient | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { actions } = useBusiness();
    const [name, setName] = useState(client?.name ?? '');
    const [phone, setPhone] = useState(client?.phone ?? '');
    const [email, setEmail] = useState(client?.email ?? '');
    const [notes, setNotes] = useState(client?.notes ?? '');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setError(null);

        if (!name.trim()) {
            setError('El nombre del cliente es obligatorio.');
            return;
        }
        if (!phone.trim()) {
            setError('El teléfono es obligatorio para contactar al cliente.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim() || undefined,
                notes: notes.trim() || undefined,
            };

            if (client) {
                await actions.updateClient(client.id, payload);
                toast.success('Cliente actualizado');
            } else {
                await actions.createClient(payload);
                toast.success('Cliente registrado');
            }
            onOpenChange(false);
        } catch (submitError) {
            const message =
                submitError instanceof Error
                    ? submitError.message
                    : 'No pudimos guardar al cliente.';
            setError(message);
            toast.error('No se pudo guardar al cliente', { description: message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
                            <UserPlus className="h-3.5 w-3.5" />
                        </span>
                        {client ? 'Editar cliente' : 'Nuevo cliente'}
                    </SheetTitle>
                    <SheetDescription>
                        Guarda los datos de contacto y notas internas para dar seguimiento.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                            {error}
                        </div>
                    )}

                    <FormField label="Nombre completo" htmlFor="client-name">
                        <Input
                            id="client-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ej. Sofía Ramírez"
                        />
                    </FormField>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Teléfono" htmlFor="client-phone">
                            <Input
                                id="client-phone"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="+503 0000 0000"
                            />
                        </FormField>
                        <FormField label="Correo" htmlFor="client-email">
                            <Input
                                id="client-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="cliente@correo.com"
                            />
                        </FormField>
                    </div>

                    <FormField
                        label="Notas internas"
                        htmlFor="client-notes"
                        hint="Preferencias, alergias o detalles importantes del servicio."
                    >
                        <Textarea
                            id="client-notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Ej. prefiere productos sin sulfatos…"
                        />
                    </FormField>
                </div>

                <SheetFooter className="border-t bg-muted/20">
                    <div className="flex w-full gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Guardando…
                                </>
                            ) : client ? (
                                'Guardar cambios'
                            ) : (
                                'Registrar cliente'
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
