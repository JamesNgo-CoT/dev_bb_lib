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

## MAIN JAVASCRIPT

``` JavaScript
$(function () {
  const APP_TITLE = 'Tester';

  const app = new cot_app(APP_TITLE, {
    hasContentTop: false,
    hasContentBottom: false,
    hasContentRight: false,
    hasContentLeft: false,
    searchcontext: 'INTRA'
  });

  app.setBreadcrumb([
    { 'name': APP_TITLE, 'link': '#home' }
  ], true);

  app.render();

  app.container = document.getElementById('tester_container');
  app.mainViewContainer = app.container.appendChild(document.createElement('div'));

  app.mainView = new LoadingPageView();
  app.mainViewContainer.appendChild(app.mainView.el);
  app.mainView.render();

  app.models = {};

  //////////////////////////////////////////////////////////////////////////////

  const LoginModel = AE.BB.LoginModel.extend({
    urlRoot: '/* @echo C3AUTH_URL */',
    app: APP_TITLE
  });

  AE.Shared.loginModel = new LoginModel();

  const LoginButtonView = AE.BB.Comp.LoginButtonView.extend({
    className: 'loginButtonView'
  });

  const loginButtonView = new LoginButtonView();
  const lockIcon = document.querySelector('.securesite img');
  lockIcon.parentNode.insertBefore(loginButtonView.el, lockIcon);
  loginButtonView.render();

  //////////////////////////////////////////////////////////////////////////////

  const DialogView = AE.BB.Comp.DialogView.extend({
    className: 'dialogView',
  });

  AE.Shared.dialogView = new DialogView({ model: new AE.BB.Comp.DialogModel() });
  app.container.appendChild(AE.Shared.dialogView.el);
  AE.Shared.dialogView.render();

  //////////////////////////////////////////////////////////////////////////////

  const Router = AE.BB.Router.extend({

    // Overriden Property

    routes: {
      'home': 'routeHomePage',
      'login': 'routeLoginPage',
      '*default': 'routeDefault'
    },

    // New Properties

    routeHomePage() {
      const loginModel = AE.Shared.loginModel;
      return loginModel.authentication()
        .then(isLoggedIn => {
          if (!isLoggedIn) {
            this.navigate(loginButtonView.fullLoginFragment(), { trigger: true });
          } else {
            return Promise.resolve()
              .then(() => {
                return app.mainView.swapWith(new HomePageView());
              })
              .then(newMainView => {
                app.mainView = newMainView;

                app.mainView.listenTo(loginModel, 'change', () => {
                  if (!loginModel.isLoggedIn()) {
                    AE.BB.restartRouter();
                  }
                });

                app.setTitle(APP_TITLE);
                app.setBreadcrumb([
                  app.breadcrumbItems[0]
                ], true);

                if (this._showFocus) {
                  app.titleElement.focus();
                } else {
                  this._showFocus = true;
                }
              });
          }
        });
    },

    routeLoginPage(queryString) {
      const loginModel = AE.Shared.loginModel;
      return loginModel.authentication()
        .then(isLoggedIn => {
          if (isLoggedIn) {
            const queryObject = AE.Util.toQueryObject(queryString);
            if (queryObject && queryObject.redirect != null) {
              this.navigate(queryObject.redirect, { trigger: true });
            } else {
              const defaultFragment = _.result(this, 'defaultFragment');
              this.navigate(defaultFragment, { trigger: true });
            }
          } else {
            return Promise.resolve()
              .then(() => {
                return app.mainView.swapWith(new LoginPageView());
              })
              .then(newMainView => {
                app.mainView = newMainView;

                app.mainView.on('success', () => {
                  AE.BB.restartRouter();
                });

                app.setTitle('Login');
                app.setBreadcrumb([
                  app.breadcrumbItems[0],
                  { name: 'Login' }
                ], true);

                if (this._showFocus) {
                  app.titleElement.focus();
                } else {
                  this._showFocus = true;
                }

                loginButtonView.hide();

                return () => {
                  loginButtonView.show();
                }
              });
          }
        });
    }
  });

  const router = new Router();
  router.on('route', () => {
    loginButtonView.render();
  });

  //////////////////////////////////////////////////////////////////////////////

  Backbone.history.start();
});
```
