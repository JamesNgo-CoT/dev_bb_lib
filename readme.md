# App Essentials

## GIT

``` shell
git submodule add https://github.com/JamesNgo-CoT/dev_bb_lib.git lib
```

## NPM

``` shell
npm install CityofToronto/fepe_datatables.git datatables.net-buttons datatables.net-buttons-bs jszip pdfmake
```

## HTML

``` HTML
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

<!-- Core -->
<script src="<!-- @echo SRC_PATH -->/scripts/lib/base.js"></script>

<!-- Components -->
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/login_button.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/nav.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/alert.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/form.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/login_form.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/dialog.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/login_form_dialog.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/datatable.js"></script>
```

## PACKAGE JSON

``` JSON
{
  "coreConfig": {
    "includeFormValidation": true,
    "includeModeling": true,
  }
}
```
