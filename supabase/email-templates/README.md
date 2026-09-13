# Email templates

Supabase Auth email templates (Dashboard → Authentication → Emails →
Templates) aren't stored in the database and can't be migrated with SQL —
they live only in project config, editable in the dashboard's own HTML
source editor. There is no CLI/API path in this project's toolchain to push
them automatically, so these files are the versioned source of truth; when
you change one here, copy its content into the matching template's
**Source** tab in the dashboard and click **Save changes**.

Each file is a self-contained HTML fragment (inline styles, table layout)
so it survives being rendered by whatever an email client strips. Do not
remove the `{{ .ConfirmationURL }}` / `{{ .Token }}` / `{{ .Email }}` /
`{{ .NewEmail }}` placeholders — Supabase fills those in per-send.

| File | Dashboard template | Used by this app today |
|---|---|---|
| `confirm-signup.html` | Confirm sign up | Yes — every signup |
| `reset-password.html` | Reset password | Yes — forgot-password flow |
| `change-email.html` | Change email address | Not wired up yet |
| `invite-user.html` | Invite user | Not used (no admin-invite flow) |
| `magic-link.html` | Magic link or OTP | Not used (password auth only) |
| `reauthentication.html` | Reauthentication | Not used (no MFA/step-up flow) |

All six were still Supabase's unbranded defaults until 2026-09-13 — no
stale links or old naming, just generic copy with no CampusBin branding.
