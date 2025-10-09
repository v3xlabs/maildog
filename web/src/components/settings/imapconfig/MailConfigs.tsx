import { useEmails, useImapConfigs } from "@/api";
import { Button } from "@/components/ui/Button";
import { LuPencil, LuPlus, LuRefreshCcw, LuTrash } from "react-icons/lu";
import { EditImapConfigButton } from "./EditImapConfig";
import { AddImapConfigButton } from "./AddImapConfig";

export const MailConfigSettings = () => {
    const { data: configs } = useImapConfigs();

    return (
        <div className="card space-y-2">
            <div className="px-4 py-2 border-b">
                <h2 className="text-lg font-medium">Accounts</h2>
                <p className="text-sm text-gray-500">Setup your mail accounts</p>
            </div>
            <div className="px-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left">ID</th>
                            <th className="text-left">Name</th>
                            <th className="text-left">Username</th>
                            <th className="text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs?.configs.map((config) => (
                            <tr key={config.id} className="border-b last:border-b-0 px-2">
                                <td>#{config.id}</td>
                                <td>{config.name}</td>
                                <td>{config.username}</td>
                                <td className="py-0.5">
                                    <EditImapConfigButton config={config} />
                                    <Button variant="secondary" size="xs">
                                        <LuRefreshCcw />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end border-t p-2">
                <AddImapConfigButton />
            </div>
        </div>
    )
};
