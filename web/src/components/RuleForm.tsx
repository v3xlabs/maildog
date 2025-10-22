import { useState } from 'react';

import type { RuleResponse } from '@/api/rules';

import { Button } from './ui/Button';
import { DialogClose } from '@radix-ui/react-dialog';

interface RuleFormProperties {
    rule?: RuleResponse;
    onSubmit: (data: {
        name: string;
        condition: unknown;
        actions: unknown[];
        priority: number;
        enabled: boolean;
    }) => void;
    onCancel?: () => void;
    onDelete?: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export const RuleForm = ({
    rule,
    onSubmit,
    onCancel,
    onDelete,
    isLoading,
    submitLabel = 'Save',
}: RuleFormProperties) => {
    const defaultRule = {
        name: "Example Rule",
        condition: {
            type: "headerContains",
            name: "from",
            substring: "@example.com"
        },
        actions: [
            {
                type: "setCategory",
                value: "example"
            }
        ],
        priority: 10,
        enabled: true
    };

    const [ruleJson, setRuleJson] = useState(() => {
        if (rule) {
            return JSON.stringify({
                name: rule.name,
                condition: rule.condition,
                actions: rule.actions,
                priority: rule.priority,
                enabled: rule.enabled
            }, null, 2);
        }
        return JSON.stringify(defaultRule, null, 2);
    });

    const [jsonError, setJsonError] = useState<string | undefined>();

    const validateJson = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Basic validation
            if (!parsed.name || typeof parsed.name !== 'string') {
                setJsonError('Rule must have a name');
                return false;
            }
            if (!parsed.condition) {
                setJsonError('Rule must have a condition');
                return false;
            }
            if (!parsed.actions || !Array.isArray(parsed.actions)) {
                setJsonError('Rule must have actions as an array');
                return false;
            }
            if (typeof parsed.priority !== 'number') {
                setJsonError('Priority must be a number');
                return false;
            }
            if (typeof parsed.enabled !== 'boolean') {
                setJsonError('Enabled must be true or false');
                return false;
            }
            
            setJsonError(undefined);
            return true;
        } catch (error) {
            setJsonError(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateJson(ruleJson)) {
            return;
        }

        try {
            const parsed = JSON.parse(ruleJson);
            onSubmit({
                name: parsed.name,
                condition: parsed.condition,
                actions: parsed.actions,
                priority: parsed.priority,
                enabled: parsed.enabled,
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="rule" className="block text-sm font-medium mb-1">
                    Rule Configuration (JSON)
                </label>
                <textarea
                    id="rule"
                    value={ruleJson}
                    onChange={(e) => {
                        setRuleJson(e.target.value);
                        validateJson(e.target.value);
                    }}
                    placeholder={JSON.stringify(defaultRule, null, 2)}
                    className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm"
                    required
                />
                {jsonError && (
                    <p className="text-red-500 text-xs mt-1">{jsonError}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                    Configure the complete rule as JSON. Include name, condition, actions, priority, and enabled fields.
                </p>
            </div>

            <div className="flex justify-between items-center pt-4">
                <div>
                    {onDelete && rule && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onDelete}
                            disabled={isLoading}
                        >
                            Delete
                        </Button>
                    )}
                </div>
                <div className="flex space-x-2">
                    {onCancel && (
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isLoading}>
                                Cancel
                            </Button>
                        </DialogClose>
                    )}
                    <Button type="submit" disabled={isLoading || !!jsonError}>
                        {isLoading ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
};