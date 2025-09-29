# IEEE-BibTeX-Formatter-JS
The IEEE BibTeX Formatter JS Library formats citations in IEEE style and adds them to a source directory. Additional features include the creation of a table of contents, list of figures, tables, source code and abbreviations. Corresponding links are added to the HTML code. This is ideal for integrating a scientific style into your website.

> **_NOTE:_**  This is neither a parser nor a converter. It does not generate PDF files either. It simply allows you to display citations and sources on websites in accordance with the IEEE standard using the BibTeX format. Style differences such as page layouts, fonts, and line spacing are not included, as I believe this would detract from the individual design of websites.

## 1\. Core Setup and Configuration

The script's behavior is controlled by a global configuration object, `window.bibtexConfig`, which must be defined **before** including the main JavaScript file (`ieee-bibtex-formatter.js`).

### HTML Structure and Script Import

Place the following configuration block and script tag near the end of your `<body>`.

```html
<script>
    window.bibtexConfig = {
        // Language setting: "DE" for German, anything else (e.g., "EN") for English.
        lang: "DE",
        
        // --- List Inclusion Flags (true/false) ---
        abstract: false, // Enable/Disable the Abstract section.
        list_of_contents: true, // Enable/Disable the Table of Contents.
        list_of_references: true, // Enable/Disable the List of References (Sources).
        list_of_figures: true, // Enable/Disable the List of Figures.
        list_of_tables: true, // Enable/Disable the List of Tables.
        list_of_source_codes: true, // Enable/Disable the List of Source Codes.
        list_of_abbreviations: true // Enable/Disable the List of Abbreviations (requires abbreviations.json).
    };
</script>

<script src="ieee-bibtex-formatter.js"></script>
```

-----

## 2\. Dynamic List Placeholders (HTML)

The script automatically populates lists by searching for specific `id` attributes. You must include these placeholders in your HTML where you want the lists to appear. The script will automatically insert the correct header text based on the `lang` configuration (`Quellen` or `References`, etc.).

| Element Type      | Required `id`                                          | Example HTML Structure                                                               |
| :---------------- | :----------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **References**    | `references` (Header) & `references-list` (List)       | `<h2 id="references">References</h2><ol id="references-list"></ol>`                     |
| **Figures**       | `figures` (Header) & `figures-list` (List)             | `<h2 id="figures">List of figures</h2><ol id="figures-list"></ol>`             |
| **Tables**        | `tables` (Header) & `tables-list` (List)               | `<h2 id="tables">List of tables</h2><ol id="tables-list"></ol>`                 |
| **Source Codes**  | `source-codes` (Header) & `source-codes-list` (List)   | `<h2 id="source-codes">List of source codes</h2><ol id="source-codes-list"></ol>`    |
| **Abbreviations** | `abbreviations` (Header) & `abbreviations-list` (List) | `<h2 id="abbreviations">List of abbreviations</h2><ol id="abbreviations-list"></ol>` |
| **Contents**      | `contents` (Header) & `contents-list` (List)           | `<h2 id="contents">Table of contents</h2><ol id="contents-list"></ol>`              |

-----

## 3\. Syntax for Content Elements and Cross-References

The script relies on specific HTML attributes and inline placeholder syntax to process and number your document elements.

### A. Chapters (Table of Contents)

To automatically number your headings (e.g., "1. Introduction", "1.1 Subsection") and generate the table of contents:

| Action                | HTML/Inline Syntax                                                   | Description                                                                                                                                                                                           |
| :-------------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Define Chapter**    | `<h2 class="chapters" data-name="ch:introduction">Introduction</h2>` | Add the **`class="chapters"`** to any `h1` through `h6`. The script finds the highest level (e.g., `h2`) and starts numbering from there. The **`data-name`** is used for internal cross-referencing. |
| **Reference Chapter** | `As shown in [ch:introduction], ...`                                 | Use the syntax **`[ch:DATA_NAME]`** where `DATA_NAME` is the value from the `data-name` attribute (e.g., `ch:introduction`).                                                                          |

### B. Citations (References)

The script requires a **`bibtex.bib`** file in the same directory.

