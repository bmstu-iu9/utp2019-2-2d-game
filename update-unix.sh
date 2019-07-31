#!/bin/bash

git checkout gh-pages
git pull
git read-tree --prefix=master/ -u master
git read-tree --prefix=develop/ -u develop
git read-tree --prefix=Player/ -u Player
git commit -m "$(date)" --allow-empty
git push
