import { useMutation } from '@tanstack/react-query'
import { orpc } from '../lib/orpc-client'

export function ContributionResponse({
  kind,
  id,
}: {
  kind: 'submission' | 'suggestion'
  id: string
}) {
  const mutation = useMutation(orpc.contributions.respond.mutationOptions())
  return (
    <form
      className="contribution-response"
      onSubmit={(event) => {
        event.preventDefault()
        const message = String(new FormData(event.currentTarget).get('message'))
        mutation.mutate(
          { kind, id, message },
          { onSuccess: () => window.location.reload() },
        )
      }}
    >
      <label>
        Respond to requested changes
        <textarea
          name="message"
          required
          minLength={30}
          maxLength={4000}
          rows={4}
          placeholder="Include corrected details and source URLs for the editor."
        />
      </label>
      <button className="button" disabled={mutation.isPending}>
        Send changes for review
      </button>
      <p role="status">{mutation.error?.message}</p>
    </form>
  )
}
