import { useCreateRule } from "@/api/rules";
import { RuleForm } from "@/components/RuleForm";
import { Button } from "@/components/ui/Button";
import { DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { FC, useState } from "react";
import { LuPlus } from "react-icons/lu";

export const AddRuleButton: FC = () => {
    const [open, setOpen] = useState(false);
    const { mutate: createRule, isPending } = useCreateRule();

    const handleSubmit = (data: {
        name: string;
        condition: unknown;
        actions: unknown[];
        priority: number;
        enabled: boolean;
    }) => {
        createRule(data, {
            onSuccess: () => {
                setOpen(false);
            },
        });
    };

    return (
        <DialogRoot open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                    <LuPlus className="w-4 h-4 mr-1" />
                    Add Rule
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogTitle>Create New Rule</DialogTitle>
                <DialogDescription>
                    Create a new email rule to automatically categorize and process your emails.
                </DialogDescription>
                <RuleForm
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                    isLoading={isPending}
                    submitLabel="Create Rule"
                />
            </DialogContent>
        </DialogRoot>
    );
};