/**
 * Robuster BibTeX-Parser + Formatierer für IEEE-Style
 * Die Konfiguration wird aus dem globalen Objekt 'bibtexConfig' gelesen.
 */

// Standardkonfiguration, falls das globale Objekt nicht existiert
const defaultConfig = {
    lang: "EN",
    abstract: false,
    list_of_contents: true,
    list_of_references: true,
    list_of_figures: true,
    list_of_tables: true,
    list_of_source_codes: true,
    list_of_abbreviations: true,
};

// Konfiguration laden
const config = window.bibtexConfig ? { ...defaultConfig, ...window.bibtexConfig } : defaultConfig;

// Destrukturierung für leichteren Zugriff in den Funktionen
const {
    lang,
    abstract,
    list_of_contents,
    list_of_references,
    list_of_figures,
    list_of_tables,
    list_of_source_codes,
    list_of_abbreviations,
} = config;

/**
 * Hilfsfunktionen (decodeLaTeXUmlauts, formatAuthors, formatPages, formatCitation)
 * (Diese bleiben unverändert, aber nutzen jetzt die 'config.lang' Variable)
 */

function decodeLaTeXUmlauts(str) {
    if (!str) return str;
    // ... (Der gesamte Inhalt von decodeLaTeXUmlauts bleibt hier unverändert)
    // Schritt 1: Spezielle LaTeX-Kommandos behandeln
    // Umlaute
    str = str.replace(/\\\"{?([aouAOU])}?/g, (match, p1) => {
        const map = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' };
        return map[p1] || p1;
    });

    // ß
    str = str.replace(/\\\"{?s}?/g, "ß");
    str = str.replace("\\ss{}", "ß");

    // Cedilla
    str = str.replace(/\\c\{([cCsS])\}/g, (match, p1) => {
        const map = { c: 'ç', C: 'Ç', s: 'ş', S: 'Ş' };
        return map[p1] || p1;
    });

    // Tilde
    str = str.replace(/\\~([nN])/g, (match, p1) => (p1 === 'n' ? 'ñ' : 'Ñ'));

    // Akzente
    str = str.replace(/\\([`']){?([aeiouAEIOU])}?/g, (match, accent, letter) => {
        const map = {
            "`a": "à", "'a": "á",
            "`e": "è", "'e": "é",
            "`i": "ì", "'i": "í",
            "`o": "ò", "'o": "ó",
            "`u": "ù", "'u": "ú",
        };
        return map[accent + letter] || letter;
    });

    // Ligaturen
    str = str.replace(/\\ae/g, "æ").replace(/\\AE/g, "Æ")
        .replace(/\\oe/g, "œ").replace(/\\OE/g, "Œ");

    // Schritt 2: ~ als normales Leerzeichen
    str = str.replace(/~/g, " ");

    // Schritt 3: Striche
    str = str.replace(/---/g, "—").replace(/--/g, "–");

    // Schritt 4: Übrig gebliebene geschweifte Klammern entfernen
    str = str.replace(/[{}]/g, '');

    return str;
}

