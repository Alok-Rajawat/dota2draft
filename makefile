install :
	npm install node-uuid express consolidate socket.io hogan.js
dev :
	node dota2draft.js
prod :
	NODE_ENVIRONMENT=production forever start dota2draft.js
clean :
	rm -rf node_modules