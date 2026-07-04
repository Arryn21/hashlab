# hashlab — Interactive Hashing Basics

A static, hands-on learning site covering hashing concepts, built from the TryHackMe
"Hashing Basics" room. Everything runs in the browser — no server, no build step.

## Features
- **Real crypto** — MD5, SHA1/256/512, HMAC, Base64, and NTLM (MD4) computed live via a
  vendored copy of [crypto-js](https://github.com/brix/crypto-js) plus a small MD4 impl.
- **In-browser terminal** — `md5sum`, `sha256sum`, `base64`, `hexdump`, `cat`, `ls` are real;
  `hashcat`/`john` are **simulated** for the room's known hashes (safe, offline).
- **Live tools** — hash generator (avalanche demo), hash-type identifier, hashcat mode lookup.
- **Practice quizzes** — every lesson has questions with hints, instant feedback, and progress
  saved to `localStorage`.
- **8 lessons** — hash functions, collisions, password storage, recognising hashes, cracking
  lab, integrity & HMAC, encoding vs encryption, and a mistakes/tactics cheatsheet.

## Run locally
Just open `index.html` in a browser, or serve it:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Publish on GitHub Pages
1. Create a repo and push this folder's contents to the default branch.
2. Repo **Settings → Pages → Source: Deploy from a branch**, pick the branch and `/ (root)`.
3. Your site appears at `https://<username>.github.io/<repo>/`.

`.nojekyll` is included so GitHub serves the files as-is. All asset paths are relative, so it
works from a subpath.

## Structure
```
index.html            landing page + progress
css/style.css         theme
js/hashlib.js         real crypto wrappers (incl. NTLM/MD4)
js/terminal.js        shell widget (real hashing + simulated cracking)
js/quiz.js            quiz engine
js/tools.js           hash generator / identifier / mode lookup
vendor/crypto-js.min.js
pages/                the 8 content pages
```

## Roadmap
Planned improvements (theme toggle, reset progress, universal copy buttons, a real mini-wordlist
cracking demo, and more) are tracked in [ROADMAP.md](ROADMAP.md).

## Note
Cracking is simulated on purpose — this is a teaching tool. Only crack hashes you are
authorised to (CTFs, your own systems, sanctioned engagements).
