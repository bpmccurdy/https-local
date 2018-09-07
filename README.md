# https-local
A node module to automatically run https on localhost

    var https = require('https')

    var options = require('https-local').options()

    var server = https.createServer(options, function (request, response) {
      response.end('If you see a green lock https is working!')
    }).listen(3000)

    server.on('listening', function () {
      console.log('Visit https://localhost:3000 and verify you see a green lock!')
    })
    
The first time this is run it will install a root certificate and localhost certificare in the folder `~/.https-local`. On MacOS the root certificate will be imported into your keychain and you will be prompted for your password. On other operating systems you need to install the `root-cert.pem` manually for your system.
