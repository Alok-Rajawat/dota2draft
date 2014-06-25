install :
	npm install node-uuid@1.4.1 express@4.4.4 consolidate@0.10.0 socket.io@1.0.6 hogan.js@3.0.2
dev :
	node dota2draft.js
prod :
	NODE_ENVIRONMENT=production forever start dota2draft.js
clean :
	rm -rf node_modules