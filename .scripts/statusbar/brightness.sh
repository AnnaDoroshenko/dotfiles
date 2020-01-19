#!/bin/bash

brightness=$(echo $(xbacklight) | sed 's/[.].*//')

echo " $brightness%"
echo "$brightness" && echo "#ff9a39"

exit 0

# color=#ff9a39
# icon=""
#
# printf "<span color='%s'><b>%s %s%%</b></span>" "$color" "$icon" "$brightness"
