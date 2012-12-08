(function($) {

window.initReclineTableParserWidget = function() {
  new BookmarkletView().render();
};

var BookmarkletView = Backbone.View.extend({
  className: 'reclineExplorerOverlay',
  template: _.template(
    '<div class="navbar navbar-fixed-top"> \
      <div class="navbar-inner"> \
        <form class="navbar-form pull-left"> \
          <label class="table-select"> \
            <span>Select table:</span> \
            <select> \
              <% _.each(tables, function(item, idx) { %>       \
              <option <% (table === idx ? \'selected="selected"\' : \'\') %> \
                value=" \
                <%- idx %>       \
                "> \
                <%- item.label %></option> \
              <% }); %></select> \
          </label> \
        </form> \
        <div class="table-options btn-group pull-left"> \
          <a class="<%- (vertical ? \'\' : \'active\') %> btn option-horizontal">Horizontal</a> \
          <a class="<%- (header ? \'active\' : \'\') %> btn option-header">Headers</a> \
        </div> \
        <a class="btn btn-danger pull-right js-exit"> <i class="icon-remove icon-white"></i> \
        </a> \
      </div> \
    </div>'
  ),
  events: {
    'change .table-select>select': 'onChange',
    'click .js-exit': 'onExit',
    'click .table-options>.btn': 'onOptionsChange'
  },
  initialize: function() {
    var dataset = new recline.Model.Dataset({
      backend: 'TableParser'
    });

    dataset.queryState.set({'rql': _.rql('')}, {silent: true});

    function handleQueryChange() {
      var rql = recline.Backend.Warehouse.es2rql(dataset.queryState.toJSON());
      dataset.queryState.attributes['rql'] = rql;
      dataset.queryState.trigger('change:rql');
    }

    //dataset.queryState.on('change', handleQueryChange);
    // for synchronization with slickgird (it calls query directly)
    dataset.on('query:done', handleQueryChange);
    dataset.on('query:fail', handleQueryChange);

    this.dataset = dataset;
    
    this.model = new Backbone.Model({
      table: 0,
      tables: recline.Backend.TableParser.getTables('table.tbparser'),
      vertical: true,
      header: true
    });
    this.switchTable();

    this.bodyOverflow = $('body').css('overflow');
    $('body').css('overflow', 'hidden');

    this.model.on('change', function() {
      this.switchTable();
      this.dataset.fetch();
    }, this);
  },

  render: function() {
    this.$el
      .append(this.template(this.model.toJSON()))
      .append('<div class="reclineExplorerContent"></div>');

    this.dataExplorer = createExplorer(this.dataset);
    this.$('.reclineExplorerContent').append(this.dataExplorer.el);

    // hack - move quey editor to bottom, because it is too wide for sidepanel 
    this.$('.recline-rql-query-editor').appendTo(this.$('.data-view-container'));

    $('body').append(this.$el);

      // do not show query by default
    this.$('.recline-data-explorer .menu-right a[data-action=query]').click();
  },

  switchTable: function() {
    var opts = this.model.toJSON();
    opts.table = opts.tables[opts.table].el;
    delete opts.tables;
    this.dataset.set('tableParser', opts);
    this.dataset.unset('_warehouse');
  },

  onChange: function(e) {
    this.model.set({
      table: $.trim(this.$('.table-select>select option:selected').val()),
      vertical: !this.$('.option-horizontal').is('.active'),
      header: this.$('.option-header').is('.active')
    });
  },

  onOptionsChange: function(e) {
    $(e.target).toggleClass('active');
    this.onChange();
  },

  onExit: function(e) {
    e.preventDefault();
    $('body').css('overflow', this.bodyOverflow);
    this.remove();
    if (window.parent && window.parent.document) {
      var el = window.parent.document.getElementById('recline-warehouse-data-explorer-css');
      el && el.parentNode.removeChild(el);
      el = window.parent.document.getElementById('recline-warehouse-data-explorer');
      el && el.parentNode.removeChild(el);
    }
    
  }
});

// make Explorer creation / initialization in a function so we can call it
// again and again
var createExplorer = function(dataset, state) {
  var gridView = new recline.View.SlickGrid({
    model: dataset
  });

  var views = [
    {
      id: 'grid',
      label: 'Grid',
      view: gridView
    },
    {
      id: 'graph',
      label: 'Graph',
      view: new recline.View.Graph({
        model: dataset
      })
    },
    {
      id: 'map',
      label: 'Map',
      view: new recline.View.Map({
        model: dataset
      })
    },
    {
      id: 'transform',
      label: 'Transform',
      view: new recline.View.Transform({
        model: dataset
      })
    },
    {
      id: 'export',
      label: 'Export',
      view: new recline.View.Export({
        model: dataset,
        grid: gridView
      })
    }
  ];

  return new recline.View.MultiView({
    model: dataset,
    state: state,
    views: views,
    sidebarViews: [
      {
        id: 'filters',
        label: 'Filters',
        view: new recline.View.RqlFilterEditor({
          model: dataset
        })
      },
      {
        id: 'sort',
        label: 'Sort',
        view: new recline.View.RqlSortEditor({
          model: dataset
        })
      },
      {
        id: 'query',
        label: 'Query',
        view: new recline.View.RqlQueryEditor({
          model: dataset
        })
      }
    ]
  });
}

//window.initReclineTableParserWidget();

})(jQuery);