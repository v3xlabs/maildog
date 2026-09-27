import type { JSX } from '@solidjs/web';
import { cx } from 'class-variance-authority';
import { createUniqueId, omit } from 'solid-js';

type InputProperties = JSX.InputHTMLAttributes<HTMLInputElement>;

export const Input = (properties: InputProperties) => {
    const labelId = createUniqueId();

    return (
        <label class="flex flex-col gap-1" id={'l' + labelId} for={'i' + labelId}>
            <span class="text-sm text-text-secondary">
                {properties['aria-label']}
            </span>
            <input
                aria-labelledby={'l' + labelId}
                id={'i' + labelId}
                class={cx('text-base font-sans px-2 py-1', properties.class)}
                {...omit(properties, 'class')}
            />
        </label>
    );
};
