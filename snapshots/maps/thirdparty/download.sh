#!/usr/bin/env bash

set -e

# Call this script regularly to save the external maps we rely on.

map_id=1S_guQBQudaPzIgRybK3VIPYwRL0
curl -o "${map_id}.kml" "https://www.google.com/maps/d/kml?mid=${map_id}&forcekml=1"
