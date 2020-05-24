#!/bin/bash

# First get the version number directly from the install.rdf file
version_number=`sed -n -e 's|.*"version": "\(.*\)",|\1|p' src/manifest.json`

# Go into the source directory...
cd src

# Delete any extraneous files
find . -name *~ -delete

# And make the xpi file by zipping stuff up!
zip -r ../flat_folder_tree_reborn-$version_number-tb.xpi *
