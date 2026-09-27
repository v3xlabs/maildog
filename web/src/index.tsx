import './index.css';

import { render } from '@solidjs/web';
import { createRouter, RouterProvider } from '@tanstack/solid-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/solid-router' {
    interface Register {
        router: typeof router;
    }
}

const root = document.querySelector('#root');

if (!root) throw new Error('Missing #root element');

render(() => <RouterProvider router={router} />, root);
