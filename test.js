var https = require('https')

var options = require('./index.js').options()

var server = https.createServer(options, function (request, response) {
  response.end('If you see a green lock https is working!')
}).listen(3000)

server.on('listening', function () {
  console.log('Visit https://localhost:3000 and verify you see a green lock!')
})
