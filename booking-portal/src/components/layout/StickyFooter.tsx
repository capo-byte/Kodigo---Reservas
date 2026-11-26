'use client';

import { Button } from '@/components/ui/button';

interface StickyFooterProps {
    summaryLabel?: string;
    summarySublabel?: string;
    actionLabel: string;
    onAction: () => void;
    embedded?: boolean;
    disabled?: boolean;
    loading?: boolean;
    onBack?: () => void;
}

export function StickyFooter({
    summaryLabel,
    summarySublabel,
    actionLabel,
    onAction,
    embedded = false,
    disabled = false,
    loading = false,
    onBack,
}: StickyFooterProps) {
    return (
        <div
            className={`${embedded ? 'relative' : 'fixed inset-x-0 bottom-0'} z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80`}
        >
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                    {summaryLabel ? (
                        <>
                            <p className="truncate text-sm font-semibold">{summaryLabel}</p>
                            {summarySublabel && (
                                <p className="truncate text-xs text-muted-foreground">
                                    {summarySublabel}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Selecciona un servicio para continuar
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {onBack && (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={onBack}
                            disabled={loading}
                        >
                            Atrás
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="lg"
                        onClick={onAction}
                        disabled={disabled || loading}
                    >
                        {loading ? 'Procesando...' : actionLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}