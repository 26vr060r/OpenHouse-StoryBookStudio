(function (global) {
  var SBS = global.SBS || {};

  function ascii(str) {
    var out = new Uint8Array(str.length);
    var i;
    for (i = 0; i < str.length; i += 1) out[i] = str.charCodeAt(i) & 0xff;
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

  function pad10(n) {
    var s = String(n);
    while (s.length < 10) s = "0" + s;
    return s;
  }

  SBS.pdfFromJpegs = function pdfFromJpegs(pages, widthPt, heightPt) {
    var n = pages.length;
    var parts = [];
    var offset = 0;
    var xref = [0];
    var i;
    var pageObj;
    var imgObj;
    var contentObj;
    var jpeg;
    var content;
    var kids = [];
    var maxObj;
    var xrefStart;

    function push(u8) {
      parts.push(u8);
      offset += u8.length;
    }

    function pushStr(s) {
      push(ascii(s));
    }

    function beginObj(num) {
      xref[num] = offset;
      pushStr(num + " 0 obj\n");
    }

    function endObj() {
      pushStr("\nendobj\n");
    }

    if (!n) return concat([ascii("%PDF-1.4\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n")]);

    pushStr("%PDF-1.4\n%\x80\x80\x80\x80\n");
    beginObj(1);
    pushStr("<< /Type /Catalog /Pages 2 0 R >>");
    endObj();

    for (i = 0; i < n; i += 1) kids.push((3 + i * 3) + " 0 R");
    beginObj(2);
    pushStr("<< /Type /Pages /Count " + n + " /Kids [" + kids.join(" ") + "] >>");
    endObj();

    for (i = 0; i < n; i += 1) {
      pageObj = 3 + i * 3;
      imgObj = 4 + i * 3;
      contentObj = 5 + i * 3;
      jpeg = pages[i].data;
      content = "q " + widthPt + " 0 0 " + heightPt + " 0 0 cm /Im0 Do Q\n";
      beginObj(pageObj);
      pushStr(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + widthPt + " " + heightPt +
        "] /Resources << /XObject << /Im0 " + imgObj + " 0 R >> >> /Contents " +
        contentObj + " 0 R >>"
      );
      endObj();
      beginObj(imgObj);
      pushStr(
        "<< /Type /XObject /Subtype /Image /Width " + pages[i].width +
        " /Height " + pages[i].height +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
        jpeg.length + " >>\nstream\n"
      );
      push(jpeg);
      pushStr("\nendstream");
      endObj();
      beginObj(contentObj);
      pushStr("<< /Length " + content.length + " >>\nstream\n" + content + "endstream");
      endObj();
    }

    maxObj = 2 + n * 3;
    xrefStart = offset;
    pushStr("xref\n0 " + (maxObj + 1) + "\n");
    pushStr("0000000000 65535 f \n");
    for (i = 1; i <= maxObj; i += 1) {
      pushStr(pad10(xref[i] || 0) + " 00000 n \n");
    }
    pushStr("trailer\n<< /Size " + (maxObj + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF\n");
    return concat(parts);
  };

  global.SBS = SBS;
})(window);
