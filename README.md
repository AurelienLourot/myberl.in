# myberl.in [![Build Status](https://travis-ci.org/AurelienLourot/myberl.in.svg?branch=master)](https://travis-ci.org/AurelienLourot/myberl.in)

Source of https://myberl.in . An interactive map of bars, clubs and restaurants in Berlin.

## Serve locally

```bash
$ sudo npm install -g http-server
$ http-server
```

> **Note:** Front-end errors won't be sent to Sentry. See
> [Monitoring/Alerting](https://github.com/AurelienLourot/myberl.in#monitoringalerting).

## Run the E2E and unit tests

```bash
$ npm install
$ npm run-script karma
```

> **Note:** Front-end errors won't be sent to Sentry. See
> [Monitoring/Alerting](https://github.com/AurelienLourot/myberl.in#monitoringalerting).

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

## Monitoring/Alerting

Any front-end error is sent to [Sentry](https://sentry.io) (except when served on `*localhost*`).
This can be leveraged by loading the webapp regularly from the console or a cronjob:

```bash
$ sudo apt-get install phantomjs
$ npm run-script loadmyberlin
```

In addition to sending any error to Sentry, `npm` will terminate with a non-null exit value if:

* [myberl.in](https://myberl.in)'s initialization times out, or
* myberl.in is unreachable.

## Documentation

* [Why not just creating a map on Google or Foursquare?](doc/why.md)
* [I want to add more awesome places.](doc/contrib/README.md)
