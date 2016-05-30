# myberl.in [![Build Status](https://travis-ci.org/AurelienLourot/myberl.in.svg?branch=master)](https://travis-ci.org/AurelienLourot/myberl.in)

Source of http://myberl.in . An interactive map of bars, clubs and restaurants in Berlin.

## Serve locally

```bash
$ sudo npm install -g http-server
$ http-server
```

## Run the E2E and unit tests

```bash
$ npm install
$ npm test
```

## Deploy/Update the AWS Route 53 domain

```bash
$ sudo pip install awscli
$ aws configure
AWS Access Key ID [None]: ********
AWS Secret Access Key [None]: ********
Default region name [None]: us-east-1
Default output format [None]:
$ ./aws/dns_create.sh
$ ./aws/dns_update.sh
```
