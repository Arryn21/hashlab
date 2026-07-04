# Roadmap — future improvements

Ideas parked for later, ranked by value. Nothing here is built yet.

## High value
- **Light/dark theme toggle** — header button, saved to `localStorage`; CSS variables already
  set up in `css/style.css`, so this is cheap.
- **Reset progress button** — clear quiz `localStorage` keys (`thm_quiz_*`) so users can retake.
- **Randomize + expand quiz banks** — shuffle question and answer order; add more questions per
  topic to stop position-memorizing.
- **Universal "copy" button** — on every hash/code block, not just the terminal.
- **Search / command palette** — quick jump to any lesson or term.

## Medium value
- **Real cracking demo** — bundle a small wordlist (top-100 rockyou), actually hash-and-compare
  so the `hashcat` sim iterates a genuine list instead of returning a canned answer.
- **Speed/cost visual** — chart of MD5 vs bcrypt guesses-per-second to show why slow hashes win.
- **Progress badges** — mark a topic "done" when all its quiz questions are correct; show a
  checkmark on the landing cards.
- **Keyboard navigation** — arrow / `j k` between lessons, `/` to focus the terminal.
- **Challenge mode** — timed mixed quiz drawing from all topics, with a final score.

## Polish
- **Lesson stepper** — prev/next progress bar across the 7 lessons.
- **Mobile terminal** — bigger tap targets, better on-screen-keyboard handling.
- **Print/PDF cheatsheet** — print CSS for the mistakes-tactics page.
- **Favicon + Open Graph meta** — tab icon and social preview when shared.
- **Accessibility** — focus rings, `aria-live` on quiz feedback, contrast pass.

## Content
- **More hash types** — bcrypt cost factor, Argon2 params, Kerberos / NetNTLM (pentest relevance).
- **Side notes** — salt vs pepper, timing attacks, password policy.
- **Glossary page** — one-line definitions with linkable anchors.

### Suggested first batch
Dark/light toggle · reset progress · universal copy buttons · real mini-wordlist crack demo.
