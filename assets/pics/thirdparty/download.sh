#!/usr/bin/env bash

icons=(\
1494-wht-circle-blank \
1497-wht-diamond-blank \
1496-wht-square-blank \
1495-wht-star-blank \
1493-wht-blank_maps)
scales=(0.7 0.7 0.7 0.7 0.45)

colors=(white gray red cyan orange purple)
color_codes=(FFFFFF 777777 DB4436 93D7E8 FFBB55 C000C0)

for i in $(seq 0 $((${#icons[@]} - 1)))
do
    icon=${icons[i]}
    scale=${scales[i]}
    for j in $(seq 0 $((${#colors[@]} - 1)))
    do
        color=${colors[j]}
        color_code=${color_codes[j]}
        curl -o "${icon}_${color}.png" \
            "https://mt.googleapis.com/vt/icon/name=icons/onion/${icon}-4x.png&scale=${scale}&filter=ff${color_code}"
    done
done
