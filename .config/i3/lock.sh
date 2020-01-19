#!/bin/zsh

# set paths for the lock icon and a temporary screenshot
#icon="$HOME/Pictures/lock3.png"
tmpscr='/tmp/screen.png'

# take a screenshot
scrot "$tmpscr"

# blur screenshot, the parametr is bias x radius
convert "$tmpscr" -blur 0x5 "$tmpscr"

#overlay the icon onto the screenshot
#convert "$tmpscr" "$icon" "$tmpscr"
# convert "$tmpscr" "$icon"  -gravity center -composite "$tmpscr"

# lock the screen with the blurred screenshot
#i3lock -i "$tmpscr"

#[ -f "$icon" ] 
#convert "$tmpscr" "$icon" -gravity center -compsite -matte "$tmpscr" 

#mocp -P
i3lock -u -e -i "$tmpscr" 
# i3lock -u -i "$tmpscr" 
#rm "$tmpscr"
