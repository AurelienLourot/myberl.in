#!/usr/bin/env bash

set -e

HOSTED_ZONE_ID=/hostedzone/ZRDW39W98IS2W

scriptDir=$(dirname "$0")
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch "file://$scriptDir/dns_upsert_a_record_set.json"
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch "file://$scriptDir/dns_upsert_a_kloudsec_record_set.json"

#aws route53 list-hosted-zones > output.txt
#aws route53 get-hosted-zone --id $HOSTED_ZONE_ID > output.txt
#aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID > output.txt
