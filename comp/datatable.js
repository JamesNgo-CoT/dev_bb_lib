const DatatableView = Backbone.BaseView.extend({
  initialize(options = {}) {
    if (options.webStorage) {
      this.webStorage = options.webStorage;
    }
    if (options.webStorageKey) {
      this.webStorageKey = options.webStorageKey;
    }

    Backbone.BaseView.prototype.initialize.call(this, options);
  },

  datatableDefinition: {
    columns: [
      {
        title: 'Column 1',
        data: 'col1'
      },
      {
        title: 'Column 2',
        data: 'col2'
      },
      {
        title: 'Column 3',
        data: 'col3'
      },
      {
        className: 'excludeFromButtons',
        data: 'id',
        orderable: false,
        render(data) {
          return '<a href=#apps/' + data + ' class=btn btn-default>View</a>';
        },
        searchable: false,
        width: '57px'
      }
    ],
    data: [
      { col1: 'Data (1, 1)', col2: 'Data (1, 2)', col3: 'Data (1, 3)' },
      { col1: 'Data (1, 2)', col2: 'Data (2, 2)', col3: 'Data (3, 3)' },
      { col1: 'Data (1, 3)', col2: 'Data (2, 3)', col3: 'Data (3, 3)' }
    ]
  },

  buttons() {
    return [{
      extend: 'copyHtml5',
      exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
      title: this.title
    }, {
      extend: 'csvHtml5',
      exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
      title: this.title
    }, {
      extend: 'excelHtml5',
      exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
      title: this.title
    }, {
      extend: 'pdfHtml5',
      exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
      title: this.title
    }, {
      extend: 'print',
      exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
      title: this.title
    }]
  },

  dom: `<'row'<'col-sm-6'l><'col-sm-6'f>><'row'<'col-sm-12'<'table-responsive'tr>>><'row'<'col-sm-5'i><'col-sm-7'p>>B`,

  stateSave: false,

  webStorage: function () {
    return _.result(this.collection, 'webStorage') || localStorage;
  },

  removeDatatable() {
    if (this.datatable) {
      this.datatable.destroy();
      this.datatable = null;
    }
  },

  remove() {
    this.removeDatatable();
    Backbone.BaseView.prototype.remove.call(this);
  },

  render() {

    // Clean up.
    this.removeDatatable();
    while (this.el.firstChild) {
      this.removeChild(this.el.firstChild);
    }

    let datatableDefinition = _.result(this, 'datatableDefinition');

    return Promise.resolve()
      .then(() => {
        if (typeof datatableDefinition === 'string') {
          return ajax({
            url: datatableDefinition
          }).then((data) => {
            datatableDefinition = data;
          });
        }
      })
      .then(() => {
        if (datatableDefinition.scripts) {
          return loadScripts(...datatableDefinition.scripts);
        }
      })
      .then(() => {

        // Finalize definition/configuration.
        datatableDefinition.buttons = _.result(datatableDefinition, 'buttons') || _.result(this, 'buttons');
        datatableDefinition.dom = _.result(datatableDefinition, 'dom') || _.result(this, 'dom');
        datatableDefinition.stateSave = _.result(datatableDefinition, 'stateSave') || _.result(this, 'stateSave');
        datatableDefinition.ajax = datatableDefinition.ajax || ((...args) => this.ajax(...args));
        datatableDefinition.orderCellsTop = _.result(datatableDefinition, 'orderCellsTop') || _.result(this, 'orderCellsTop');

        // Convert string to functions.
        datatableDefinition.columns.forEach(column => {
          column.render = stringToFunction(column.render);
          column.createdCell = stringToFunction(column.createdCell);
        });

        // NOTE: Weird behaviour - Assigning functions into existing object changes the function's context to previous instance...
        // So I had to keep function in temporary object by duplicating the definition.
        const tempDatatableDefinition = {};
        for (const key in datatableDefinition) {
          if (datatableDefinition.hasOwnProperty(key)) {
            tempDatatableDefinition[key] = datatableDefinition[key];
          }
        }
        tempDatatableDefinition.stateSaveCallback = datatableDefinition.stateSaveCallback || ((...args) => this.stateSaveCallback(...args));
        tempDatatableDefinition.stateLoadCallback = datatableDefinition.stateLoadCallback || ((...args) => this.stateLoadCallback(...args));
        tempDatatableDefinition.initComplete = datatableDefinition.initComplete || ((...args) => this.initComplete(...args));

        // Build table.
        return this.buildTable()
          .then(table => {
            this.el.appendChild(table);

            // Create Datatable.
            this.datatable = $(table).DataTable(tempDatatableDefinition);

            // Run super.render(), returns a Promise.
            return Backbone.BaseView.prototype.render.call(this);
          });
      });
  },

  stateSaveCallback(settings, data) {
    const webStorage = _.result(this, 'webStorage') || _.result(this.collection, 'webStorage');
    const webStorageKey = _.result(this, 'webStorageKey') || _.result(this.collection, 'webStorageKey');

    webStorage.setItem(webStorageKey, JSON.stringify(data));
  },

  stateLoadCallback(settings) {
    const webStorage = _.result(this, 'webStorage') || _.result(this.collection, 'webStorage');
    const webStorageKey = _.result(this, 'webStorageKey') || _.result(this.collection, 'webStorageKey');

    try {
      return JSON.parse(webStorage.getItem(webStorageKey));
    } catch (error) {
      return;
    }
  },

  ajax(data, callback, settings) {
    const serverSide = settings.oFeatures.bServerSide;
    if (serverSide) {
      const datatableDefinition = _.result(this, 'datatableDefinition');
      const { columns, draw, length, order, search, start } = data;
      const queryObject = {};

      // $count
      queryObject['$count'] = true;

      // $select
      queryObject['$select'] = columns
        .filter(config => typeof config.data === 'string')
        .map(config => config.data)
        .filter((select, index, array) => array.indexOf(select) === index)
        .join(',');

      // $filter
      const filters = columns
        .map((column, index) => {
          if (column.searchable && column.search && column.search.value && column.search.value.trim()) {
            switch (datatableDefinition.columns[index].type) {
              case 'boolean':
              case 'number':
              case 'date':
                return `${column.data} eq ${escapeODataValue(column.search.value)}`;

              case 'function':
                const func = stringToFunction(datatableDefinition.columns[index].filter);
                return `(${func(column, datatableDefinition.columns[index])})`;

              default:
                return `(${column.search.value
                  .split(' ')
                  .filter((value, index, array) => value && array.indexOf(value) === index)
                  .map(value => `contains(tolower(${column.data}),'${escapeODataValue(value.toLowerCase())}')`)
                  .join(' and ')})`;
            }
          } else {
            return false;
          }
        })
        .filter(value => value);
      if (filters.length > 0) {
        queryObject['$filter'] = filters.join(' and ');
      }

      // $orderby
      if (order.length > 0) {
        queryObject['$orderby'] = order.map(config => {
          let orderBy = columns[config.column].data;
          switch (datatableDefinition.columns[config.column].type) {
            case 'boolean':
            case 'number':
            case 'date':
              return `${orderBy} ${config.dir}`;
            case 'function':
              const func = stringToFunction(datatableDefinition.columns[config.column].orderBy);
              return func(config, orderBy, datatableDefinition.columns[config.column]);
            default:
              return `tolower(${orderBy}) ${config.dir}`;
          }
        }).filter(value => value).join(',');
      }

      // $search
      if (search && search.value) {
        queryObject['$search'] = search.value;
      }

      // $skip
      queryObject['$skip'] = start;

      // $top
      queryObject['$top'] = length;

      const queryArray = [];
      for (const key in queryObject) {
        queryArray.push(`${key}=${queryObject[key]}`);
      }

      this.collection.fetch({ query: queryArray.join('&') })
        .then((data) => {
          callback({
            data: this.collection.toJSON(),
            draw,
            recordsTotal: data['@odata.count'],
            recordsFiltered: data['@odata.count']
          });
        }, () => {
          callback({ data: [], draw, recordsTotal: 0, recordsFiltered: 0 });
        });
    }
  },

  initComplete(settings, json) {},

  buildTable() {
    const newTable = document.createElement('table');
    newTable.classList.add('table', 'table-bordered', 'table-striped');
    newTable.style.width = '100%';

    return Promise.resolve(newTable);
  },

  orderCellsTop: false,

  reload(callback, resetPaging) {
    if (this.datatable) {
      this.datatable.ajax.reload(callback, resetPaging);
    }
  }
});

