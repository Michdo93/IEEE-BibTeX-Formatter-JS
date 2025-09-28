# IEEE-BibTeX-Formatter-JS
The IEEE BibTeX Formatter JS Library formats citations in IEEE style and adds them to a source directory. Additional features include the creation of a table of contents, list of figures, tables, source code and abbreviations. Corresponding links are added to the HTML code. This is ideal for integrating a scientific style into your website.

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
| **Reference Source** | `... according to.` | Use **\`\`**. The `BIBTEX_KEY` must match an entry key in your \`bibtex.bib\` file (e.g., \`@article{pytorch, ...}\`). As example \`[cite:pytorch]\`. |

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
