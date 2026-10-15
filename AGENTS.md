<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI calls live in `src/lib/ai.server.ts` (server-only) and are exposed via auth-protected server functions in `src/lib/ai.functions.ts`; why: keeps the AI key server-side and blocks anonymous usage.
- App data (tasks, meetings, emails) is read/written from the browser through the Cloud client under per-user RLS; signed-in pages live under the `_app` layout with `ssr: false`; why: session lives in browser storage.
