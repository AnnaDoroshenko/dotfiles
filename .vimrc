
set rtp+=~/.local/share/nvim/site/autoload/plug.vim

" ----------------------------------------------------------------------------
" ----------------------- Vim-Plug lists -------------------------------------

call plug#begin('~/.local/share/nvim/plugged')

" Plug 'scrooloose/nerdtree', { 'on':  'NERDTreeToggle' }
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
" Plug 'edkolev/tmuxline.vim'
Plug 'altercation/vim-colors-solarized'
Plug 'Yggdroot/indentLine'          " indentation with vertical markers
Plug 'Raimondi/delimitMate'         " auto-close brackets, quotes...
" Plug 'ctrlpvim/ctrlp.vim'           " fuzzy search
" Plug 'easymotion/vim-easymotion'
Plug 'Valloric/YouCompleteMe', { 'do': './install.py', 'for': '' }
" Plug 'garbas/vim-snipmate' " This and the following two: for snippets
" Plug 'MarcWeber/vim-addon-mw-utils'
" Plug 'tomtom/tlib_vim'
" Plug 'tpope/vim-surround'
" Plug 'vim-scripts/ruscmd'
Plug 'tomtom/tcomment_vim' " comments with Ctrl+//
" Plug 'w0rp/ale'
Plug 'edkolev/tmuxline.vim'
Plug 'neomake/neomake' "async linting
Plug 'garbas/vim-snipmate' " This and the following two: for snippets
Plug 'MarcWeber/vim-addon-mw-utils'
Plug 'tomtom/tlib_vim'
" Russian mode support
Plug 'vim-scripts/ruscmd'


call plug#end()
" ----------------------------------------------------------------------------

" ----------------------------------------------------------------------------
"  ------------------------ Vim-Plug Settings --------------------------------

" Jump between errors(warnings)
" nmap <silent> <C-k> <Plug>(ale_previous_wrap)
" nmap <silent> <C-j> <Plug>(ale_next_wrap)
map <C-k> :cp<CR>
map <C-j> :cn<CR>

" IndentLine settings
" let g:indentLine_setColors = 0
let g:indentLine_char = '┆'
let g:indentLine_color_term = 239

" delimitMate (auto closing of quotes, brackets..)
let g:delimitMate_expand_cr = 1

" For airline
let g:airline_theme='dark'
"let g:airline_theme='solarized'
"let g_airline_solarized_bd='dark'
let g:airline_powerline_fonts=1
" Otherwise entering Vim screws the tmuxline
let g:airline#extensions#tmuxline#enabled = 0
set noshowmode

" " For the Solarized colorscheme
" syntax enable
" set background=dark
" let g:solarized_termcolors=256
" "let g:solarized_termtrans=1 " for transparent background
" colorscheme solarized
"
" " Personal changes to colors
" highlight Comment ctermfg=240
" highlight Normal ctermbg=232

" let g:ale_cpp_gcc_options = ' -std=c++17 '

" let g:ale_sign_error = '×'
" let g:ale_sign_warning = 'W'
" let g:airline#extensions#ale#enabled = 1
" let g:ale_lint_on_text_changed = 'never'
" let g:ale_set_quickfix = 1
" let g:ale_open_list = 1
" let g:ale_list_window_size = 6
"
" let b:ale_linters = ['flake8', 'pylint']

" Compile (run linter)
noremap <silent> '' :Neomake<CR>

" Auto-close quickfix on exit
autocmd BufWinEnter quickfix nnoremap <silent> <buffer>
            \   q :cclose<cr>:lclose<cr>
