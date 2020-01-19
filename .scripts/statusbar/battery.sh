#!/bin/bash
# Give a battery name (e.g. BAT0) as an argument.

capacity=$(cat /sys/class/power_supply/"$1"/capacity) || exit
status=$(cat /sys/class/power_supply/"$1"/status)

echo "$(echo "$status" | sed -e "s/,//g;s/Discharging//;s/Charging//;s/Unknown//;s/Full/⚡/;s/ 0*/ /g;s/ :/ /g") $capacity%"
echo "$capacity"

[ ${capacity} -ge 75 ] && echo "#01e74f"
[ ${capacity} -ge 50 ] && [ ${capacity} -lt 75 ] && echo "#fff063"
[ ${capacity} -ge 25 ] && [ ${capacity} -lt 50 ] && echo "#ffea20"
[ ${capacity} -lt 25 ] && echo "#dc0000"

exit 0

# if [[ "$capacity" -ge 75 ]]; then
	# color=#01e74f
# elif [[ "$capacity" -ge 50 ]]; then
# 	color=#fff063
# elif [[ "$capacity" -ge 25 ]]; then
# 	color=#ffea20
# else
# 	color=#dc0000
# 	warn=""
# fi

# [ -z $warn ] && warn=" "
#
# [ "$status" = "Charging" ] && color=#94e249

# echo "<span color='%s'><b>%s%s%s</b></span>" "$color" "$(echo "$status" | sed -e "s/,//g;s/Discharging//;s/Charging//;s/Unknown//;s/Full/⚡/;s/ 0*/ /g;s/ :/ /g")" "$warn" "$(echo "$capacity" | sed -e 's/$/%/')"
