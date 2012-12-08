
This repository contains code for integration of [Recline.js](http://github.com/okfn/recline/) with [Warehouse.js](http://github.com/dundalek/warehouse) and other various additions to Recline.

## Demos and Examples

See it in action:

- [DataExplorer bookmarklet](http://knomaton.org/recline-warehouse/demos/bookmarklet/) - Lets suppose you found a web page, which has useful data presented in a static table. Using this script you can transform the table to a rich widget, which enables sorting, filtering, graphing, visualizing on the map, etc. This examples shows usage of *TableParser*.
- [MultiView](http://knomaton.org/recline-warehouse/demos/multiview/) - Demo of the *WarehouseMemory* backend

## Getting the source code

```

git clone git://github.com/dundalek/recline-warehouse.git
git submodule init
git submodule update
cd warehouse
npm install -d

```

## Warehouse.js backend

```javascript

var dataset = new recline.model.Dataset({
    // general dataset metadata
    // ...

    backend: 'WarehouseMemory',

    // you can specify optional arguments for backend, see Warehouse Backends docs
    warehouse: {
        name: 'test',
        options: {
            json: records
        }
    }
});

```

Possible choices for backend are *WarehouseMemory*, *WarehouseElasticSearch*, *WarehouseRest*, *WarehouseLocal*.

See [Warehouse Backends docs](https://github.com/dundalek/warehouse#backends) for more information about backends and their options.

## Tableparser backend

```javascript

var dataset = new recline.Model.Dataset({
    // general dataset metadata
    // ...

    backend: 'TableParser',

    // optional arguments
    tableParser: {
        table: ...
        tables: ...
        vertical: true, // is orientation vertical?, default auto-detect
        header: true, // first row is header, default auto-detect
    }
});

```

If you do not specify arguments, TableParser will list all tables on the page, sort them by number of entries and selects the first one.

Argument *table* can be used to specify which table to use. It can be one of following types: string selector, dom element, number index.

You can specify array of *tables* to override default auto-detection.

## Export

You can export your dataset, currently suported formats are CVS and JSON.

```javascript

// data.export.js

var options = {
    size: 10, // export only first 10 records
    headers: true, // export headers as first line in CSV (default false),
    fields: ['id', 'name'] // export only specified fields
};

exportedCVS = recline.Data.Export.CVS(dataset, options);

exportedJSON = recline.Data.Export.CVS(dataset, options);

```

## Export Widget

Export Widget can be included into MultiView Widget.

```javascript

// view.export.js

var options = {
    model: dataset, // recline dataset
    grid: gridViewInstance, // optinal, specify grid to export only visible columns and in order of the grid
    size: 5 // optional, show only first 5 records in preview (default 10)
};

var exportView = {
    id: 'export',
    label: 'Export',
    view: recline.View.Export(options)
};

var dataExplorer = new recline.View.MultiView({
    model: dataset,
    el: $el,
    views: [exportView]
});

```

## Widgets

Widgets for RQL query manipulation:

- recline.View.RqlFilterEditor
- recline.View.RqlSortEditor
- recline.View.RqlQueryEditor