function parseBibtex(bib) {
    const entries = {};
    let pos = 0;
    while (true) {
        const at = bib.indexOf('@', pos);
        if (at === -1) break;
        // Typ erkennen
        const typeMatch = bib.slice(at + 1).match(/^(\w+)\s*\{/);
        if (!typeMatch) { pos = at + 1; continue; }
        const type = typeMatch[1];
        const braceOpen = bib.indexOf('{', at + type.length + 1);
        if (braceOpen === -1) break;
        const comma = bib.indexOf(',', braceOpen + 1);
        if (comma === -1) break;
        const key = bib.slice(braceOpen + 1, comma).trim();

        // passende schließende } für den Eintrag finden (Brace-Counting)
        let i = braceOpen + 1;
        let depth = 1;
        while (i < bib.length && depth > 0) {
            i++;
            if (bib[i] === '{') depth++;
            else if (bib[i] === '}') depth--;
        }
        if (depth !== 0) break; // unbalancierte Klammern -> abbrechen

        const body = bib.slice(comma + 1, i).trim();

        // Felder parsen (robust gegenüber verschachtelten { } und "...")
        const fields = {};
        let idx = 0;
        while (idx < body.length) {
            // whitespace/comma überspringen
            while (idx < body.length && (/\s|,/.test(body[idx]))) idx++;
            if (idx >= body.length) break;

            // Feldname lesen
            let start = idx;
            while (idx < body.length && /[A-Za-z0-9_\-]/.test(body[idx])) idx++;
            const fname = body.slice(start, idx).trim().toLowerCase();
            // bis '=' springen
            while (idx < body.length && body[idx] !== '=') idx++;
            if (body[idx] !== '=') break;
            idx++; // '=' überspringen
            while (idx < body.length && /\s/.test(body[idx])) idx++;

            // Wert: { ... } oder "..." oder bare token
            if (body[idx] === '{') {
                let j = idx;
                let d = 0;
                do {
                    if (body[j] === '{') d++;
                    else if (body[j] === '}') d--;
                    j++;
                } while (j < body.length && d > 0);
                const val = body.slice(idx + 1, j - 1);
                fields[fname] = decodeLaTeXUmlauts(val.trim());
                idx = j;
            } else if (body[idx] === '"') {
                let j = idx + 1;
                while (j < body.length && body[j] !== '"') j++;
                fields[fname] = decodeLaTeXUmlauts(body.slice(idx + 1, j).trim());
                idx = j + 1;
            } else {
                let j = idx;
                while (j < body.length && body[j] !== ',') j++;
                fields[fname] = decodeLaTeXUmlauts(body.slice(idx, j).trim());
                idx = j;
            }
        }

        entries[key] = { type, key, fields };
        pos = i + 1;
    }
    return entries
}

function formatAuthors(authorsRaw) {
    if (!authorsRaw) return "";

    // geschweifte Klammern entfernen, mehrere Whitespaces reduzieren
    let s = authorsRaw.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();

    // Autoren nach "and" trennen
    const parts = s.split(/\s+and\s+/i).map(p => p.trim());

    // Jeden Autor ggf. drehen, falls "Nachname, Vorname" vorliegt
    const formatted = parts.map(a => {
        const commaIndex = a.indexOf(',');
        if (commaIndex !== -1) {
            // "Nachname, Vorname" -> "Vorname Nachname"
            const last = a.slice(0, commaIndex).trim();
            const first = a.slice(commaIndex + 1).trim();
            return first + ' ' + last;
        } else {
            return a; // bereits "Vorname Nachname"
        }
    });

    // Autorenliste zusammenfügen
    if (lang === "DE") {
        if (formatted.length === 1) return formatted[0];
        if (formatted.length === 2) return formatted[0] + ' und ' + formatted[1];
        const last = formatted.pop();
        return formatted.join(', ') + ', und ' + last;
    } else {
        if (formatted.length === 1) return formatted[0];
        if (formatted.length === 2) return formatted[0] + ' and ' + formatted[1];
        const last = formatted.pop();
        return formatted.join(', ') + ', and ' + last;
    }
}

function formatPages(p) {
    if (!p) return '';
    const pages = p.replace(/--/g, '–'); // Bindestrich korrigieren
    return lang === "DE" ? `S. ${pages}` : `pp. ${pages}`;
}

function formatCitation(entry, index) {
    const f = entry.fields || {};
    const type = (entry.type || '').toLowerCase();
    const authors = formatAuthors(f.author);

    // Titel robust dekodieren, {} nur für Großbuchstaben behalten
    let title = f.title ? decodeLaTeXUmlauts(f.title).trim() : '';
    title = title.replace(/\s+$/, ''); // trailing whitespace
    if (!title.endsWith('.')) title += '.'; // Punkt erzwingen

    // Hilfsfunktion für Online-Quellen
    let formatURL = f.url ? `[Online]. Available: <a href="${f.url}">${f.url}</a>` : '';
    if (lang === "DE") formatURL = formatURL.replace("Available", "Verfügbar");

    // Grundstruktur
    let citation = authors ? `[${index}] ${authors}, “${title}”` : `[${index}] “${title}”`;

    switch (type) {
        case 'article':
            if (f.journal) citation += ` ${f.journal}`;
            if (f.volume) citation += lang === "DE" ? `, Band ${f.volume}` : `, vol. ${f.volume}`;
            if (f.number) citation += lang === "DE" ? `, Nr. ${f.number}` : `, no. ${f.number}`;
            if (f.pages) citation += `, ${formatPages(f.pages)}`;
            if (f.month || f.year) citation += `, ${[f.month, f.year].filter(Boolean).join(' ')}`;
            break;

        case 'inproceedings':
        case 'conference':
            if (f.booktitle) citation += ` in ${f.booktitle}`;
            if (f.editor) citation += lang === "DE" ? `, Red. ${f.editor}` : `, Ed. ${f.editor}`;
            if (f.address) citation += `, ${f.address}`;
            if (f.pages) citation += `, ${formatPages(f.pages)}`;
            if (f.year) citation += `, ${f.year}`;
            break;

        case 'book':
            citation += ` ${f.publisher || ''}`;
            if (f.edition) citation += lang === "DE" ? `, Ausg. ${f.edition}` : `, ${f.edition} ed.`;
            if (f.address) citation += `, ${f.address}`;
            if (f.year) citation += `, ${f.year}`;
            break;

        case 'techreport':
            if (f.institution) citation += `, ${f.institution}`;
            if (f.number) citation += lang === "DE" ? `, Tech. Ber. ${f.number}` : `, Tech. Rep. ${f.number}`;
            if (f.year) citation += `, ${f.year}`;
            break;

        case 'misc':
        case 'online':
            if (f.howpublished) citation += ` ${f.howpublished}`;
            if (f.note) citation += `, ${f.note}`;
            if (f.url) citation += `, ${formatURL}`;
            if (f.year) citation += `, ${f.year}`;
            if (f.urldate) citation += `, ${lang === "DE" ? "Abgerufen" : "Accessed"}: ${f.urldate}`;
            break;

        default:
            if (f.journal) citation += ` ${f.journal}`;
            else if (f.booktitle) citation += ` ${f.booktitle}`;
            if (f.publisher) citation += `, ${f.publisher}`;
            if (f.year) citation += `, ${f.year}`;
            if (f.url) citation += `, ${formatURL}`;
    }

    return citation.trim();
}


/**
 * Hauptfunktionen, die die Konfiguration nutzen
 */

function updateHeaders() {
    const mapping = {
        abstract: { de: "Zusammenfassung", en: "Abstract", elements: ["abstract", "abstract-text"] },
        contents: { de: "Inhaltsverzeichnis", en: "List of contents", elements: ["contents", "contents-list"] },
        references: { de: "Quellen", en: "References", elements: ["references", "references-list"] },
        figures: { de: "Abbildungsverzeichnis", en: "List of figures", elements: ["figures", "figures-list"] },
        tables: { de: "Tabellenverzeichnis", en: "List of tables", elements: ["tables", "tables-list"] },
        source_codes: { de: "Quellcodeverzeichnis", en: "List of source codes", elements: ["source-codes", "source-codes-list"] },
        abbreviations: { de: "Abkürzungsverzeichnis", en: "List of abbreviations", elements: ["abbreviations", "abbreviations-list"] },
    };

    for (const key in mapping) {
        const item = mapping[key];
        const shouldList = config[`list_of_${key}`] !== undefined ? config[`list_of_${key}`] : config[key]; // Berücksichtigt auch "abstract"

        if (shouldList) {
            const id = item.elements[0];
            const element = document.getElementById(id);
            if (element) {
                element.innerText = lang === "DE" ? item.de : item.en;
            }
        } else {
            // Elemente entfernen
            item.elements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.remove();
            });
        }
    }
}