| Action               | Inline Syntax       | Description                                                                                                            |
| :------------------- | :------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| **Reference Source** | `... according to.` | Use **\`\`**. The `BIBTEX_KEY` must match an entry key in your \`bibtex.bib\` file (e.g., \`@article{pytorch, ...}\`). As example `[cite:pytorch]`. |

### C. Figures, Tables, and Source Codes

These elements require both a `class` and an `id` to be correctly numbered and referenced.

| Element Type    | Required Class / ID                            | Reference Syntax | Example                                      |
| :-------------- | :--------------------------------------------- | :--------------- | :------------------------------------------- |
| **Figure**      | `<figure class="figures" id="fig:my_id">`      | `[fig:my_id]`    | `As seen in [fig:my_id], ...`             |
| **Table**       | `<table class="tables" id="tbl:my_id">`        | `[tbl:my_id]`    | `The data in [tbl:my_id] shows...`   |
| **Source Code** | `<figure class="source-codes" id="src:my_id">` | `[src:my_id]`    | `The snippet in [src:my_id] illustrates...` |

**Important for Figures and Source Codes:** Ensure the caption is inside a `<figcaption>` (tables: inside `<caption>` tag). The script automatically prefixes the caption with the correct number and label (e.g., "Figure 1: ...").

### D. Abbreviations

The script reads abbreviations from `<abbr>` tags in the HTML and optionally from an **`abbreviations.json`** file.

| Action          | HTML Structure                                             | JSON Data (Optional)                                    | Description                                                                                                                                                                                |
| :-------------- | :--------------------------------------------------------- | :------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Define Abbr** | `<abbr>HTML</abbr>` or `<abbr>Hyper Text Markup Language</abbr>` | A file named `abbreviations.json` in the document root. | The script searches for `<abbr>` tags, tries to resolve the full form using the JSON file, sets the `title` attribute, and generates the **List of Abbreviations** (`abbreviations-list`). |
| **JSON Format** | N/A                                                        | `{"HTML": "Hyper Text Markup Language", "JS": "JavaScript"}`  | The key is the abbreviation; the value is the long form.                                                                                                                                   |

## 4\. Full example

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Wissenschaftlicher Bericht mit BibTeX-Formatter</title>
    <link rel="stylesheet" href="ieee-bibtex-formatter.css">
</head>
<body>

    <h1>Title of the scientific report</h1>
    
    <h2 id="contents">Table of contents</h2>
    <ol id="contents-list"></ol>

    <h2 id="abbreviations">List of abbreviations</h2>
    <ol id="abbreviations-list"></ol>

    <h2 class="chapters" data-name="ch:introduction">Introdcution into the web technology</h2>
    <p>
        The foundations of the modern web are based on three pillars: <abbr>HTML</abbr>, <abbr>CSS</abbr>, and <abbr>JS</abbr>. These technologies enable the creation of complex, interactive applications. This work focuses on performance optimization. An essential aspect is the correct use of <abbr>DOM</abbr>.
    </p>
    <p>
        As shown in chapter [ch:methodology], the speed of data processing is crucial.
    </p>

    <figure class="figures" id="fig:web_stack">
        <img src="https://via.placeholder.com/600x200?text=Web+Stack+Diagramm" alt="Diagram of the web technology stack">
        <figcaption>Schematic representation of the modern web stack.</figcaption>
    </figure>
    <p>
        Figure [fig:web_stack] shows the hierarchical dependency of the components.
    </p>

    <h2 class="chapters" data-name="ch:methodology">Methodology and implementation</h2>

    <h3 class="chapters" data-name="ch:methodology_data">Data collection and preparation</h3>
    <p>
        A series of benchmarks were performed to evaluate performance (see Table [tbl:benchmarks]). The algorithms were implemented in Python.
    </p>

    <figure class="source-codes" id="src:python_script">
        <figcaption>Python script for data cleansing</figcaption>
        <pre><code class="language-python">
import pandas as pd
df = pd.read_csv('data.csv')
df['cleaned'] = df['raw'].str.strip()
print("Adjustment completed.")
        </code></pre>
    </figure>
    <p>
        The code block used is shown in source code [src:python_script].
    </p>

    <table class="tables" id="tbl:benchmarks">
        <caption><span class="caption">Benchmark results (loading time in ms)</span></caption>
        <thead>
            <tr>
                <th>Edge</th>
                <th>Min</th>
                <th>Max</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Chrome</td>
                <td>120</td>
                <td>150</td>
            </tr>
            <tr>
                <td>Firefox</td>
                <td>135</td>
                <td>160</td>
            </tr>
        </tbody>
    </table>

    <h2 class="chapters" data-name="ch:conclusion">Summary</h2>
    <p>
        The results confirm the hypothesis. All references can be found in the sources [cite:Michdo93].
    </p>
    
    <h2 id="figures">List of figures</h2>
    <ol id="figures-list"></ol>

    <h2 id="tables">List of tables</h2>
    <ol id="tables-list"></ol>

    <h2 id="source-codes">List of source codes</h2>
    <ol id="source-codes-list"></ol>

    <h2 id="references">List of references</h2>
    <ol id="references-list"></ol>

    <script>
        window.bibtexConfig = {
            lang: "EN", // you can choose between EN or DE
            abstract: false,
            list_of_contents: true,
            list_of_references: true,
            list_of_figures: true,
            list_of_tables: true,
            list_of_source_codes: true,
            list_of_abbreviations: true // needs abbreviations.json
        };
    </script>
    <script src="ieee-bibtex-formatter.js"></script>

</body>
</html>
```

In this case, abbreviations.json would look as follows:

```
{
    "HTML": "Hypertext Markup Language",
    "CSS": "Cascading Style Sheets",
    "JS": "JavaScript",
}
```

In this very simple example, the bibtex.bib file would also show only a single source and would look like this.

```
@misc{Michdo93,
    author        = {Michael Christian Dörflinger},
    title         = {{G}it{H}ub - {M}ichdo93/{I}{E}{E}{E}-{B}ib{T}e{X}-{F}ormatter-{J}{S}: {T}he {I}{E}{E}{E} {B}ib{T}e{X} {F}ormatter {J}{S} {L}ibrary formats citations in {I}{E}{E}{E} style and adds them to a source directory. {A}dditional features include the creation of a table of contents, list of figures, tables, source code and abbreviations. {C}orresponding links are added to the {H}{T}{M}{L} code. {T}his is ideal for integrating a scientific style into your website. --- github.com},
    howpublished  = {\url{https://github.com/Michdo93/IEEE-BibTeX-Formatter-JS/}},
    year          = {},
    note          = {[Accessed 29-09-2025]}
}
```

> **_NOTE:_**  Many more sources may also be listed. They only appear in the list of sources when a source is cited/used accordingly.
