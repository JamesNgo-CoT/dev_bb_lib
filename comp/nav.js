const NavItemModel = Backbone.BaseModel.extend({

});



class NavItemModel extends BaseModel {
  defaults() {
    return {
      title: 'Untitled',
      fragment: '',
      isActive: false,
      isVisible: true,
      requiresLogin: false
    };
  }
}

/* exported NavItemView */
class NavItemView extends BaseView {
  initialize(options) {
    this.listenTo(options.model, 'change', () => {
      this.render();
    });

    super.initialize(options);
  }

  tagName() {
    return 'li';
  }

  attributes() {
    return { role: 'presentation' };
  }

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

    return super.render();
  }
}

/* exported AuthyNavItemView */
class AuthyNavItemView extends NavItemView {
  initialize(options) {
    const authModel = _.result(Backbone, 'authModel');
    this.listenTo(authModel, 'change', () => {
      this.render();
    });

    return super.initialize(options);
  }

  render() {
    super.render();

    const authModel = _.result(Backbone, 'authModel');
    if (authModel && authModel.isLoggedIn()) {
      this.el.classList.remove('hide');
    } else {
      this.el.classList.add('hide');
    }
  }
}

/* exported NavCollection */
class NavCollection extends BaseCollection {
  model(attributes, options) {
    return new NavItemModel(attributes, options);
  }

  setActive(index) {
    this.each((model, modelIndex) => {
      if (index === modelIndex) {
        model.set('isActive', true);
      } else {
        model.set('isActive', false);
      }
    });
  }
}

/* exported NavView */
class NavView extends BaseView {
  preinitialize(options = {}) {

    // New property-factory override
    this.navItemView = options.navItemView || this.navItemView;

    // New property
    this.navItems = [];

    super.preinitialize(options);
  }

  initialize(options) {
    this.listenTo(options.collection, 'update', () => {
      this.render();
    });

    super.initialize(options);
  }

  attributes() {
    return { role: 'navigation' };
  }

  removeNavItems() {
    this.navItems.forEach(navItem => navItem.remove());
    this.navItems = [];
  }

  remove() {
    this.removeNavItems();
    super.remove();
  }

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
        navItemView = new AuthyNavItemView({ model });
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
        return super.render();
      });
  }
}
