#!/bin/bash

# First get the version number directly from the changelog
version_number=`head -n 1 CHANGELOG.md | sed 's/# //'`

# Go into the source directory...
cd src

# And make the xpi file by zipping stuff up!
zip -r ../flat_folder_tree_reborn-$version_number-tb.xpi *
