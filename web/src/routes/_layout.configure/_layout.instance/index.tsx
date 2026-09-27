import { createFileRoute, useNavigate } from '@tanstack/solid-router';
import { createSignal } from 'solid-js';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { setInstanceUrl } from '@/utils/instanceConfig';

export const Route = createFileRoute('/_layout/configure/_layout/instance/')({
    component: () => {
        const navigate = useNavigate();
        const [temporaryInstanceUrl, setTemporaryInstanceUrl] = createSignal(
            import.meta.env.VITE_INSTANCE_URL ?? ''
        );

        const configure = () => {
            setInstanceUrl(temporaryInstanceUrl());

            void navigate({
                to: '/configure/instance/healthcheck',
            });
        };

        return (
            <div class="space-y-2 flex flex-col">
                <Input
                    placeholder="http://localhost:5173"
                    aria-label="Instance URL"
                    value={temporaryInstanceUrl()}
                    onInput={(event) =>
                        setTemporaryInstanceUrl(event.currentTarget.value)
                    }
                />
                <Button class="w-full" onClick={configure}>
                    Next
                </Button>
            </div>
        );
    },
});
