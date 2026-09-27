import { createFileRoute } from '@tanstack/solid-router';

export const Route = createFileRoute('/_layout/configure/_layout/')({
    component: () => <div>Hello /configure/!</div>,
});
