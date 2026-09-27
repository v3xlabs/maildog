import { createLazyFileRoute } from '@tanstack/solid-router';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const component = () => {
    return (
        <div class="p-2 w-full h-full pt-4 md:pt-16">
            <div class="max-w-lg mx-auto space-y-4">
                <h1 class="text-2xl font-bold text-text-secondary">
                    Configuration
                </h1>
                <div class="border border-border bg-card-background p-4 rounded-lg h-fit space-y-2 w-full ">
                    <h2 class="h2">Buttons</h2>
                    <div class="flex gap-2 flex-wrap">
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="link">Link</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="ghostOutline">Ghost Outline</Button>
                    </div>
                </div>
                <div class="border border-border bg-card-background p-4 rounded-lg h-fit space-y-2 w-full ">
                    <h2 class="h2">Inputs</h2>
                    <div class="flex gap-2 flex-wrap">
                        <Input type="text" placeholder="Text" />
                        <Input type="email" placeholder="Email" />
                        <Input type="password" placeholder="Password" />
                        <Input type="number" placeholder="Number" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Route = createLazyFileRoute('/debug')({
    component,
});
