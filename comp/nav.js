const NavItemModel = Backbone.BaseModel.extend({
  defaults: {
    title: 'Untitled',
    fragment: '',
    isActive: false,
    isVisible: true,
    requiresLogin: false
  }
});

////////////////////////////////////////////////////////////////////////////////

const NavItemView = Backbone.BaseView.extend({
  tagName: 'li',
  attributes: { role: 'presentation' },

  initialize(options) {
    this.listenTo(options.model, 'change', () => {
      this.render();
    });

    Backbone.BaseView.prototype.initialize.call(this, options);
  },

  render() {
    this.el.innerHTML = `<a href="#${this.model.escape('fragment')}">${this.model.escape('title')}</a>`;

    if (this.model.get('isActive')) {
      this.el.classList.add('active');
    } else {
      this.el.classList.remove('active');
    }

    if (this.model.get('isVisible')) {
      this.el.classList.remove('hide');
    } else {
      this.el.classList.add('hide');
    }

    return Backbone.BaseView.prototype.render.call(this);
  }
});

////////////////////////////////////////////////////////////////////////////////

const AuthyNavItemView = NavItemView.extend({
  initialize(options) {
    const authModel = _.result(this, 'authModel') || _.result(Backbone, 'authModel');
    this.listenTo(authModel, 'change', () => {
      this.render();
    });

    return NavItemView.prototype.initialize.call(this, options);
  },

  render() {
    return NavItemView.prototype.render.call(this)
      .then(() => {
        const authModel = _.result(this, 'authModel') || _.result(Backbone, 'authModel');
        if (authModel && authModel.isLoggedIn()) {
          this.el.classList.remove('hide');
        } else {
          this.el.classList.add('hide');
        }
      });
  }
});

////////////////////////////////////////////////////////////////////////////////

const NavCollection = Backbone.BaseCollection.extend({
  model: NavItemModel,

  setActive(index) {
    this.each((model, modelIndex) => {
      if (index === modelIndex) {
        model.set('isActive', true);
      } else {
        model.set('isActive', false);
      }
    });
  }
});

////////////////////////////////////////////////////////////////////////////////

const NavView = Backbone.BaseView.extend({
  attributes: { role: 'navigation' },

  initialize(options) {
    this.navItems = [];

    this.listenTo(options.collection, 'update', () => {
      this.render();
    });

    Backbone.BaseView.prototype.initialize.call(this, options);
  },

  removeNavItems() {
    this.navItems.forEach(navItem => navItem.remove());
    this.navItems = [];
  },

  remove() {
    this.removeNavItems();
    Backbone.BaseView.prototype.remove.call(this);
  },

  render() {
    this.removeNavItems();
    while (this.el.firstChild) {
      this.removeChild(this.el.firstChild);
    }

    const wrapper = this.el.appendChild(document.createElement('ul'));
    wrapper.classList.add('nav', 'nav-tabs');

    const navItemViewRenderPromises = [];
    this.collection.each(model => {
      let navItemView;
      if (model.get('requiresLogin')) {
        navItemView = new AuthyNavItemView({ model, authModel: this.authModel });
      } else {
        navItemView = new NavItemView({ model });
      }

      if (navItemView) {
        wrapper.appendChild(navItemView.el);
        navItemViewRenderPromises.push(navItemView.render());
        this.navItems.push(navItemView);
      }
    });

    return Promise.all(navItemViewRenderPromises)
      .then(() => {
        return Backbone.BaseView.prototype.render.call(this);
      });
  }
});
