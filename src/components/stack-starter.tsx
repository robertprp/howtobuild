import { useRef, useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import type { PublicStack } from '../features/editorial/model'
import { buildStarterPrompt, starterGroups } from '../features/stacks/starter'

export function StackStarter({ stack }: { stack: PublicStack }) {
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [purpose, setPurpose] = useState('')
  const [message, setMessage] = useState('')
  const preview = useRef<HTMLTextAreaElement>(null)
  const groups = starterGroups(stack, selections)
  const choices = groups.map(
    (group) =>
      group.options.find(
        (option) => option.id === selections[group.responsibility],
      ) ?? group.options[0],
  )
  const prompt = buildStarterPrompt(stack, choices, purpose)
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setMessage('Prompt copied.')
    } catch {
      preview.current?.focus()
      preview.current?.select()
      setMessage('Select and copy the prompt using your keyboard.')
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([prompt], { type: 'text/markdown;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `${stack.slug}-starter.md`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Markdown prompt downloaded.')
  }
  return (
    <section className="stack-starter" aria-labelledby="starter-title">
      <header>
        <p className="eyebrow">From decision to first build</p>
        <h2 id="starter-title">Start with this stack.</h2>
        <p>
          Choose the pieces you want, then copy the build prompt into your
          coding assistant. No account needed.
        </p>
        <p>
          Optional capabilities start as “Not needed”. Hosted providers add
          external dependencies, including to the open-source stack.
        </p>
      </header>
      <div className="starter-layout">
        <div className="starter-controls">
          <label>
            What are you building?
            <textarea
              rows={3}
              maxLength={1000}
              value={purpose}
              onChange={(event) => {
                setPurpose(event.target.value)
                setMessage('')
              }}
              placeholder={stack.summary}
            />
          </label>
          {groups.map((group, index) => {
            const optional = group.options[0].id.startsWith('none:')
            const Container = optional ? 'details' : 'div'
            return (
              <Container className="starter-choice" key={group.responsibility}>
                {optional ? (
                  <summary>
                    {group.responsibility} · {choices[index].name}
                  </summary>
                ) : null}
                <label>
                  {group.responsibility}
                  <select
                    value={choices[index].id}
                    onChange={(event) => {
                      setSelections((previous) => ({
                        ...previous,
                        [group.responsibility]: event.target.value,
                      }))
                      setMessage('')
                    }}
                  >
                    {group.options.map((option) => (
                      <option value={option.id} key={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p>{choices[index].rationale}</p>
                <small>{choices[index].cost}</small>
                {choices[index].sourceUrl ? (
                  <a
                    href={choices[index].sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the source ↗
                  </a>
                ) : null}
              </Container>
            )
          })}
          {choices.some((choice) => choice.id === 'nextjs') ? (
            <p className="form-message">
              Next.js includes React. The extra authentication and UI options
              are researched for Next.js; they disappear if you switch to
              another framework.
            </p>
          ) : null}
        </div>
        <div className="starter-prompt">
          <div className="starter-toolbar">
            <span>starter.md</span>
            <button type="button" onClick={copy}>
              {message === 'Prompt copied.' ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}{' '}
              Copy prompt
            </button>
            <button type="button" onClick={download}>
              <Download size={16} /> Download .md
            </button>
          </div>
          <label className="sr-only" htmlFor="starter-prompt">
            Your generated build prompt
          </label>
          <textarea
            id="starter-prompt"
            ref={preview}
            readOnly
            value={prompt}
            spellCheck={false}
          />
          <p role="status">
            {message || 'Updates as you choose your technologies.'}
          </p>
        </div>
      </div>
    </section>
  )
}
