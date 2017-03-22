# myberl.in [![Build Status](https://travis-ci.org/AurelienLourot/myberl.in.svg?branch=master)](https://travis-ci.org/AurelienLourot/myberl.in)

Source of https://myberl.in . An interactive map of bars, clubs and restaurants in Berlin.

## Serve locally

```bash
$ sudo npm install -g http-server
$ http-server
```

> **Note:** Front-end errors won't be sent to Sentry. See
> [Monitoring/Alerting](#monitoringalerting).

## Run the E2E and unit tests

```bash
$ npm install
$ npm run-script karma
```

> **Note:** Front-end errors won't be sent to Sentry. See
> [Monitoring/Alerting](#monitoringalerting).

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

## Set up Netlify

We use [Netlify](https://www.netlify.com/) to deliver the app over HTTPS. Install the
[Netlify CLI](https://www.netlify.com/docs/cli/) and authenticate with

```bash
$ sudo npm install -g netlify-cli
$ netlify sites # first authentication, creates ~/.netlify/
```

Create this site on Netlify:

```bash
$ netlify create -n myberl.in # already done, creates ./.netlify
```

Enable GitHub continuous deployment:

```bash
$ netlify init
? Directory to deploy (blank for current dir): 
? Your build command (middleman build/grunt build/etc): 
Configuring automated deploys for
  repo: AurelienLourot/myberl.in
  branch: master
  dir: .
  cmd: N/A
? Looking good? Yes
? GitHub username: AurelienLourot
? GitHub password: ********
Preparing deploy key
Adding deploy key to github repo
Configuring netlify site
Adding webhook to repository
Success! Whenever you push to Github, netlify will build and deploy your site
  http://myberl-in.netlify.com
```

Set the domain name:

```bash
$ netlify update -d myberl.in
Site updated:
  http://myberl.in
```

## Monitoring/Alerting

Any front-end error is sent to [Sentry](https://sentry.io) (except when served on `*localhost*`).
This can be leveraged by loading the webapp regularly from the console or a cronjob:

```bash
$ sudo apt-get install phantomjs
$ npm run-script loadsite
```

In addition to sending any error to Sentry, `npm` will terminate with a non-null exit value if:

* the app's initialization times out, or
* [myberl.in](https://myberl.in) is unreachable.

## Documentation

* [Why not just creating a map on Google or Foursquare?](doc/why.md)
* [I want to add more awesome places.](doc/contrib/README.md)
