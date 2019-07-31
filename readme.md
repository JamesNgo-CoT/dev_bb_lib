# App Essentials

## GIT

``` shell
git submodule add https://github.com/JamesNgo-CoT/dev_bb_lib.git lib
```

## NPM

``` shell
npm install datatables.net datatables.net-bs datatables.net-buttons datatables.net-buttons-bs jszip pdfmake
```

## HTML

``` HTML
<!-- Datatable -->
<link rel="stylesheet" href="/node_modules/datatables.net-bs/css/dataTables.bootstrap.css">
<link rel="stylesheet" href="/node_modules/datatables.net-buttons-bs/css/buttons.bootstrap.css">

...

<!-- Datatable -->
<script src="/node_modules/jszip/dist/jszip.js"></script>
<script src="/node_modules/pdfmake/build/pdfmake.js"></script>
<script src="/node_modules/pdfmake/build/vfs_fonts.js"></script>
<script src="/node_modules/datatables.net/js/jquery.dataTables.js"></script>
<script src="/node_modules/datatables.net-bs/js/dataTables.bootstrap.js"></script>
<script src="/node_modules/datatables.net-buttons/js/dataTables.buttons.js"></script>
<script src="/node_modules/datatables.net-buttons/js/buttons.html5.js"></script>
<script src="/node_modules/datatables.net-buttons/js/buttons.print.js"></script>
<script src="/node_modules/datatables.net-buttons-bs/js/buttons.bootstrap.js"></script>

<!-- Core -->
<script src="<!-- @echo SRC_PATH -->/scripts/lib/app_essentials.js"></script>

<!-- Components -->
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/loginbutton.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/dialog.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/alert.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/form.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/loginform.js"></script>
<script src="<!-- @echo SRC_PATH -->/scripts/lib/comp/nav.js"></script>
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
