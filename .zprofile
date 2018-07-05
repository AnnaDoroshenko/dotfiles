#
# ~/.zprofile
#

[[ -f ~/.zshrc ]] && . ~/.zshrc

if [[ -z $DISPLAY ]] && [[ $(tty) = /dev/tty1 ]]; then
   startx
fi

#if [[ ! $DISPLAY && $XDG_VTNR -eq 1 ]]; then
#   exec startx
#fi
