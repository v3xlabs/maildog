import { RuleResponse, useDeleteRule, useUpdateRule } from "@/api/rules";
import { RuleForm } from "@/components/RuleForm";
import { Button } from "@/components/ui/Button";
import { DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { FC, useState } from "react";
import { LuPencil } from "react-icons/lu";

export const EditRuleButton: FC<{ rule: RuleResponse }> = ({ rule }) => {
    const [open, setOpen] = useState(false);
    const { mutate: updateRule, isPending: updatePending } = useUpdateRule();
    const { mutate: deleteRule, isPending: deletePending } = useDeleteRule();

    const handleSubmit = (data: {
        name: string;
        condition: unknown;
        actions: unknown[];
        priority: number;
        enabled: boolean;
    }) => {
        updateRule(
            { id: rule.id, data },
            {
                onSuccess: () => {
                    setOpen(false);
                },
            }
        );
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this rule?')) {
            deleteRule(rule.id, {
                onSuccess: () => {
                    setOpen(false);
                },
            });
        }
    };

    const isLoading = updatePending || deletePending;

    return (
        <DialogRoot open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="xs">
                    <LuPencil className="w-3 h-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogTitle>Edit Rule</DialogTitle>
                <DialogDescription>
                    Edit the email rule configuration.
                </DialogDescription>
                <RuleForm
                    rule={rule}
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                    submitLabel="Update Rule"
                />
            </DialogContent>
        </DialogRoot>
    );
};