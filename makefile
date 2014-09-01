install :
	npm install node-uuid@1.4.1 express@4.4.4 socket.io@1.0.6 hbs@2.7.0
dev :
	node dota2draft.js
prod :
	NODE_ENVIRONMENT=production forever start dota2draft.js
stop :
	forever stop dota2draft.js
clean :
	rm -rf node_modules