////////////////////////////////////////////////////////////////////////////////

const FilteredDatatableView = DatatableView.extend({
  initComplete(settings, json) {
    DatatableView.prototype.initComplete.call(this, settings, json);

    for (let index = 0, length = this.datatable.columns()[0].length; index < length; index++) {
      const field = this.el.querySelector(`[data-column-index="${index}"]`);
      if (field) {
        this.el.querySelector(`[data-column-index="${index}"]`).value = this.datatable.column(index).search() || '';
      }
    }
  },

  buildTable() {
    return DatatableView.prototype.buildTable.call(this)
      .then(newTable => {
        const thead = newTable.appendChild(document.createElement('thead'));

        const tr1 = thead.appendChild(document.createElement('tr'));
        this.datatableDefinition.columns.forEach(column => {
          tr1.appendChild(document.createElement('th'));
        });

        const tr2 = thead.appendChild(document.createElement('tr'));

        const promises = [];
        this.datatableDefinition.columns.forEach((column, index) => {
          const th = tr2.appendChild(document.createElement('th'));

          if (column.searchable === false) {
            return;
          }

          const title = column.title || column.data;

          if (column.choices) {
            const select = th.appendChild(document.createElement('select'));
            select.classList.add('form-control');
            select.setAttribute('aria-label', title);
            select.setAttribute('data-column-index', index);

            select.addEventListener('change', () => {
              this.datatable.columns(index).search(select.value).draw();
            });

            const option0 = select.appendChild(document.createElement('option'));
            option0.setAttribute('value', '');

            let choices = column.choices;
            const promise = Promise.resolve()
              .then(() => {
                if (Array.isArray(choices)) {
                  // choices = choices.slice(choices);
                  choices = choices.slice(0);
                } else if (typeof choices === 'string') {
                  option0.innerHTML = `Loading&hellip;`;
                  return ajax({
                    url: choices
                  }).then((data) => {
                    choices = data;
                  });
                }
              })
              .then(() => {
                if (column.choicesMap) {
                  column.choicesMap = stringToFunction(column.choicesMap);
                  choices = column.choicesMap(choices);
                }

                if (choices[0].value !== '') {
                  choices.unshift({ text: `Any ${column.title || column.data}`, value: '' });
                }

                select.removeChild(option0);
                choices.forEach((choice) => {
                  const option = select.appendChild(document.createElement('option'));
                  option.textContent = choice.text || choice.value;
                  option.setAttribute('value', choice.value != null ? choice.value : choice.text);
                });
              });
            promises.push(promise);
          } else {
            const input = th.appendChild(document.createElement('input'));
            input.classList.add('form-control');
            input.setAttribute('aria-label', `Filter by ${title}`);
            input.setAttribute('data-column-index', index);

            const eventHandler = (event) => {
              if (event.which !== 9) {
                this.datatable.columns(index).search(input.value).draw();
              }
            }

            input.addEventListener('change', eventHandler);
            input.addEventListener('keyup', eventHandler);
          }
        });

        return Promise.all(promises)
          .then(() => {
            return newTable;
          });
      });
  },

  orderCellsTop: true,

  resetFilters() {
    const filters = this.el.querySelectorAll(`[data-column-index]`);
    for (let index = 0, length = filters.length; index < length; index++) {
      const filter = filters[index];
      const columnIndex = filter.getAttribute('data-column-index');
      filter.value = '';
      this.datatable.column(columnIndex).search('');
    }
    this.datatable.draw();
  }
});
