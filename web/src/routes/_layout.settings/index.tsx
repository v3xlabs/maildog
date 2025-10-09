import { MailConfigSettings } from '@/components/settings/imapconfig/MailConfigs'
import { Button } from '@/components/ui/Button'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="mx-auto w-full max-w-lg py-4">
      <div className="space-y-2">
        <MailConfigSettings />
        <div className="card p-2">
          <Button asChild>
            <Link to="/logout">Logout</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
