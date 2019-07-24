const DatatableView = Backbone.BaseView.extend({
  datatableDefinition: {
    columns: [
      { title: 'Column 1', data: 'col1' },
      { title: 'Column 2', data: 'col2' },
      { title: 'Column 3', data: 'col3' },
      { width: '100px', render() { return '<a href="#" class="btn btn-default">View</a>'; } }
    ],
    data: [
      { col1: 'Data (1, 1)', col2: 'Data (1, 2)', col3: 'Data (1, 3)' },
      { col1: 'Data (1, 2)', col2: 'Data (2, 2)', col3: 'Data (3, 3)' },
      { col1: 'Data (1, 3)', col2: 'Data (2, 3)', col3: 'Data (3, 3)' }
    ]
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

    // Create HTML table.
    const table = _.result(this, 'table');
    this.el.appendChild(table);

    // Finalize definition/configuration.
    const datatableDefinition = _.result(this, 'datatableDefinition');
    datatableDefinition.dom = _.result(datatableDefinition, 'dom') || _.result(this, 'dom');
    datatableDefinition.stateSave = _.result(datatableDefinition, 'stateSave') || _.result(this, 'stateSave');
    datatableDefinition.stateSaveCallback = datatableDefinition.stateSaveCallback || ((...args) => this.stateSaveCallback(...args));
    datatableDefinition.stateLoadCallback = datatableDefinition.stateLoadCallback || ((...args) => this.stateLoadCallback(...args));
    datatableDefinition.ajax = datatableDefinition.ajax || ((...args) => this.ajax(...args));
    datatableDefinition.initComplete = datatableDefinition.initComplete || ((...args) => this.initComplete(...args));
    datatableDefinition.orderCellsTop = _.result(datatableDefinition, 'orderCellsTop') || _.result(this, 'orderCellsTop');

    // Create Datatable.
    this.datatable = $(table).DataTable(datatableDefinition);

    // Run super.render(), returns a Promise.
    return Backbone.BaseView.prototype.render.call(this);
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

      // TODO - Use type instead of filter type.
      // $filter
      const filters = columns
        .map((column, index) => {
          if (column.searchable && column.search && column.search.value) {
            if (datatableDefinition && datatableDefinition.columns && datatableDefinition.columns[index]
              && datatableDefinition.columns[index].filterType) {

              switch (datatableDefinition.columns[index].filterType) {
                case 'custom function':
                  return `(${datatableDefinition.columns[index].filterFunction(column, datatableDefinition.columns[index])})`;

                case 'string equals':
                  return `${column.data} eq '${escapeODataValue(column.search.value)}'`;

                case 'string contains':
                  return `(${column.search.value
                    .split(' ')
                    .filter((value, index, array) => value && array.indexOf(value) === index)
                    .map(value => `contains(tolower(${column.data}),'${escapeODataValue(value.toLowerCase())}')`)
                    .join(' and ')})`;
              }
            }
            return `${column.data} eq ${escapeODataValue(column.search.value)}`;
          } else {
            return false;
          }
        })
        .filter(value => value);
      if (filters.length > 0) {
        queryObject['$filter'] = filters.join(' and ');
      }

      // TODO - Use type instead of filter type.
      // $orderby
      if (order.length > 0) {
        queryObject['$orderby'] = order.map(config => {
          let orderBy = columns[config.column].data;
          if (datatableDefinition && datatableDefinition.columns
            && datatableDefinition.columns[config.column]
            && datatableDefinition.columns[config.column].orderType) {

            switch (datatableDefinition.columns[config.column].orderType) {
              case 'custom function':
                return datatableDefinition.columns[config.column].orderType
                  ? datatableDefinition.columns[config.column].orderType(config, orderBy, datatableDefinition.columns[config.column]) : null;

              case 'string':
                return `tolower(${orderBy}) ${config.dir}`;
            }
          }
          return `${orderBy} ${config.dir}`;
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

  initComplete(settings, json) { },

  table() {
    const newTable = document.createElement('table');
    newTable.classList.add('table', 'table-bordered');
    newTable.style.width = '100%';
    return newTable;
  },

  orderCellsTop: false,

  reload(callback, resetPaging) {
    if (this.datatable) {
      this.datatable.ajax.reload(callback, resetPaging);
    }
  }
});

const FilteredDatatableView = DatatableView.extend({
  table() {
    const newTable = DatatableView.prototype.table.call(this);

    const thead = newTable.appendChild(document.createElement('thead'));

    const tr1 = thead.appendChild(document.createElement('tr'));
    this.datatableDefinition.columns.forEach(column => {
      tr1.appendChild(document.createElement('th'));
    });

    const tr2 = thead.appendChild(document.createElement('tr'));
    this.datatableDefinition.columns.forEach((column, index) => {
      const th = tr2.appendChild(document.createElement('th'));

      if (column.searchable !== false) {
        const title = column.title || column.data;

        if (column.choices) {
          const select = th.appendChild(document.createElement('select'));
          select.classList.add('form-control');
          select.setAttribute('aria-label', title);

          select.addEventListener('change', () => {
            this.datatable.columns(index).search(select.value).draw();
          });

          const option0 = select.appendChild(document.createElement('option'));
          option0.textContent = `All ${title}`;
          option0.setAttribute('value', '');

          let choices = column.choices;
          Promise.resolve()
            .then(() => {
              if (Array.isArray(choices)) {
                choices = choices.slice(choices);
              }
            })
            .then(() => {
              choices.forEach((choice) => {
                const option = select.appendChild(document.createElement('option'));
                option.textContent = choice.text || choice.value;
                option.setAttribute('value', choice.value || choice.text);
              });
            });
        } else {
          const input = th.appendChild(document.createElement('input'));
          input.classList.add('form-control');
          input.setAttribute('aria-label', `Filter by ${title}`);

          const eventHandler = () => {
            this.datatable.columns(index).search(input.value).draw();
          }

          input.addEventListener('change', eventHandler);
          input.addEventListener('keyup', eventHandler);
        }
      }
    });

    return newTable;
  },

  orderCellsTop: true,
});
