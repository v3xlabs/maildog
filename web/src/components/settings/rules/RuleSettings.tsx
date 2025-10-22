import { useRules } from "@/api/rules";
import { Button } from "@/components/ui/Button";
import { LuToggleLeft, LuToggleRight } from "react-icons/lu";
import { EditRuleButton } from "./EditRule";
import { AddRuleButton } from "./AddRule";

export const RuleSettings = () => {
    const { data: rulesData } = useRules();

    return (
        <div className="card space-y-2">
            <div className="px-4 py-2 border-b">
                <h2 className="text-lg font-medium">Email Rules</h2>
                <p className="text-sm text-gray-500">Manage email categorization rules</p>
            </div>
            <div className="px-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left">Name</th>
                            <th className="text-left">Priority</th>
                            <th className="text-left">Status</th>
                            <th className="text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rulesData?.rules?.map((rule) => (
                            <tr key={rule.id} className="border-b last:border-b-0 px-2">
                                <td className="py-2">
                                    <div>
                                        <div className="font-medium">{rule.name}</div>
                                    </div>
                                </td>
                                <td className="py-2">{rule.priority}</td>
                                <td className="py-2">
                                    <div className="flex items-center">
                                        {rule.enabled ? (
                                            <LuToggleRight className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuToggleLeft className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className={`ml-1 text-xs ${rule.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                            {rule.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-0.5">
                                    <EditRuleButton rule={rule} />
                                </td>
                            </tr>
                        ))}
                        {(!rulesData?.rules || rulesData.rules.length === 0) && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-500">
                                    No rules configured yet. Add your first rule to start organizing your emails.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end border-t p-2">
                <AddRuleButton />
            </div>
        </div>
    );
};