/*jshint multistr:true */

this.recline = this.recline || {};
this.recline.View = this.recline.View || {};

(function(_, $, my) {

/** Export View */
my.Export = Backbone.View.extend({
  className: 'recline-export-view',
  template: _.template(
    '<h3>Export</h3> \
    <div class="export-buttons">  \
      <div class="btn-group"> \
        <% _.each(exporters, function(item, idx) { %> \
        <a href="#" class="btn <%- idx === exporter ? \'active\' : \'\' %> exporter" data-exporter="<%- idx %>"><%- item.label %></a> \
        <% }); %> \
      </div> \
      <% if (options.size) { %> \
      <button class="export-all btn btn-primary">Export all</button> \
      <% } %> \
      <label class="checkbox"> \
        <input type="checkbox" class="include-headers" <%- options.includeHeaders ? \'checked="checked"\' : \'\' %> > Include headers \
      </label> \
    </div> \
    <% if (preview) { %> \
    <div class="preview"> \
      <h3>Preview</h3> \
      <textarea><%- preview %></textarea> \
    </div> \
    <% } %>'
  ),
  events: {
    'click .export-all': 'onExportAll',
    'click a.exporter': 'onExporterChange',
    'change .include-headers': 'onIncludeHeadersChange'
  },

  exporters: [
    {
      label: 'CSV',
      fn: recline.Data.Export.CSV
    },
    {
      label: 'JSON',
      fn: recline.Data.Export.JSON
    }
  ],

  initialize: function() {
    this.options = _.extend({size: 10, includeHeaders: false}, this.options);
    this.el = $(this.el);
    this.exporter = 0;
    this.render();

    this.model.records.on('reset', this.render, this);
    if (this.options.grid) {
      this.options.grid.state.on('change', this.render, this);
    }
  },

  render: function() {
    var fields = this.model.fields.pluck('id');

    // load column info from grid
    if (this.options.grid) {
      var grid = this.options.grid;
      // change order of columns
      var gridFields = grid.state.get('columnsOrder');
      if (gridFields.length > 0) {
        fields = gridFields;
      }
      // do not export hidden columns
      fields = _.difference(fields, grid.state.get('hiddenColumns'));
    }

    // setup options for exporter
    var opts = {
      fields: fields,
      headers: this.options.includeHeaders
    };
    if (this.options.size) {
      opts.size = this.options.size;
    }

    // export and render
    this.preview = this.exporters[this.exporter].fn(this.model, opts);
    var htmls = this.template(this);
    this.el.html(htmls);
  },

  onExporterChange: function(e) {
    e.preventDefault();
    this.exporter = parseInt($(e.target).attr('data-exporter'));
    this.render();
  },

  onIncludeHeadersChange: function(e) {
    this.options.includeHeaders = $(e.target).is(':checked');
    this.render();
  },

  onExportAll: function(e) {
    var size = this.options.size;
    this.options.size = null;
    this.render();
    this.options.size = size;    
  }
});

})(_, jQuery, recline.View);
