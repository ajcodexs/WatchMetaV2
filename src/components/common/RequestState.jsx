import { Button } from '@/components/ui/button'

export default function RequestState({ error, onRetry }) {
  if (!error) return null
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <p>{error}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>Try again</Button>
    </div>
  )
}
