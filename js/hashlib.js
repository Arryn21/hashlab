/* hashlib.js — real crypto wrappers over crypto-js (global CryptoJS).
   Every hash shown on the site is genuinely computed here, so terminal,
   tools, and lesson demos all match real command-line output. */
(function (global) {
  "use strict";
  if (typeof CryptoJS === "undefined") {
    console.error("hashlib: CryptoJS not loaded. Include vendor/crypto-js.min.js first.");
    return;
  }
  var C = CryptoJS;

  function md5(s)    { return C.MD5(s).toString(C.enc.Hex); }
  function sha1(s)   { return C.SHA1(s).toString(C.enc.Hex); }
  function sha256(s) { return C.SHA256(s).toString(C.enc.Hex); }
  function sha512(s) { return C.SHA512(s).toString(C.enc.Hex); }

  // Base64 of arbitrary UTF-8 text
  function b64encode(s) {
    return C.enc.Base64.stringify(C.enc.Utf8.parse(s));
  }
  function b64decode(s) {
    try {
      return C.enc.Base64.parse(s.trim()).toString(C.enc.Utf8);
    } catch (e) {
      return null; // invalid base64
    }
  }

  // HMAC. algo in {"md5","sha1","sha256","sha512"}
  function hmac(algo, key, msg) {
    var fn = {
      md5: C.HmacMD5, sha1: C.HmacSHA1,
      sha256: C.HmacSHA256, sha512: C.HmacSHA512
    }[String(algo).toLowerCase()];
    if (!fn) return null;
    return fn(msg, key).toString(C.enc.Hex);
  }

  // NTLM = MD4 of the UTF-16LE password. crypto-js has no MD4, so md4hex below.
  function ntlm(password) {
    // UTF-16LE bytes of password
    var bytes = [];
    for (var i = 0; i < password.length; i++) {
      var cc = password.charCodeAt(i);
      bytes.push(cc & 0xff, (cc >>> 8) & 0xff);
    }
    return md4hex(bytes);
  }

  // Reference MD4 (RFC 1320) producing hex, little-endian output.
  function md4hex(bytes) {
    function add(x, y) { return (x + y) & 0xffffffff; }
    function rol(x, n) { return ((x << n) | (x >>> (32 - n))) & 0xffffffff; }
    var msg = bytes.slice();
    var lenLow = (bytes.length * 8) >>> 0; // 32-bit low word of bit length
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    for (var i = 0; i < 4; i++) msg.push((lenLow >>> (8 * i)) & 0xff); // low 32 bits, LE
    for (var i2 = 0; i2 < 4; i2++) msg.push(0);                         // high 32 bits = 0

    var A = 0x67452301, B = 0xefcdab89, C2 = 0x98badcfe, D = 0x10325476;
    for (var off = 0; off < msg.length; off += 64) {
      var X = new Array(16);
      for (var j = 0; j < 16; j++) {
        X[j] = msg[off+j*4] | (msg[off+j*4+1]<<8) | (msg[off+j*4+2]<<16) | (msg[off+j*4+3]<<24);
        X[j] = X[j] >>> 0;
      }
      var a = A, b = B, c = C2, d = D;
      function FF(a,b,c,d,x,s){ a = add(a, ((b&c)|(~b&d)) + x); return rol(a,s); }
      function GG(a,b,c,d,x,s){ a = add(a, add(add((b&c)|(b&d)|(c&d), x), 0x5a827999)); return rol(a,s); }
      function HH(a,b,c,d,x,s){ a = add(a, add(add(b^c^d, x), 0x6ed9eba1)); return rol(a,s); }
      var s1=[3,7,11,19], s2=[3,5,9,13], s3=[3,9,11,15];
      // Round 1
      for (var g=0; g<16; g+=4){
        a=FF(a,b,c,d,X[g],s1[0]); d=FF(d,a,b,c,X[g+1],s1[1]);
        c=FF(c,d,a,b,X[g+2],s1[2]); b=FF(b,c,d,a,X[g+3],s1[3]);
      }
      // Round 2
      var o2=[0,4,8,12,1,5,9,13,2,6,10,14,3,7,11,15];
      for (var g2=0; g2<16; g2+=4){
        a=GG(a,b,c,d,X[o2[g2]],s2[0]); d=GG(d,a,b,c,X[o2[g2+1]],s2[1]);
        c=GG(c,d,a,b,X[o2[g2+2]],s2[2]); b=GG(b,c,d,a,X[o2[g2+3]],s2[3]);
      }
      // Round 3
      var o3=[0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15];
      for (var g3=0; g3<16; g3+=4){
        a=HH(a,b,c,d,X[o3[g3]],s3[0]); d=HH(d,a,b,c,X[o3[g3+1]],s3[1]);
        c=HH(c,d,a,b,X[o3[g3+2]],s3[2]); b=HH(b,c,d,a,X[o3[g3+3]],s3[3]);
      }
      A=add(A,a); B=add(B,b); C2=add(C2,c); D=add(D,d);
    }
    function le(x){
      x = x >>> 0;
      var s="";
      for (var i=0;i<4;i++){ var byte=(x>>>(8*i))&0xff; s += ("0"+byte.toString(16)).slice(-2); }
      return s;
    }
    return le(A)+le(B)+le(C2)+le(D);
  }

  global.hashlib = {
    md5: md5, sha1: sha1, sha256: sha256, sha512: sha512,
    b64encode: b64encode, b64decode: b64decode,
    hmac: hmac, ntlm: ntlm
  };
})(window);
