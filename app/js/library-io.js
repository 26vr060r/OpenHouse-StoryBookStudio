(function (global) {
  var SBS = global.SBS || {};
  var DB_NAME = "sbs-library";
  var DB_VER = 1;
  var cachedHandle = null;

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function pageFile(bookId, n) {
    return bookId + "_p" + pad2(n) + ".png";
  }

  function sheetToken(charId) {
    return String(charId || "char").replace(/[^a-z0-9-]/gi, "") || "char";
  }

  function sheetFile(bookId, charId) {
    return bookId + "_" + sheetToken(charId) + "_character-sheet.png";
  }

  function serializeSheets(book) {
    return ((book && book.characterSheets) || []).map(function (s) {
      return {
        id: (s && s.id) || "",
        url: (s && s.url) || "",
        note: (s && s.note) || "",
        source: (s && s.source) || ""
      };
    });
  }

  function hydrateCharacterSheets(book, stored) {
    if (!book) return book;
    var chars = (book.bible && book.bible.characters) || [];
    var incoming = (stored && stored.length ? stored : book.characterSheets) || [];
    var combined = book.characterSheet || "";
    book.characterSheets = chars.map(function (ch, index) {
      var found = incoming[index];
      var i;
      if (found && found.id && ch.id && found.id !== ch.id) found = null;
      if (!found || !(found.url || found.note)) {
        for (i = 0; i < incoming.length; i += 1) {
          if (incoming[i] && incoming[i].id && incoming[i].id === ch.id) {
            found = incoming[i];
            break;
          }
        }
      }
      var url = (found && found.url) || ch.sheet || "";
      if (!url && chars.length === 1 && combined) url = combined;
      if (url) ch.sheet = url;
      return {
        id: ch.id || (found && found.id) || "",
        url: url,
        note: (found && found.note) || "",
        source: (found && found.source) || ""
      };
    });
    if (!book.characterSheet) {
      for (var j = 0; j < book.characterSheets.length; j += 1) {
        if (book.characterSheets[j] && book.characterSheets[j].url) {
          book.characterSheet = book.characterSheets[j].url;
          break;
        }
      }
    }
    return book;
  }

  function bibleForPack(bible) {
    if (!bible) return {};
    var copy;
    try {
      copy = JSON.parse(JSON.stringify(bible));
    } catch (err) {
      return bible;
    }
    ((copy.characters) || []).forEach(function (ch) {
      if (ch && ch.sheet && String(ch.sheet).indexOf("data:") === 0) ch.sheet = "";
    });
    return copy;
  }

  function prettyJson(obj) {
    return JSON.stringify(obj, null, 2);
  }

  function dataUrlToBytes(url) {
    if (!url || url.indexOf("base64,") === -1) return new Uint8Array(0);
    var b64 = url.split("base64,")[1];
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    var i;
    for (i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { resolve(""); };
      reader.readAsDataURL(blob);
    });
  }

  function openDb() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      var req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
        if (!db.objectStoreNames.contains("catalog")) db.createObjectStore("catalog");
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { resolve(null); };
    });
  }

  function storeGet(store, key) {
    return openDb().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        var tx = db.transaction(store, "readonly");
        var req = tx.objectStore(store).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { resolve(null); };
      });
    });
  }

  function storePut(store, key, value) {
    return openDb().then(function (db) {
      if (!db) return false;
      return new Promise(function (resolve) {
        var tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value, key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    });
  }

  function storeDelete(store, key) {
    return openDb().then(function (db) {
      if (!db) return false;
      return new Promise(function (resolve) {
        var tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    });
  }

  function storeGetAll(store) {
    return openDb().then(function (db) {
      if (!db) return [];
      return new Promise(function (resolve) {
        var tx = db.transaction(store, "readonly");
        var req = tx.objectStore(store).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { resolve([]); };
      });
    });
  }

  function catalogOf(book) {
    var id = book.bookId;
    return {
      schemaVersion: 1,
      bookId: id,
      stamp: book.stamp,
      createdAt: book.createdAt,
      title: book.title,
      generator: book.generator || "demo",
      status: "complete",
      paths: {
        intent: "intent/" + id + ".intent.json",
        bible: "bible/" + id + ".bible.json",
        promptDir: "prompt/" + id + "/",
        bookDir: "book/" + id + "/",
        view: "html/" + id + ".view.html",
        printHtml: "html/" + id + ".print-a4.html",
        printBooklet: "html/" + id + ".print-booklet.html",
        spreadsDir: "spreads/" + id + "/"
      }
    };
  }

  function bookRecord(book) {
    var id = book.bookId;
    var record = {
      schemaVersion: 1,
      bookId: id,
      stamp: book.stamp,
      createdAt: book.createdAt,
      title: book.title,
      dedication: book.dedication || "",
      textDirection: book.textDirection || "yoko",
      furigana: !!book.furigana,
      generator: book.generator || "demo",
      pageCount: book.pageCount || ((book.spreads || []).length * 2) || 12,
      creator: book.creator && book.creator.name ? {
        name: String(book.creator.name || ""),
        agreed: !!book.creator.agreed,
        agreedAt: String(book.creator.agreedAt || ""),
        agreedAtLabel: String(book.creator.agreedAtLabel || "")
      } : null,
      print: { v1: "a4-landscape-spread", masterArt: "hires" },
      paths: {
        bible: "../../bible/" + id + ".bible.json",
        promptDir: "../../prompt/" + id + "/"
      },
      spreads: (book.spreads || []).map(function (s) {
        return {
          n: s.n,
          role: s.role,
          scene: s.scene,
          leftArt: pageFile(id, s.n),
          paragraphs: s.paragraphs,
          artSource: s.artSource || ""
        };
      })
    };
    if (book.characterSheet) {
      record.paths.characterSheet = id + "_character-sheet.png";
    }
    record.paths.characterSheets = ((book.characterSheets) || []).map(function (s) {
      return {
        id: (s && s.id) || "",
        file: s && s.url ? sheetFile(id, s.id) : "",
        note: (s && s.note) || "",
        source: (s && s.source) || ""
      };
    });
    return record;
  }

  function pack(book) {
    var id = book.bookId;
    var files = [];
    var catalog = catalogOf(book);
    var record = bookRecord(book);
    if (book.prompts && book.prompts.files && book.prompts.files.length) {
      files = files.concat(book.prompts.files);
    }
    files.push({ path: "catalog/" + id + ".catalog.json", data: prettyJson(catalog) });
    files.push({ path: "intent/" + id + ".intent.json", data: prettyJson(book.intent || {}) });
    files.push({ path: "bible/" + id + ".bible.json", data: prettyJson(bibleForPack(book.bible)) });
    files.push({ path: "book/" + id + "/" + id + ".book.json", data: prettyJson(record) });
    if (book.characterSheet) {
      files.push({
        path: "book/" + id + "/" + id + "_character-sheet.png",
        data: dataUrlToBytes(book.characterSheet)
      });
    }
    ((book.characterSheets) || []).forEach(function (s) {
      if (!s || !s.url) return;
      files.push({
        path: "book/" + id + "/" + sheetFile(id, s.id),
        data: dataUrlToBytes(s.url)
      });
    });
    (book.spreads || []).forEach(function (s) {
      if (!s.leftArt) return;
      files.push({
        path: "book/" + id + "/" + pageFile(id, s.n),
        data: dataUrlToBytes(s.leftArt)
      });
    });
    return { catalog: catalog, record: record, files: files };
  }

  function withExports(book) {
    var packed = pack(book);
    if (!SBS.Export || !SBS.Export.buildFiles) return Promise.resolve(packed);
    return SBS.Export.buildFiles(book).then(function (extra) {
      packed.files = packed.files.concat(extra || []);
      return packed;
    }).catch(function () {
      return packed;
    });
  }

  function runtimeFromEntry(entry) {
    var record = entry.record || {};
    var arts = entry.arts || [];
    var spreads = (record.spreads || []).map(function (s, i) {
      return {
        n: s.n,
        role: s.role,
        scene: s.scene,
        paragraphs: s.paragraphs,
        leftArt: arts[i] || "",
        artSource: s.artSource || ""
      };
    });
    return hydrateCharacterSheets({
      schemaVersion: record.schemaVersion || 1,
      bookId: record.bookId,
      stamp: record.stamp,
      createdAt: record.createdAt,
      title: record.title,
      dedication: record.dedication || "",
      textDirection: record.textDirection || "yoko",
      furigana: !!record.furigana,
      generator: record.generator || "demo",
      pageCount: record.pageCount || ((spreads || []).length * 2) || 12,
      creator: record.creator || null,
      intent: entry.intent,
      bible: entry.bible,
      prompts: entry.prompts || null,
      characterSheet: entry.characterSheet || "",
      characterSheets: entry.characterSheets || [],
      spreads: spreads
    }, entry.characterSheets);
  }

  function localEntry(book) {
    var packed = pack(book);
    return {
      catalog: packed.catalog,
      intent: book.intent,
      bible: book.bible,
      record: packed.record,
      prompts: book.prompts || null,
      characterSheet: book.characterSheet || "",
      characterSheets: serializeSheets(book),
      arts: (book.spreads || []).map(function (s) { return s.leftArt || ""; })
    };
  }

  function canUseFolder() {
    return typeof window.showDirectoryPicker === "function" && !!window.isSecureContext;
  }

  function ensureHandle(handle) {
    if (!handle) return Promise.resolve(null);
    if (!handle.queryPermission) {
      cachedHandle = handle;
      return Promise.resolve(handle);
    }
    return handle.queryPermission({ mode: "readwrite" }).then(function (state) {
      if (state === "granted") {
        cachedHandle = handle;
        return handle;
      }
      return handle.requestPermission({ mode: "readwrite" }).then(function (next) {
        if (next === "granted") {
          cachedHandle = handle;
          return handle;
        }
        return null;
      });
    }).catch(function () {
      return null;
    });
  }

  function getHandle() {
    if (cachedHandle) return Promise.resolve(cachedHandle);
    return storeGet("kv", "dirHandle").then(function (handle) {
      cachedHandle = handle || null;
      return cachedHandle;
    });
  }

  function walkDir(root, parts) {
    var chain = Promise.resolve(root);
    (parts || []).forEach(function (name) {
      if (!name) return;
      chain = chain.then(function (dir) {
        return dir.getDirectoryHandle(name, { create: true });
      });
    });
    return chain;
  }

  function writeFiles(root, files) {
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        var parts = String(file.path || "").replace(/\\/g, "/").split("/");
        var name = parts.pop();
        return walkDir(root, parts).then(function (dir) {
          return dir.getFileHandle(name, { create: true }).then(function (fh) {
            return fh.createWritable().then(function (w) {
              var payload = file.data instanceof Uint8Array ? file.data : file.data;
              return w.write(payload).then(function () { return w.close(); });
            });
          });
        });
      });
    });
    return chain;
  }

  function readTextFile(dir, name) {
    return dir.getFileHandle(name).then(function (fh) {
      return fh.getFile().then(function (file) { return file.text(); });
    });
  }

  function readJsonFile(dir, name) {
    return readTextFile(dir, name).then(function (text) {
      return JSON.parse(text);
    });
  }

  SBS.LibraryIO = {
    canUseFolder: canUseFolder,

    pack: pack,

    hydrateCharacterSheets: hydrateCharacterSheets,

    downloadZip: function downloadZip(book) {
      if (!book || !book.bookId) return Promise.resolve(false);
      return withExports(book).then(function (packed) {
        var bytes = SBS.zipStore(packed.files);
        SBS.downloadBytes(book.bookId + ".zip", bytes, "application/zip");
        return true;
      });
    },

    saveLocal: function saveLocal(book) {
      if (!book || !book.bookId) return Promise.resolve(false);
      var entry = localEntry(book);
      return storePut("catalog", book.bookId, entry);
    },

    listLocal: function listLocal() {
      return storeGetAll("catalog").then(function (rows) {
        return storeGet("kv", "session").then(function (session) {
          var list = (rows || []).slice();
          var sessionBook = session && session.book;
          var sessionId = (session && session.bookId) || (sessionBook && sessionBook.bookId) || "";
          var found = false;
          list.forEach(function (row) {
            var id = row && row.catalog && row.catalog.bookId;
            if (id && sessionId && id === sessionId) {
              found = true;
              if (session.status !== "complete") row.inProgress = true;
            }
          });
          if (!found && sessionBook && sessionBook.bookId) {
            try {
              var extra = localEntry(sessionBook);
              extra.inProgress = session.status !== "complete";
              list.push(extra);
            } catch (err) {
              /* ignore */
            }
          }
          return list.sort(function (a, b) {
            var as = (a.catalog && a.catalog.stamp) || "";
            var bs = (b.catalog && b.catalog.stamp) || "";
            return as < bs ? 1 : as > bs ? -1 : 0;
          });
        });
      });
    },

    removeLocal: function removeLocal(bookId) {
      var id = String(bookId || "");
      if (!id) return Promise.resolve({ ok: false, clearedSession: false });
      return storeDelete("catalog", id).then(function () {
        return storeGet("kv", "session");
      }).then(function (session) {
        var sessionId = (session && session.bookId) ||
          (session && session.book && session.book.bookId) || "";
        if (sessionId && sessionId === id) {
          return storeDelete("kv", "session").then(function () {
            return { ok: true, clearedSession: true };
          });
        }
        return { ok: true, clearedSession: false };
      });
    },

    openLocal: function openLocal(bookId) {
      return storeGet("catalog", bookId).then(function (entry) {
        if (!entry) return null;
        return runtimeFromEntry(entry);
      });
    },

    chooseFolder: function chooseFolder() {
      if (!canUseFolder()) return Promise.resolve(null);
      return window.showDirectoryPicker({ mode: "readwrite", id: "sbs-library" }).then(function (handle) {
        cachedHandle = handle;
        return storePut("kv", "dirHandle", handle).then(function () { return handle; });
      }).catch(function () {
        return null;
      });
    },

    currentFolder: function currentFolder() {
      return getHandle();
    },

    folderLabel: function folderLabel(handle) {
      return handle && handle.name ? handle.name : "";
    },

    writeFolder: function writeFolder(book) {
      return getHandle().then(function (handle) {
        return ensureHandle(handle);
      }).then(function (handle) {
        if (!handle) return { ok: false, reason: "folder" };
        return withExports(book).then(function (packed) {
          var zipBytes = SBS.zipStore(packed.files);
          var files = packed.files.concat([{ path: book.bookId + ".zip", data: zipBytes }]);
          return writeFiles(handle, files).then(function () {
            return { ok: true };
          });
        });
      }).catch(function () {
        return { ok: false, reason: "write" };
      });
    },

    importFolder: function importFolder() {
      return getHandle().then(function (handle) {
        return ensureHandle(handle);
      }).then(function (handle) {
        if (!handle) return [];
        return handle.getDirectoryHandle("catalog").then(function (catDir) {
          var names = [];
          var it = typeof catDir.values === "function"
            ? catDir.values()
            : (typeof catDir.entries === "function" ? catDir.entries() : null);
          if (!it) return [];
          function next() {
            return it.next().then(function (step) {
              if (step.done) return names;
              var value = step.value;
              var entry = value && value.kind ? value : (value && value[1]);
              if (entry && entry.kind === "file" && /\.catalog\.json$/.test(entry.name)) {
                names.push(entry.name);
              }
              return next();
            });
          }
          return next();
        }).then(function (names) {
          var chain = Promise.resolve();
          var loaded = [];
          names.forEach(function (name) {
            chain = chain.then(function () {
              return SBS.LibraryIO.openFromFolder(name.replace(/\.catalog\.json$/, "")).then(function (book) {
                if (book) {
                  loaded.push(book);
                  return SBS.LibraryIO.saveLocal(book);
                }
                return false;
              });
            });
          });
          return chain.then(function () { return loaded; });
        }).catch(function () {
          return [];
        });
      });
    },

    openFromFolder: function openFromFolder(bookId) {
      return getHandle().then(function (handle) {
        return ensureHandle(handle);
      }).then(function (root) {
        if (!root) return null;
        var catalogName = bookId + ".catalog.json";
        return root.getDirectoryHandle("catalog").then(function (catDir) {
          return readJsonFile(catDir, catalogName);
        }).then(function (catalog) {
          return Promise.all([
            root.getDirectoryHandle("intent").then(function (d) {
              return readJsonFile(d, bookId + ".intent.json");
            }),
            root.getDirectoryHandle("bible").then(function (d) {
              return readJsonFile(d, bookId + ".bible.json");
            }),
            root.getDirectoryHandle("book").then(function (d) {
              return d.getDirectoryHandle(bookId).then(function (bd) {
                return readJsonFile(bd, bookId + ".book.json").then(function (record) {
                  var urls = [];
                  var sheets = [];
                  var chain = Promise.resolve();
                  (record.spreads || []).forEach(function (s, i) {
                    chain = chain.then(function () {
                      return bd.getFileHandle(s.leftArt || pageFile(bookId, s.n)).then(function (fh) {
                        return fh.getFile().then(blobToDataUrl);
                      }).catch(function () { return ""; }).then(function (url) {
                        urls[i] = url;
                      });
                    });
                  });
                  var meta = (record.paths && record.paths.characterSheets) || [];
                  meta.forEach(function (row, i) {
                    chain = chain.then(function () {
                      if (!row || !row.file) {
                        sheets[i] = {
                          id: (row && row.id) || "",
                          url: "",
                          note: (row && row.note) || "",
                          source: (row && row.source) || ""
                        };
                        return;
                      }
                      return bd.getFileHandle(row.file).then(function (fh) {
                        return fh.getFile().then(blobToDataUrl);
                      }).catch(function () { return ""; }).then(function (url) {
                        sheets[i] = {
                          id: row.id || "",
                          url: url,
                          note: row.note || "",
                          source: row.source || ""
                        };
                      });
                    });
                  });
                  if (!meta.length && record.paths && record.paths.characterSheet) {
                    chain = chain.then(function () {
                      return bd.getFileHandle(record.paths.characterSheet).then(function (fh) {
                        return fh.getFile().then(blobToDataUrl);
                      }).catch(function () { return ""; }).then(function (url) {
                        if (url) {
                          sheets[0] = {
                            id: "",
                            url: url,
                            note: "",
                            source: ""
                          };
                        }
                      });
                    });
                  }
                  return chain.then(function () {
                    return [record, urls, sheets];
                  });
                });
              });
            })
          ]).then(function (parts) {
            return runtimeFromEntry({
              catalog: catalog,
              intent: parts[0],
              bible: parts[1],
              record: parts[2][0],
              arts: parts[2][1],
              characterSheets: parts[2][2],
              prompts: null
            });
          });
        });
      }).catch(function () {
        return null;
      });
    },

    sessionSave: function sessionSave(book, status, done, total) {
      return storePut("kv", "session", {
        bookId: book && book.bookId,
        title: book && book.title,
        status: status,
        done: done || 0,
        total: total || ((book && book.spreads) ? book.spreads.length : 0),
        updatedAt: Date.now(),
        book: book
      });
    },

    sessionLoad: function sessionLoad() {
      return storeGet("kv", "session");
    },

    sessionClear: function sessionClear() {
      return storeDelete("kv", "session");
    }
  };

  global.SBS = SBS;
})(window);
