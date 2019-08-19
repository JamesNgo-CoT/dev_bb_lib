# Base Library

## Usage

### GIT

Add the library as a submodule to your CoT project.

```shell
git submodule add https://github.com/JamesNgo-CoT/dev_bb_lib.git src/scripts/lib
```

### NPM

Install dependencies to your CoT projects.

```shell
npm install CityofToronto/fepe_datatables.git datatables.net-buttons datatables.net-buttons-bs jszip pdfmake
```

### PACKAGE JSON

Update your CoT project's coreConfig to include the "base" requirement.

```JSON
{
  "coreConfig": {
    "isEmbedded": false,
    "includeFormValidation": true,
    "includeEditableSelect": false,
    "includeIntlTelInput": false,
    "includeJQueryMaskedInput": false,
    "includePlaceholders": false,
    "includeMultiSelect": false,
    "includeMap": false,
    "includeFullCalendar": false,
    "includeDatePicker": false,
    "includeLogin": false,
    "includeRangePicker": false,
    "includeMoment": false,
    "includeModeling": true,
    "includeWebtrends": false,
    "isInternetStandaloneApp": false,
    "includeDropzone": false,
    "includeModal": false,
    "includeTerms": false
  }
}
```

### HTML

Add the required markup to your CoT project.

```HTML
<!-- Datatable -->
<link rel="stylesheet" href="/node_modules/datatables/src/lib/datatables.min.css">
<link rel="stylesheet" href="/node_modules/datatables.net-buttons-bs/css/buttons.bootstrap.css">

...

<!-- Datatable -->
<script src="/node_modules/jszip/dist/jszip.js"></script>
<script src="/node_modules/pdfmake/build/pdfmake.js"></script>
<script src="/node_modules/pdfmake/build/vfs_fonts.js"></script>
<script src="/node_modules/datatables/src/lib/datatables.min.js"></script>
<script src="/node_modules/datatables.net-buttons/js/dataTables.buttons.js"></script>
<script src="/node_modules/datatables.net-buttons/js/buttons.html5.js"></script>
<script src="/node_modules/datatables.net-buttons/js/buttons.print.js"></script>
<script src="/node_modules/datatables.net-buttons-bs/js/buttons.bootstrap.js"></script>

<!-- Base -->
<script src="<!-- @echo SRC_PATH -->/scripts/lib/base.js"></script>

<!-- Base Components -->
<script src="<!-- @echo SRC_PATH -->/scripts/lib/login_button.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/alert.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/form.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/login_form.js"></script>

<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/nav.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/dialog.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/login_form_dialog.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/datatable.js"></script>
```

SCSS

Inherit base component's styles.

```SCSS
@import "../scripts/lib/login_button.scss";
@import "../scripts/lib/form.scss";
@import "../scripts/lib/login_form.scss";

.securesite {
  @extend %LoginButtonViewRoot;

  position: relative;

  [data-view="LoginButtonView"] {
    position: absolute;
    right: 65px;
    top: 8px;
  }
}

#maincontent {
  #dev_bb_lib_proj_container {
    @extend %FormViewRoot;
    @extend %LoginFormViewRoot;
  }
}
```

## Login Implementations


