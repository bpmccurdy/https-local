var forge = require('node-forge')
var fs = require('fs')
var os = require('os')
var mkdirp = require('mkdirp')
var cp = require('child_process')

var location = os.homedir() + '/.https-local'

function isInstalled () {
  return fs.existsSync(location + '/root-key.pem') &&
  fs.existsSync(location + '/root-cert.pem') &&
  fs.existsSync(location + '/localhost-key.pem') &&
  fs.existsSync(location + '/localhost-cert.pem')
}

function addTrustedRootCert () {
  if (os.platform() === 'darwin') {
    console.log('OSX is importing the Localhost Root Certificate. You may be prompted for your password.')
    cp.execSync('security add-trusted-cert -k ' + os.homedir() + '/Library/Keychains/login.keychain ' + location + '/root-cert.pem')
  } else {
    console.log('Import this certificate for your operating system to allow localhost to serve files over https')
  }
}

function install () {
  mkdirp(location)

  var validity = {}
  validity.notBefore = new Date()
  validity.notAfter = new Date()
  validity.notAfter.setFullYear(validity.notBefore.getFullYear() + 25)

  // CREATE ROOT KEY
  var rootKey = forge.pki.rsa.generateKeyPair(2048)
  var rootKeyPem = forge.pki.privateKeyToPem(rootKey.privateKey)

  // CREAT ROOT CERT
  var rootCert = forge.pki.createCertificate()
  var rootCommonName = {
    name: 'commonName',
    value: 'Localhost Root CA'
  }
  rootCert.publicKey = rootKey.publicKey
  rootCert.serialNumber = '01'
  rootCert.validity = validity
  rootCert.setSubject([rootCommonName])
  rootCert.setIssuer([rootCommonName])
  rootCert.setExtensions([{
    name: 'keyUsage',
    critical: true,
    keyCertSign: true,
    digitalSignature: true
  }, {
    name: 'basicConstraints',
    critical: true,
    cA: true,
    pathLenConstraint: 0
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true
  }])
  rootCert.sign(rootKey.privateKey, forge.md.sha256.create())
  var rootCertPem = forge.pki.certificateToPem(rootCert)

  // CREATE LOCALHOST KEY
  var localhostKey = forge.pki.rsa.generateKeyPair(2048)
  var localhostKeyPem = forge.pki.privateKeyToPem(localhostKey.privateKey)

  // CREATE LOCALHOST CERT
  var localhostCert = forge.pki.createCertificate()
  var localhostCommonName = {
    name: 'commonName',
    value: 'localhost'
  }
  localhostCert.publicKey = localhostKey.publicKey
  localhostCert.serialNumber = '02'
  localhostCert.validity = validity
  localhostCert.setSubject([localhostCommonName])
  localhostCert.setIssuer([rootCommonName])
  localhostCert.setExtensions([{
    name: 'keyUsage',
    critical: true,
    digitalSignature: true,
    keyEncipherment: true
  }, {
    name: 'basicConstraints',
    critical: true
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 2,
      value: 'localhost'
    }]
  }])
  localhostCert.sign(rootKey.privateKey, forge.md.sha256.create())
  var localhostCertPem = forge.pki.certificateToPem(localhostCert)

  // Write Pem Files
  fs.writeFileSync(location + '/root-key.pem', rootKeyPem)
  fs.writeFileSync(location + '/root-cert.pem', rootCertPem)
  fs.writeFileSync(location + '/localhost-key.pem', localhostKeyPem)
  fs.writeFileSync(location + '/localhost-cert.pem', localhostCertPem)

  console.log('A root certificate has been installed at:')
  console.log(location + '/root-cert.pem')
}

function options () {
  if (!isInstalled()) {
    install()
    addTrustedRootCert()
  }
  return {
    key: fs.readFileSync(location + '/localhost-key.pem'),
    cert: fs.readFileSync(location + '/localhost-cert.pem')
  }
}

module.exports = {
  install: install,
  addTrustedRootCert: addTrustedRootCert,
  isInstalled: isInstalled,
  options: options
}
