(function(u,e,ifr,ts,i){
  u = "https://raw.github.com/dundalek/recline-warehouse/demos/bookmarklet/"
  //u="http://localhost/projects/mylibs/recline-warehouse/demos/bookmarklet/";

  // e = document.createElement("style");
  // e.id = "recline-warehouse-data-explorer-css";
  // e.innerText = "#recline-warehouse-data-explorer {position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000;  background-color: #fff; overflow: auto; }\nbody {overflow: hidden !important;}";
  // document.body.appendChild(e);

  e = document.createElement("link");
  e.rel = "stylesheet";
  e.href = u + "css/parent.css";
  e.id = "recline-warehouse-data-explorer-css";
  document.body.appendChild(e);

  e = document.createElement("iframe");
  e.id = "recline-warehouse-data-explorer";
  document.body.appendChild(e);

  ifr = (e.contentWindow||e.documentWindow).document;
  ifr.open();
  ifr.write('<!doctype html><html><head><link rel="stylesheet" href="'+u+'css/all.css"></head><body><div class="alert-messages recline-data-explorer"><div class="alert alert-info alert-loader"> Loading <span class="notification-loader">&nbsp;</span> </div></div>');

  ts = document.getElementsByTagName("table"); 
  for (i=0;i<ts.length;i++){ 
    ifr.write('<table class="tbparser" style="display:none">'+ts[i].innerHTML+"</table>");
  }

  ifr.write('<script type="text/javascript" src="'+u+'js/all.min.js"></script></body></html>');

  ifr.close();

})();