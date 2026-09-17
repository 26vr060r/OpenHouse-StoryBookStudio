(function (global) {
  var SBS = global.SBS || {};

  var CRC_TABLE = (function () {
    var table = [];
    var i;
    var j;
    var c;
    for (i = 0; i < 256; i += 1) {
      c = i;
      for (j = 0; j < 8; j += 1) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(u8) {
    var crc = 0 ^ -1;
    var i;
    for (i = 0; i < u8.length; i += 1) {
      crc = CRC_TABLE[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ -1) >>> 0;
  }

  function u8encode(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    var utf8 = unescape(encodeURIComponent(str));
    var out = new Uint8Array(utf8.length);
    var i;
    for (i = 0; i < utf8.length; i += 1) out[i] = utf8.charCodeAt(i);
    return out;
  }

  function concat(parts) {
    var total = 0;
    var i;
    var offset = 0;
    var out;
    for (i = 0; i < parts.length; i += 1) total += parts[i].length;
    out = new Uint8Array(total);
    for (i = 0; i < parts.length; i += 1) {
      out.set(parts[i], offset);
      offset += parts[i].length;
    }
    return out;
  }

  function u16(n) {
    return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
  }

  function u32(n) {
    return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
  }

  SBS.zipStore = function zipStore(files) {
    var local = [];
    var central = [];
    var offset = 0;
    var i;
    var name;
    var nameBytes;
    var data;
    var crc;
    var localHeader;
    for (i = 0; i < files.length; i += 1) {
      name = String(files[i].path || "").replace(/\\/g, "/");
      nameBytes = u8encode(name);
      data = files[i].data instanceof Uint8Array ? files[i].data : u8encode(String(files[i].data || ""));
      crc = crc32(data);
      localHeader = concat([
        u32(0x04034b50),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
        data
      ]);
      local.push(localHeader);
      central.push(concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes
      ]));
      offset += localHeader.length;
    }
    var centralBlob = concat(central);
    var end = concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralBlob.length),
      u32(offset),
      u16(0)
    ]);
    return concat(local.concat([centralBlob, end]));
  };

  SBS.downloadBytes = function downloadBytes(filename, bytes, mime) {
    var blob = new Blob([bytes], { type: mime || "application/zip" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  };

  global.SBS = SBS;
})(window);