async function processCitations() {
    if (!list_of_references) return;

    let bibtexText = '';
    try {
        const res = await fetch('bibtex.bib');
        if (!res.ok) throw new Error('bibtex.bib konnte nicht geladen werden: ' + res.status);
        bibtexText = await res.text();
    } catch (e) {
        console.error('Fehler beim Laden der bibtex-Datei:', e);
        return;
    }

    const bibEntries = parseBibtex(bibtexText);

    // Textknoten sammeln
    const textNodes = [];
    function walk(node) {
        if (node.nodeType === 3) textNodes.push(node);
        else if (node.nodeType === 1) {
            const tag = node.tagName;
            if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(tag)) return;
            if (node.id === 'references-list') return;
            for (let child of node.childNodes) walk(child);
        }
    }
    walk(document.body);

    const citeRegex = /\[cite:([^\]]+)\]/g;
    let citeCounter = 1;
    const citeMap = {};

    textNodes.forEach(node => {
        const newHTML = node.nodeValue.replace(citeRegex, (match, key) => {
            key = key.trim();
            if (bibEntries[key]) {
                if (!(key in citeMap)) citeMap[key] = citeCounter++;
                const number = citeMap[key];
                return `<a href="#${key}">[${number}]</a>`;
            } else {
                return `[?]`;
            }
        });
        if (newHTML !== node.nodeValue) {
            const span = document.createElement('span');
            span.innerHTML = newHTML;
            node.parentNode.replaceChild(span, node);
        }
    });

    // Verzeichnis bauen
    const ol = document.getElementById('references-list');
    if (!ol) {
        console.warn('Kein Element mit id="references-list" gefunden.');
        return;
    }

    ol.style.listStyle = 'none';
    ol.style.paddingLeft = '0';

    const sortedKeys = Object.keys(citeMap).sort((a, b) => citeMap[a] - citeMap[b]);
    sortedKeys.forEach(key => {
        const entry = bibEntries[key];
        if (!entry) return;
        const li = document.createElement('li');
        li.id = key;
        li.style.marginBottom = '0.6em';
        li.innerHTML = formatCitation(entry, citeMap[key]);
        ol.appendChild(li);
    });
}

