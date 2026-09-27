import { MailConfigSettings } from '@/components/settings/imapconfig/MailConfigs'
import { buttonVariants } from '@/components/ui/Button'
import { createFileRoute, Link } from '@tanstack/solid-router'

export const Route = createFileRoute('/_layout/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div class="mx-auto w-full max-w-lg py-4">
      <div class="space-y-2">
        <MailConfigSettings />
        <div class="card p-2">
          <Link to="/logout" class={buttonVariants()}>
            Logout
          </Link>
        </div>
      </div>
    </div>
  )
}
