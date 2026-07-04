/* tools.js — interactive helpers:
   1. Tools.hashGen(el)   live MD5/SHA1/SHA256/SHA512 generator (avalanche demo)
   2. Tools.identifier(el) paste a hash -> likely types by length/prefix
   3. Tools.modeLookup(el) searchable hashcat mode table
   Depends on window.hashlib. */
(function (global) {
  "use strict";
  var H = global.hashlib;

  /* ---------- 1. Live hash generator ---------- */
  function hashGen(el) {
    el.innerHTML =
      "<label class='tool-label' for='hg-in'>Type text — every hash updates live. " +
      "Change one character and watch the whole digest change (the avalanche effect).</label>" +
      "<input id='hg-in' class='tool-input' value='TryHackMe' autocomplete='off' spellcheck='false'>" +
      "<table class='tool-table hashgen-table'>" +
        "<tr><th>MD5</th><td id='hg-md5'></td></tr>" +
        "<tr><th>SHA1</th><td id='hg-sha1'></td></tr>" +
        "<tr><th>SHA256</th><td id='hg-sha256'></td></tr>" +
        "<tr><th>SHA512</th><td id='hg-sha512'></td></tr>" +
      "</table>";
    var input = el.querySelector("#hg-in");
    function update() {
      var v = input.value;
      el.querySelector("#hg-md5").textContent = H.md5(v);
      el.querySelector("#hg-sha1").textContent = H.sha1(v);
      el.querySelector("#hg-sha256").textContent = H.sha256(v);
      el.querySelector("#hg-sha512").textContent = H.sha512(v);
    }
    input.addEventListener("input", update);
    update();
  }

  /* ---------- 2. Hash-type identifier ---------- */
  // Ordered rules: prefixes first (reliable), then length-based (ambiguous).
  var PREFIX_RULES = [
    { re: /^\$2[abxy]\$/, name: "bcrypt", mode: "3200", note: "Blowfish-based, slow. Very strong." },
    { re: /^\$y\$/,       name: "yescrypt", mode: "(via unix crypt)", note: "Modern Linux default." },
    { re: /^\$gy\$/,      name: "gost-yescrypt", mode: "-", note: "GOST + yescrypt." },
    { re: /^\$7\$/,       name: "scrypt", mode: "8900 / 27800(Cisco)", note: "Memory-hard KDF." },
    { re: /^\$6\$/,       name: "sha512crypt", mode: "1800", note: "SHA-512 based, older Linux." },
    { re: /^\$5\$/,       name: "sha256crypt", mode: "7400", note: "SHA-256 based." },
    { re: /^\$1\$/,       name: "md5crypt", mode: "500", note: "Old FreeBSD/Linux, weak." },
    { re: /^\$md5\$/,     name: "SunMD5", mode: "3300", note: "Solaris." },
    { re: /^\$9\$/,       name: "Cisco-IOS scrypt ($9$)", mode: "9300", note: "Type 9." },
    { re: /^\$argon2/,    name: "Argon2", mode: "(john)", note: "Modern, memory-hard. Recommended." },
    { re: /^\{SHA\}/,     name: "LDAP {SHA}", mode: "101", note: "Base64 SHA1." },
    { re: /^[0-9a-f]{32}:[0-9a-f]{32}$/i, name: "md5(md5) or salted MD5", mode: "varies", note: "hash:salt shape." }
  ];
  var LEN_RULES = {
    32: [{ name: "MD5", mode: "0" }, { name: "NTLM", mode: "1000" }, { name: "MD4", mode: "900" }, { name: "LM (half)", mode: "3000" }],
    40: [{ name: "SHA1", mode: "100" }, { name: "MySQL4.1+ (with *)", mode: "300" }],
    56: [{ name: "SHA224", mode: "1300" }],
    64: [{ name: "SHA256", mode: "1400" }, { name: "SHA3-256", mode: "17400" }],
    96: [{ name: "SHA384", mode: "10800" }],
    128: [{ name: "SHA512", mode: "1700" }, { name: "SHA3-512", mode: "17600" }, { name: "Whirlpool", mode: "6100" }]
  };

  function identify(raw) {
    var h = raw.trim();
    if (!h) return [];
    var results = [];
    PREFIX_RULES.forEach(function (r) {
      if (r.re.test(h)) results.push({ name: r.name, mode: r.mode, note: r.note, kind: "prefix" });
    });
    if (results.length) return results;               // prefix match is reliable
    if (/^[0-9a-f]+$/i.test(h) && LEN_RULES[h.length]) {
      LEN_RULES[h.length].forEach(function (r) {
        results.push({ name: r.name, mode: r.mode, note: "length " + h.length + " hex — ambiguous, use context", kind: "length" });
      });
    }
    if (!results.length) results.push({ name: "Unknown", mode: "-", note: "No prefix and length " + h.length + " unrecognised. Research the source app.", kind: "unknown" });
    return results;
  }

  function identifier(el) {
    el.innerHTML =
      "<label class='tool-label' for='id-in'>Paste a hash. Identification uses prefix (reliable) " +
      "then length (ambiguous — automated tools guess wrong here, so lean on context).</label>" +
      "<input id='id-in' class='tool-input' placeholder='e.g. b6b0d451bbf6fed658659a9e7e5598fe' autocomplete='off' spellcheck='false'>" +
      "<div id='id-out' class='tool-out'></div>";
    var input = el.querySelector("#id-in");
    var out = el.querySelector("#id-out");
    function update() {
      var res = identify(input.value);
      if (!res.length) { out.innerHTML = ""; return; }
      var rows = res.map(function (r) {
        return "<tr><td><strong>" + r.name + "</strong></td><td>mode " + r.mode +
               "</td><td class='id-note'>" + r.note + "</td></tr>";
      }).join("");
      var amb = res.length > 1 && res[0].kind === "length";
      out.innerHTML =
        (amb ? "<p class='id-warn'>⚠ Multiple candidates of the same length. Context decides " +
               "(e.g. from a web-app DB → MD5; from a Windows SAM → NTLM).</p>" : "") +
        "<table class='tool-table'><tr><th>Likely type</th><th>hashcat</th><th>Note</th></tr>" + rows + "</table>";
    }
    input.addEventListener("input", update);
    update();
  }

  /* ---------- 3. Hashcat mode lookup ---------- */
  var MODES = [
    ["0", "MD5"], ["100", "SHA1"], ["1400", "SHA2-256"], ["1700", "SHA2-512"],
    ["900", "MD4"], ["1000", "NTLM"], ["3000", "LM"], ["5500", "NetNTLMv1"], ["5600", "NetNTLMv2"],
    ["500", "md5crypt $1$"], ["1800", "sha512crypt $6$"], ["7400", "sha256crypt $5$"],
    ["3200", "bcrypt $2*$"], ["8900", "scrypt"], ["9300", "Cisco-IOS $9$ (scrypt)"],
    ["2410", "Cisco-ASA MD5"], ["2400", "Cisco-PIX MD5"], ["500", "Cisco-IOS $1$ (MD5)"],
    ["300", "MySQL4.1/5+"], ["200", "MySQL323"], ["12", "PostgreSQL"],
    ["1750", "HMAC-SHA512 (key = $pass)"], ["1710", "sha512($pass.$salt)"],
    ["10", "md5($pass.$salt)"], ["20", "md5($salt.$pass)"],
    ["16800", "WPA-PMKID-PBKDF2"], ["22000", "WPA-PBKDF2-PMKID+EAPOL"],
    ["1000", "NTLM (Windows)"], ["13100", "Kerberos 5 TGS-REP (Kerberoast)"],
    ["18200", "Kerberos 5 AS-REP"], ["3300", "SunMD5 $md5$"]
  ];

  function modeLookup(el) {
    el.innerHTML =
      "<label class='tool-label' for='ml-in'>Search hashcat modes by algorithm name or number.</label>" +
      "<input id='ml-in' class='tool-input' placeholder='bcrypt, ntlm, 1800, cisco...' autocomplete='off'>" +
      "<div id='ml-out' class='tool-out'></div>";
    var input = el.querySelector("#ml-in");
    var out = el.querySelector("#ml-out");
    function render(q) {
      q = (q || "").trim().toLowerCase();
      var rows = MODES.filter(function (m) {
        return !q || m[0].indexOf(q) !== -1 || m[1].toLowerCase().indexOf(q) !== -1;
      });
      if (!rows.length) { out.innerHTML = "<p class='id-note'>No match. Check the Hashcat example-hashes page.</p>"; return; }
      out.innerHTML = "<table class='tool-table'><tr><th>-m mode</th><th>Algorithm</th></tr>" +
        rows.map(function (m) { return "<tr><td><code>" + m[0] + "</code></td><td>" + m[1] + "</td></tr>"; }).join("") +
        "</table>";
    }
    input.addEventListener("input", function () { render(input.value); });
    render("");
  }

  global.Tools = { hashGen: hashGen, identifier: identifier, modeLookup: modeLookup, identify: identify };
})(window);
