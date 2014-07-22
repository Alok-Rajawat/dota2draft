Dota 2 Draft
==============

## Introduction
Dota 2 Draft is a web application to simulate the drafting sequence of Dota 2 for Captain's Mode and Captain's Draft. The web site is designed for people to practice the sequence with friends or strangers.

## Deployment
A running version of dota 2 draft is currently hosted at [http://dota2draft.the-cluster.org](http://dota2draft.the-cluster.org) and [http://dota2draft.net](http://dota2draft.net).

## Code

### Design
The web server is a node.js server using express. It communicates with clients using socket.io. Pages are rendered with handlebars and jqueryui.

### Run
* `make install` will setup all node packages necessary to run the node server in dev/prod.
* `make dev` is used to test the code on your own machine, simply using node.js
* `make prod` uses forever to launch a node.js daemon.
* `make clean` is removing all node packages.

## License
Copyright 2013-2014 Vincent 'Philaeux' Lamotte