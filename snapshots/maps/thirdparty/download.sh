#!/usr/bin/env bash

set -e

# Call this script regularly to save the external maps we rely on.

for map_id in 1S_guQBQudaPzIgRybK3VIPYwRL0 1RklTwBGE0Ke7c_-n-ONFAP-5kV0; do
  curl -o "${map_id}.kml" "https://www.google.com/maps/d/kml?mid=${map_id}&forcekml=1"
done
