/* terminal.js — in-browser shell widget.
   Real: md5sum/sha1sum/sha256sum/sha512sum/base64/echo/cat/hexdump/ls (via hashlib).
   Simulated: hashcat / john return scripted results for the room's known hashes.
   Attach with: Terminal.mount(document.getElementById("term")); */
(function (global) {
  "use strict";
  var H = global.hashlib;

  // Virtual filesystem (contents are real; sums computed live).
  var FS = {
    "file1.txt": "T",
    "file2.txt": "U",
    "decode-this.txt": "RU5jb2RlREVjb2RlCg==\n",
    "hash1.txt": "$2a$06$7yoU3Ng8dHTXphAg913cyO6Bjs3K5lBnwq5FJyA6d01pMSrddr1ZG\n",
    "hash2.txt": "9eb7ee7f551d2f0ac684981bd1f1e2fa4a37590199636753efe614d4db30e8e1\n",
    "hash3.txt": "$6$GQXVvW4EuM$ehD6jWiMsfNorxy5SINsgdlxmAEl3.yif0/c3NqzGLa0P.S7KRDYjycw5bnYkF5ZtB8wQy8KnskuWQS3Yr1wQ0\n",
    "hash4.txt": "b6b0d451bbf6fed658659a9e7e5598fe\n"
  };

  // Known cracked results for the simulated crackers (hash -> plaintext).
  var CRACKED = {
    "$2a$06$7yoU3Ng8dHTXphAg913cyO6Bjs3K5lBnwq5FJyA6d01pMSrddr1ZG": "85208520",
    "9eb7ee7f551d2f0ac684981bd1f1e2fa4a37590199636753efe614d4db30e8e1": "halloween",
    "$6$GQXVvW4EuM$ehD6jWiMsfNorxy5SINsgdlxmAEl3.yif0/c3NqzGLa0P.S7KRDYjycw5bnYkF5ZtB8wQy8KnskuWQS3Yr1wQ0": "spaceman",
    "b6b0d451bbf6fed658659a9e7e5598fe": "funforyou",
    "5b31f93c09ad1d065c0491b764d04933": "tryhackme"
  };

  var HELP = [
    "Available commands:",
    "  ls                      list files",
    "  cat <file>              print file contents",
    "  hexdump -C <file>       hex + ascii dump",
    "  md5sum <file>           real MD5   (also sha1sum/sha256sum/sha512sum)",
    "  echo -n <text>          print text without newline",
    "  echo -n <text> | sha256sum   pipe text into a hasher",
    "  base64 <text>           encode text to base64",
    "  base64 -d <b64>         decode base64",
    "  hashcat -m <mode> -a 0 <file> <wordlist>   (simulated crack)",
    "  john <file>             (simulated crack)",
    "  clear                   clear the screen",
    "  help                    show this help",
    "",
    "Tip: files available are " + Object.keys(FS).join(", ")
  ].join("\n");

  function hexdump(str) {
    var out = "", i;
    for (i = 0; i < str.length; i += 16) {
      var chunk = str.slice(i, i + 16);
      var hexs = [], asc = "";
      for (var j = 0; j < 16; j++) {
        if (j < chunk.length) {
          var code = chunk.charCodeAt(j);
          hexs.push(("0" + code.toString(16)).slice(-2));
          asc += (code >= 32 && code < 127) ? chunk[j] : ".";
        } else { hexs.push("  "); }
      }
      var offset = ("00000000" + i.toString(16)).slice(-8);
      out += offset + "  " + hexs.slice(0,8).join(" ") + "  " + hexs.slice(8).join(" ") +
             "  |" + asc + "|\n";
    }
    out += ("00000000" + str.length.toString(16)).slice(-8) + "\n";
    return out;
  }

  function sumCmd(algo, arg, isFile) {
    var data = isFile ? FS[arg] : arg;
    if (isFile && data === undefined) return arg + ": No such file";
    var fn = { md5sum: "md5", sha1sum: "sha1", sha256sum: "sha256", sha512sum: "sha512" }[algo];
    var digest = H[fn](data);
    return isFile ? digest + "  " + arg : digest + "  -";
  }

  function tokenize(line) {
    // simple split respecting nothing fancy; handles quotes minimally
    return line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  }

  function run(line) {
    line = line.trim();
    if (!line) return "";
    // pipe support: echo -n X | <sum>
    if (line.indexOf("|") !== -1) {
      var parts = line.split("|");
      var left = parts[0].trim(), right = parts[1].trim();
      var lt = tokenize(left);
      var text = "";
      if (lt[0] === "echo") { text = left.replace(/^echo\s+(-n\s+)?/, ""); }
      else if (lt[0] === "cat" && FS[lt[1]] !== undefined) { text = FS[lt[1]]; }
      else return "unsupported pipe input";
      var rt = tokenize(right)[0];
      if (["md5sum","sha1sum","sha256sum","sha512sum"].indexOf(rt) !== -1)
        return sumCmd(rt, text, false);
      if (rt === "base64") return H.b64encode(text);
      return rt + ": unsupported after pipe";
    }

    var t = tokenize(line);
    var cmd = t[0];
    switch (cmd) {
      case "help": return HELP;
      case "clear": return "__CLEAR__";
      case "ls": return Object.keys(FS).join("  ");
      case "whoami": return "strategos";
      case "pwd": return "/home/strategos/Hashing-Basics";
      case "cat":
        if (FS[t[1]] === undefined) return (t[1]||"") + ": No such file";
        return FS[t[1]].replace(/\n$/, "");
      case "hexdump":
        var f = t[t.length - 1];
        if (FS[f] === undefined) return f + ": No such file";
        return hexdump(FS[f].replace(/\n$/, "")).replace(/\n$/, "");
      case "echo":
        return line.replace(/^echo\s+(-n\s+)?/, "");
      case "md5sum": case "sha1sum": case "sha256sum": case "sha512sum":
        if (!t[1]) return cmd + ": missing file";
        return sumCmd(cmd, t[1], true);
      case "base64":
        if (t[1] === "-d") return H.b64decode(t.slice(2).join(" ")) || "base64: invalid input";
        return H.b64encode(t.slice(1).join(" "));
      case "hashcat": return hashcatSim(t, line);
      case "john": return johnSim(t);
      case "man":
        return "man: try the lessons on this site instead :) — key pages: crypt(5), shadow(5)";
      default:
        return cmd + ": command not found (type 'help')";
    }
  }

  function findHashInArgs(t, line) {
    // hashcat -m X -a 0 <file-or-hash> <wordlist>
    // pick first token that is a known file or a known hash
    for (var i = 1; i < t.length; i++) {
      if (FS[t[i]] !== undefined) return FS[t[i]].trim();
      if (CRACKED[t[i]]) return t[i];
    }
    return null;
  }

  function hashcatSim(t, line) {
    var mFlag = t.indexOf("-m");
    var mode = mFlag !== -1 ? t[mFlag + 1] : "?";
    var hash = findHashInArgs(t, line);
    var header = "hashcat (simulated) — mode " + mode + ", attack 0 (straight)\n" +
                 "Dictionary: rockyou.txt\n";
    if (!hash) return header + "\nNo recognised hash/file in arguments. This demo only cracks the room hashes.";
    var pw = CRACKED[hash];
    if (!pw) return header + "\nStatus: Exhausted — not found in this offline demo wordlist.";
    return header +
      "\n" + hash + ":" + pw +
      "\n\nSession..........: hashcat" +
      "\nStatus...........: Cracked" +
      "\nRecovered........: 1/1 (100.00%) Digests" +
      "\n\n[note] Simulated result. On a real host: hashcat -m " + mode +
      " -a 0 hash.txt /usr/share/wordlists/rockyou.txt";
  }

  function johnSim(t) {
    var f = t[1];
    var data = FS[f];
    if (data === undefined) return "john: no such file: " + (f||"");
    var hash = data.trim();
    var pw = CRACKED[hash];
    if (!pw) return "john (simulated): could not crack this hash in the offline demo.";
    return "john (simulated)\nLoaded 1 password hash\n" + pw + "  (?)\n" +
           "1 password cracked. Use: john --wordlist=/usr/share/wordlists/rockyou.txt " + f;
  }

  // ---- DOM wiring ----
  function mount(el) {
    if (!el) return;
    el.classList.add("term");
    el.innerHTML =
      '<div class="term-out"></div>' +
      '<div class="term-line"><span class="term-prompt">strategos@thm ~&gt;</span> ' +
      '<input class="term-input" autocomplete="off" spellcheck="false" ' +
      'aria-label="terminal input" /></div>';
    var out = el.querySelector(".term-out");
    var input = el.querySelector(".term-input");
    var history = [], hi = -1;

    function print(text, cls) {
      var d = document.createElement("div");
      if (cls) d.className = cls;
      d.textContent = text;
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
    }
    print("THM Hashing playground. Type 'help' to begin. Cracking is simulated. " +
          "Double-click a hash to select it, then Ctrl+C to copy.", "term-note");

    // Focus the input on click — but NOT while the user is selecting output text,
    // otherwise refocusing would clear the selection and break copy/paste.
    el.addEventListener("mouseup", function () {
      var sel = window.getSelection && window.getSelection().toString();
      if (sel && sel.length) return;   // user selected text; leave it alone
      input.focus();
    });
    // Click a printed output line to copy its text to the clipboard.
    out.addEventListener("dblclick", function (e) {
      var line = e.target.closest ? e.target.closest("div") : null;
      var text = (line ? line.textContent : "").trim();
      // strip the "hash  filename" -> keep just the hash when it looks like sum output
      var m = text.match(/^([0-9a-f]{16,128})\b/i);
      var toCopy = m ? m[1] : text;
      if (navigator.clipboard && toCopy) {
        navigator.clipboard.writeText(toCopy).then(function () {
          flash(line, "copied ✓");
        }).catch(function () {});
      }
    });
    function flash(line, msg) {
      if (!line) return;
      var tag = document.createElement("span");
      tag.textContent = "  " + msg;
      tag.style.color = "var(--accent)";
      line.appendChild(tag);
      setTimeout(function () { if (tag.parentNode) tag.parentNode.removeChild(tag); }, 1200);
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var cmd = input.value;
        print("strategos@thm ~> " + cmd, "term-echo");
        if (cmd.trim()) { history.push(cmd); hi = history.length; }
        var res = run(cmd);
        if (res === "__CLEAR__") { out.innerHTML = ""; }
        else if (res !== "") print(res);
        input.value = "";
      } else if (e.key === "ArrowUp") {
        if (hi > 0) { hi--; input.value = history[hi]; e.preventDefault(); }
      } else if (e.key === "ArrowDown") {
        if (hi < history.length - 1) { hi++; input.value = history[hi]; }
        else { hi = history.length; input.value = ""; }
      }
    });
  }

  global.Terminal = { mount: mount, run: run };
})(window);