async function processChapters() {
    const chapters = document.querySelectorAll('.chapters');
    if (chapters.length === 0) return;

    // Ermitteln, welches Heading-Level die "höchste Ebene" ist (h1..h6)
    let minLevel = 6;
    chapters.forEach(h => {
        const level = parseInt(h.tagName.substring(1));
        if (level < minLevel) minLevel = level;
    });

    // Counter für Nummerierung (Kapitel / Unterkapitel / Unterunterkapitel)
    let counters = [0, 0, 0]; // [chapter, subsection, subsubsection]

    const toc = document.getElementById("contents-list");

    chapters.forEach(h => {
        const level = parseInt(h.tagName.substring(1)) - minLevel; // 0,1,2
        if (level < 0 || level > 2) return; // nur bis subsubsection

        // Counter anpassen
        if (level === 0) {
            counters[0]++; counters[1] = 0; counters[2] = 0;
        } else if (level === 1) {
            counters[1]++; counters[2] = 0;
        } else if (level === 2) {
            counters[2]++;
        }

        // Nummerierung bauen
        let num = counters.slice(0, level + 1).join(".");

        // id setzen (z. B. "chapter1.2.1")
        const id = "chapter" + num;
        h.id = id;

        if (!h.hasAttribute("data-name")) {
            // einfache Variante: ursprünglichen Text als "Name" speichern
            h.setAttribute("data-name", h.textContent.trim().toLowerCase().replace(/\s+/g, "-"));
        }

        // Titel um Nummer erweitern (außer bei speziellen Überschriften)
        const skipIds = ["title", "abstract", "contents", "references", "figures", "tables", "source-codes", "abbreviations"];
        if (!skipIds.includes(id) && !skipIds.includes(h.id)) {
            h.innerHTML = num + " " + h.innerHTML;
        }

        // Eintrag ins Inhaltsverzeichnis
        if (toc) {
            let li = document.createElement("li");
            li.style.marginLeft = (level * 20) + "px";
            li.innerHTML = `<a href="#${id}">${h.innerText}</a>`;
            toc.appendChild(li);
        }
    });

    const chapters_with_ids = document.querySelectorAll('.chapters');

    var chapterMap = {};
    chapters_with_ids.forEach(h => {
        //chapterMap[h.getAttribute("data-name").toString()] = '<a href="#' + h.id + ' title="' + h.innerText.toString() + '">' + lang == 'DE' ? 'Kapitel ' : 'Chapter ' + h.id.toString().replace('chapter', '') + '</a>';
        chapterMap[h.getAttribute("data-name")] = `<a href="#${h.id}" title="${h.innerText}">${lang === 'DE' ? 'Kapitel' : 'chapter'} ${h.id.replace('chapter', '')}</a>`;
    });

    // Verweise [ch:name] ersetzen
    const textNodes = [];
    function walk(node) {
        if (node.nodeType === 3) textNodes.push(node);
        else if (node.nodeType === 1) {
            if (["SCRIPT", "STYLE"].includes(node.tagName)) return;
            for (let child of node.childNodes) walk(child);
        }
    }
    walk(document.body);

    const refRegex = /\[ch:([^\]]+)\]/g;

    textNodes.forEach(node => {
        const newHTML = node.nodeValue.replace(refRegex, (match) => {
            const key = match.slice(1, -1); // [ch:introduction] -> ch:introduction
            if (chapterMap[key]) {
                return chapterMap[key]; // Link aus Mapping einsetzen
            } else {
                return "[?]"; // unbekannt
            }
        });

        if (newHTML !== node.nodeValue) {
            const span = document.createElement("span");
            span.innerHTML = newHTML;
            node.parentNode.replaceChild(span, node);
        }
    });
}

