install :
	npm install node-uuid express consolidate socket.io hogan.js
dev :
	node server.js
prod :
	NODE_ENVIRONMENT=production forever start server.js
clean :
	rm -rf node_modules