autocmd BufEnter * if (winnr('$') == 1 && &buftype ==# 'quickfix' ) |
            \   bd|
            \   q | endif"

" Place language name here
let neomake_blacklist = ['tex']
" Run Neomake on every read and write
autocmd! BufReadPost,BufWritePost * if index(neomake_blacklist, &ft) < 0 | Neomake
" I don't use the following because it ignores buffer write with no changes
" call neomake#configure#automake('rw')
" Open the list automatically
let g:neomake_open_list = 2
let g:neomake_list_height = 6
" To see possible values for texthl, see :highlight
let g:neomake_warning_sign = {
    \ 'text': 'W',
    \ 'texthl': 'CursorLineNr',
    \ }
let g:neomake_error_sign = {
    \ 'text': '×',
    \ 'texthl': 'WarningMsg',
    \ }
" Cool possible chars: "⚠️", "✖️", "×"
" let g:neomake_cpp_enable_markers=['gcc']
let g:neomake_cpp_gcc_args = ['-Wall', '-Wextra', '-Wno-unused-parameter', '-std=c++17', '-fsyntax-only']

let g:tmuxline_preset = 'tmux'

" Comments
vnoremap <C-/> gc
nnoremap <C-/> gcc
" ----------------------------------------------------------------------------

" ----------------------------------------------------------------------------
"  ---------------------- Vim Settings ---------------------------------------

" Allow color schemes to do bright colors without forcing bold.
if &t_Co == 8 && $TERM !~# '^linux\|^Eterm'
  set t_Co=16
endif

" Do not conceal hidden characters:
autocmd FileType json setlocal conceallevel=0
let g:indentLine_fileTypeExclude = ['json']

" Display Tab and Eol chars
set list
set listchars=tab:\ ,eol:¬

no <up> <Nop>
no <down> <Nop>
no <left> <Nop>
no <right> <Nop>

ino <up> <Nop>
ino <down> <Nop>
ino <left> <Nop>
ino <right> <Nop>

noremap J 5j
noremap K 5k
noremap L $
noremap H ^

nmap gO O<ESC>j
nmap g<C-O> o<ESC>k

set incsearch "C-G/C-T -- move by words in search
set tabstop=4
set softtabstop=0
set shiftwidth=4
set expandtab

set scrolloff=5
set smarttab
set autoindent
set backspace=indent,eol,start
set complete-=i " not to search in all included files
set laststatus=2 " always display the status line
set ruler
set wildmenu
set nrformats-=octal
"set relativenumber 
"set number " show line numbers

set number relativenumber

"augroup numbertoggle
  "autocmd!
  "autocmd BufEnter,FocusGained,InsertLeave * set relativenumber
  "autocmd BufLeave,FocusLost,InsertLeave * set norelativenumber
"augroup END

set encoding=utf-8 
" TODO set list
set noswapfile
set sessionoptions-=options
set display+=lastline

" Make the 80th column visible
if exists('+colorcolumn')
  set colorcolumn=80
else
  au BufWinEnter * let w:m1=matchadd('ErrorMsg', '\%>80v.\+', -1)
endif

" Use <C-L> to clear the highlighting of :set hlsearch.
if maparg('<C-L>', 'n') ==# ''
  nnoremap <silent> <C-L> :nohlsearch<C-R>=has('diff')?'<Bar>diffupdate':''<CR><CR><C-L>
endif

set clipboard=unnamedplus
set ignorecase
set smartcase

" To enable colors
syntax enable

" For the Solarized colorscheme
syntax enable
set background=dark
let g:solarized_termcolors=256
"let g:solarized_termtrans=1 " for transparent background
colorscheme solarized

" Personal changes to colors
highlight Comment ctermfg=240
highlight Normal ctermbg=232

" to fix the delay when exiting Insert mode
set timeoutlen=1000 ttimeoutlen=0

" Abbraviation
abbr cosnt const

inoremap <C-U> <C-J>u<C-U>

if &history < 1000
  set history=1000
endif

function! ClipboardYank()
  call system('xclip -i -selection clipboard', @@)
endfunction

function! ClipboardPaste()
  let @@ = system('xclip -o -selection clipboard')
endfunction

vnoremap <silent> y y:call ClipboardYank()<cr>
vnoremap <silent> d d:call ClipboardYank()<cr>
nnoremap <silent> p :call ClipboardPaste()<cr>p
" ----------------------------------------------------------------------------
