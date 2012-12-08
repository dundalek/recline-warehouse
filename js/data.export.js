this.recline = this.recline || {};
this.recline.Data = this.recline.Data || {};
this.recline.Data.Export = this.recline.Data.Export || {};

(function(_, my) {

my.Export = {};

/** JSON export */
my.JSON = function(dataset, options) {
  options = options || {};
  var records = dataset.records.models;

  // limit the records according to size option
  if (options.size) {
    records = records.slice(0, options.size)
  }

  // select only specified fields
  if (options.fields) {
    records = records.map(function(x) {
        return _.pick(x.attributes, options.fields)
    });
  }

  // transform all records to JSON
  return '[' + records.map(JSON.stringify).join(',\n') + ']';
};

/** helper function to escape CSV value */ 
function csvEscape(str) {
  str = ''+str;
  // if there is a comma, double-quote or new-line in the string, we need to escape it
  if (str.match(/[,"\n]/)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/** CSV export */
my.CSV = function(dataset, options) {
  options = options || {};
  var records = dataset.records.models;

  // limit the records according to size option
  if (options.size) {
    records = records.slice(0, options.size)
  }

  var fields = options.fields || dataset.fields.pluck('id');

  // function to tranform one record
  function convertRecord(record) {
    var ret = [];
    for (var i = 0; i < fields.length; i+=1) {
      ret.push(csvEscape(record.get(fields[i])));
    }
    return ret.join(',');
  }

  // map all records
  var ret = records.map(convertRecord).join('\n');

  if (options.headers) {
    ret = fields.map(csvEscape).join(',') + '\n' + ret;
  }

  return ret;
};

}(_, this.recline.Data.Export))