async function processAbbreviations() {
    if (!list_of_abbreviations) return;

    let abbrData = {};
    try {
        const response = await fetch("abbreviations.json");
        if (response.ok) {
            abbrData = await response.json();
        } else {
            console.warn('abbreviations.json nicht gefunden oder nicht lesbar. Fahre ohne JSON-Daten fort.');
        }
    } catch (e) {
        console.warn('Fehler beim Laden von abbreviations.json:', e);
    }

    const abbrTags = document.querySelectorAll("abbr");
    const abbrSet = new Map(); // Key: Abkürzung, Value: Langform

    abbrTags.forEach(abbr => {
        let text = abbr.textContent.trim();

        let key, value;

        if (abbrData[text]) {
            // Text ist Key in JSON
            key = text;
            value = abbrData[text];
        } else if (Object.values(abbrData).includes(text)) {
            // Text ist Value in JSON, Key suchen
            key = Object.keys(abbrData).find(k => abbrData[k] === text);
            value = text;
        } else {
            // Kein Eintrag in JSON → Text selbst als Key und Value
            key = text;
            value = text;
        }

        // title setzen
        abbr.setAttribute("title", value);

        // In <a> einpacken
        if (!abbr.parentElement || abbr.parentElement.tagName !== "A" || abbr.parentElement.getAttribute("href") === null) {
            const a = document.createElement("a");
            a.href = "#abbr:" + key.toLowerCase();
            abbr.parentNode.replaceChild(a, abbr);
            a.appendChild(abbr);
        }

        // Eintrag für Liste merken (Map verhindert doppelte Keys)
        if (!abbrSet.has(key)) {
            abbrSet.set(key, value);
        }
    });

    // Liste erzeugen
    const ol = document.getElementById("abbreviations-list");
    if (!ol) return; // Wenn das Element nicht existiert, abbrechen.
    ol.innerHTML = "";

    // Alphabetisch sortieren
    const sorted = Array.from(abbrSet.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    sorted.forEach(([key, value]) => {
        let li = document.createElement("li");

        let strong = document.createElement("strong");
        strong.id = "abbr:" + key.toLowerCase();
        strong.textContent = key;

        let dfn = document.createElement("dfn");
        dfn.textContent = value;

        li.appendChild(strong);
        li.appendChild(document.createTextNode(" "));
        li.appendChild(dfn);
        ol.appendChild(li);
    });
}

// ... (processFigures, processTables, processSourceCodes bleiben unverändert, nutzen aber 'lang' und die list_of_X Variablen)
async function processFigures() {
    if (!list_of_figures) return;

    const figures = document.querySelectorAll("figure.figures");
    if (figures.length === 0) return;

    const list = document.getElementById("figures-list");
    let counter = 0;

    figures.forEach(fig => {
        counter++;

        // Label je nach Sprache
        const label = (lang === "DE" ? "Abbildung" : "Figure") + " " + counter;

        // figcaption anpassen
        const caption = fig.querySelector("figcaption");
        if (caption) {
            // Originaltext ohne Nummerierung
            const originalText = caption.innerHTML;
            caption.innerHTML = `${label}: ${originalText}`;
            fig.id = fig.id || `fig:auto-${counter}`; // Sicherstellen, dass fig eine id hat
        }

        // Ins Verzeichnis (<ol id="figures-list">) eintragen
        if (list && caption) {
            let li = document.createElement("li");
            li.innerHTML = `<a href="#${fig.id}">${caption.innerText}</a>`; // InnerText, um Nummerierung zu bekommen
            list.appendChild(li);
        }
    });

    // Textverweise [fig:...] ersetzen
    const textNodes = [];
    function walk(node) {
        if (node.nodeType === 3) textNodes.push(node);
        else if (node.nodeType === 1) {
            if (["SCRIPT", "STYLE"].includes(node.tagName)) return;
            for (let child of node.childNodes) walk(child);
        }
    }
    walk(document.body);

    const refRegex = /\[fig:([^\]]+)\]/g;

    textNodes.forEach(node => {
        const newHTML = node.nodeValue.replace(refRegex, (match, name) => {
            const target = document.getElementById("fig:" + name);
            if (!target) return "[?]";

            // Index vom Figure herausfinden
            const idx = Array.from(figures).indexOf(target);
            if (idx === -1) return "[?]";

            const label = (lang === "DE" ? "Abbildung" : "Figure") + " " + (idx + 1);
            return `<a href="#${target.id}">${label}</a>`;
        });

        if (newHTML !== node.nodeValue) {
            const span = document.createElement("span");
            span.innerHTML = newHTML;
            node.parentNode.replaceChild(span, node);
        }
    });
}

