Dota 2 Draft
==============

## Introduction
Web application to simulate the drafting sequence of Dota 2 for Captain's Mode and Captain's Draft. The web site is designed for people to practice the sequence with friends or strangers.

## Deployment
A running version of dota 2 draft is currently hosted at [https://dota2draft.the-cluster.org](https://dota2draft.the-cluster.org) and [https://dota2draft.net](https://dota2draft.net). If the website is down, feel free to poke me on twitter [@Philaeux](https://twitter.com/philaeux) or by mail [philaeux@the-cluster.org](philaeux@the-cluster.org).

## Code

### Design
The web server is a node.js server using express. It communicates with clients using socket.io. Pages are rendered with handlebars and jqueryui.

### Run
* `make install` will setup all node packages necessary to run the node server in dev/prod.
* `make dev` is used to test the code on your own machine, simply using node.js
* `make prod` uses forever to launch a node.js daemon.
* `make stop` is ending a previous forever run.
* `make clean` is removing all node packages.

## License
[The MIT License](http://opensource.org/licenses/MIT)
