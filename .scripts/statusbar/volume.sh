#!/bin/bash

vol=$(pactl list sinks | grep "Volume: front-left:" | awk '{print $5}' | sed 's/%//' | tr '\n' ' ' | awk '{print $(NF)}')
vol_muted=$(pactl list sinks | grep "Mute: " | awk '{print $2}' | tr '\n' ' ' | awk '{print $(NF)}')

echo "$(echo "$vol_muted" | sed -e "s/,//g;s/no//;s/yes//;s/ 0*/ /g;s/ :/ /g") $vol%"
echo "$vol"

[[ "$vol_muted" == "no" ]] && echo "#5ae492"
[[ "$vol_muted" == "yes" ]] && echo "#dc0000"

exit 0

# if [[ "$vol_muted" == "no" ]]; then
#     icon=""
#     color=#5ae492
# elif [[ "$vol_muted" == "yes" ]]; then
#     icon=""
#     color=#dc0000
# fi

# printf "<span color='%s'><b>%s %s%%</b></span>" "$color" "$icon" "$vol"
