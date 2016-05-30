#!/usr/bin/env bash

set -e

DOMAIN_NAME=myberl.in

# Take that, bot:
ADDRESS="4"
ADDRESS=". $ADDRESS"
ADDRESS="str$ADDRESS"
ADDRESS="ein$ADDRESS"
ADDRESS="nst$ADDRESS"
ADDRESS="cke$ADDRESS"
ADDRESS="Fal$ADDRESS"
ADDRESS="${ADDRESS}2"
PHONE=$((2256329 * 720 + 4 * 10))
PHONE="+49.$PHONE"
EMAIL="n.l"
EMAIL="lie${EMAIL}our"
EMAIL="ure${EMAIL}ot@"
EMAIL="a${EMAIL}gma"
EMAIL="${EMAIL}il."
EMAIL="${EMAIL}com"

CONTACT="FirstName=Aurelien,LastName=Lourot,ContactType=PERSON,OrganizationName=,\
AddressLine1=$ADDRESS,AddressLine2=,City=Berlin,State=,CountryCode=DE,ZipCode=10997,\
PhoneNumber=$PHONE,Email=$EMAIL,Fax=,ExtraParams=[]"

aws route53domains register-domain --domain-name $DOMAIN_NAME --duration-in-years 1 \
    --auto-renew --admin-contact "$CONTACT" --registrant-contact "$CONTACT" \
    --tech-contact "$CONTACT" --privacy-protect-admin-contact --privacy-protect-registrant-contact \
    --privacy-protect-tech-contact

#aws route53domains get-domain-detail --domain-name $DOMAIN_NAME > output.txt