async function processTables() {
    if (!list_of_tables) return;

    const tables = document.querySelectorAll("table.tables");
    if (tables.length === 0) return;

    const list = document.getElementById("tables-list");
    let counter = 0;

    tables.forEach(tbl => {
        counter++;

        // caption holen
        const captionEl = tbl.querySelector("caption .caption");
        if (!captionEl) return;

        // alten Text sichern & Präfix hinzufügen
        const oldCaption = captionEl.innerHTML;
        const prefix = (lang === "DE" ? "Tabelle " : "Table ") + counter + ": ";
        captionEl.innerHTML = prefix + oldCaption;

        tbl.id = tbl.id || `tbl:auto-${counter}`; // Sicherstellen, dass table eine id hat

        // Eintrag ins Tabellenverzeichnis
        if (list) {
            const li = document.createElement("li");
            li.innerHTML = `<a href="#${tbl.id}">${captionEl.innerText}</a>`;
            list.appendChild(li);
        }
    });

    // Verweise [tbl:...] im Text ersetzen
    const textNodes = [];
    function walk(node) {
        if (node.nodeType === 3) textNodes.push(node);
        else if (node.nodeType === 1) {
            if (["SCRIPT", "STYLE"].includes(node.tagName)) return;
            for (let child of node.childNodes) walk(child);
        }
    }
    walk(document.body);

    const refRegex = /\[tbl:([^\]]+)\]/g;

    textNodes.forEach(node => {
        const newHTML = node.nodeValue.replace(refRegex, (match, id) => {
            const target = document.getElementById("tbl:" + id);
            if (!target) return "[?]";

            // richtige Nummer aus caption holen
            const captionEl = target.querySelector("caption .caption");
            if (!captionEl) return "[?]";
            const number = captionEl.innerText.split(":")[0].replace(/\D/g, "").trim(); // "1"
            const prefix = (lang === "DE" ? "Tabelle " : "Table ");
            return `<a href="#${target.id}">${prefix}${number}</a>`;
        });

        if (newHTML !== node.nodeValue) {
            const span = document.createElement("span");
            span.innerHTML = newHTML;
            node.parentNode.replaceChild(span, node);
        }
    });
}

