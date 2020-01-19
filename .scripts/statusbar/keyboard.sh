#!/bin/bash

# layout=$(xkb-switch)
layout=$(xkblayout-state print %s | awk '{print toupper($0)}')

echo "$layout"
echo "$layout" && echo "#ff5482"

exit 0

# color=#ff5482
# icon=""

# printf "<span color='%s'><b>%s</b></span>" "$color" "$layout"
# printf "<span color='%s'><b>%s %s</b></span>" "$color" "$icon" "$layout"
