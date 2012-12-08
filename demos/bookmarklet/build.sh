#!/bin/sh

grep '<link' index.html | grep -v '<!--' | grep -v 'javascript:' | grep 'href=' | sed 's/.*href="\([^"]*\)".*/.\/\1/' | xargs cat > css/all.css

#uglifyjs js/bookmarklet.js | sed "s/\"'/\\\\\"'/g;s/\" /\\\\\" /g;s/\">/\\\\\">/g;s/ rel=\"/ rel=\\\\\"/g;s/ type=\"/ type=\\\\\"/g;s/'/\"/g" > js/bookmarklet.min.js
uglifyjs js/bookmarklet.js | sed "s/\"\([' >]\)/\\\\\"\\1/g;s/\( [a-zA-Z]\\+=\)\"/\1\\\\\"/g;s/'/\"/g" > js/bookmarklet.min.js

grep '<script' index.html | grep -v '<!--' | grep -v 'javascript:' | grep 'src=' | sed 's/.*src="\([^"]*\)".*/.\/\1/' | xargs cat > js/all.js
echo "\nwindow.initReclineTableParserWidget();\n" >> js/all.js

#jscompiler --jscomp_warning internetExplorerChecks js/all.js > js/all.cc.js

#uglifyjs js/all.js > js/all.min.js

#jscompiler --jscomp_warning internetExplorerChecks js/all.min.js > js/all.min.cc.js