async function processSourceCodes() {
    if (!list_of_source_codes) return;

    const sources = document.querySelectorAll("figure.source-codes");
    if (sources.length === 0) return;

    const list = document.getElementById("source-codes-list");
    let counter = 0;

    sources.forEach(src => {
        counter++;

        // figcaption holen
        const captionEl = src.querySelector("figcaption");
        if (!captionEl) return;

        const oldCaption = captionEl.innerHTML;
        const prefix = (lang === "DE" ? "Quellcode " : "Source code ") + counter + ": ";
        captionEl.innerHTML = prefix + oldCaption;

        src.id = src.id || `src:auto-${counter}`; // Sicherstellen, dass figure eine id hat

        // Eintrag ins Source-Code-Verzeichnis
        if (list) {
            const li = document.createElement("li");
            li.innerHTML = `<a href="#${src.id}">${captionEl.innerText}</a>`;
            list.appendChild(li);
        }
    });

    // Verweise [src:...] im Text ersetzen
    const textNodes = [];
    function walk(node) {
        if (node.nodeType === 3) textNodes.push(node);
        else if (node.nodeType === 1) {
            if (["SCRIPT", "STYLE"].includes(node.tagName)) return;
            for (let child of node.childNodes) walk(child);
        }
    }
    walk(document.body);

    const refRegex = /\[src:([^\]]+)\]/g;

    textNodes.forEach(node => {
        const newHTML = node.nodeValue.replace(refRegex, (match, id) => {
            const target = document.getElementById("src:" + id);
            if (!target) return "[?]";

            const captionEl = target.querySelector("figcaption");
            if (!captionEl) return "[?]";

            const number = captionEl.innerText.split(":")[0].replace(/\D/g, "").trim(); // "1"
            const prefix = (lang === "DE" ? "Quellcode " : "Source code ");
            return `<a href="#${target.id}">${prefix}${number}</a>`;
        });

        if (newHTML !== node.nodeValue) {
            const span = document.createElement("span");
            span.innerHTML = newHTML;
            node.parentNode.replaceChild(span, node);
        }
    });
}


/**
 * Haupt-Initialisierungsfunktion
 */
function initializeBibtexFormatter() {
    updateHeaders();
    // Alle asynchronen Funktionen parallel ausführen
    Promise.all([
        processCitations(),
        processChapters(),
        processAbbreviations(),
        processFigures(),
        processTables(),
        processSourceCodes()
    ]).catch(error => {
        console.error("Ein Fehler ist bei der Verarbeitung aufgetreten:", error);
    });
}

// Nach dem Laden des DOM starten
document.addEventListener('DOMContentLoaded', initializeBibtexFormatter);
