import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useInstanceConfig } from '../../../hooks/useInstanceConfig';

export const Route = createFileRoute('/configure/_layout/instance/')({
    component: () => {
        const suggestedKeycloakUrl = (import.meta as any).env.VITE_INSTANCE_URL;
        const navigate = useNavigate();
        const [temporaryInstanceUrl, setTemporaryInstanceUrl] =
            useState(suggestedKeycloakUrl);
        const { setInstanceUrl } = useInstanceConfig();

        const configure = useCallback(() => {
            setInstanceUrl(temporaryInstanceUrl);

            navigate({
                to: '/configure/instance/healthcheck',
            });
        }, []);

        return (
            <div className="space-y-2 flex flex-col">
                <Input
                    placeholder="http://localhost:5173"
                    aria-label="Instance URL"
                    defaultValue={suggestedKeycloakUrl}
                    onChange={(event) =>
                        setTemporaryInstanceUrl(event.target.value)
                    }
                />
                <Button className="w-full" onClick={configure}>
                    Next
                </Button>
            </div>
        );
    },
});
