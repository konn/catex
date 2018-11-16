# CaTeX (軽鳥／怪鳥) - YaTeX like completions for LaTeX in VSCode

## Functionalities

- [YaTeX]-like image/greek completion
- Powerful snippet completion for LaTeX commands/environments:
  - `\section{}`-like completion (<kbd>C-c s</kbd>)
  - `\begin{}\end{}`-type completion (<kbd>C-c b</kbd>)
  - `{\Large }`-like completion (<kbd>C-c l</kbd>)
  - `\maketitle`-like completion (<kbd>C-c m</kbd>)
    - In any completion, you can automatically register unknown commands!

[YaTeX]: https://yatex.org

## DEMOs

### Image and Greek Completion

![GIF Anime](images/image-and-greek.gif)

### Image Completion, manually invoked for surrounding

![GIF Anime](images/image-invoked.gif)

### `\section{}`-completion

Completion and surrounding:

![GIF Anime](images/section-1.gif)

Registration of custom completion, with arg specification:

![GIF Anime](images/section-2.gif)

### `\begin{}\end{}`-type completion

Completion and surrounding:

![GIF Anime](images/env-1.gif)

Registration of custom completion, with arg specification:

![GIF Anime](images/env-2.gif)

### `{\Large }`-type completion

Completion and surrounding

![GIF Anime](images/large-1.gif)

Custom registration, with/out arg specs:

![GIF Anime](images/large-2.gif)

### `\maketitle`-type completion

Completion and registration:

![GIF Anime](images/maketitle-completion.gif)

## TODOs

- Supports `<>` and `()`-style arguments for commands.
- Prefixed `\begin-\end` completions
- Package name completions
- Contextual completion based on grammatical scopes
- (Unifying dictionaries of snippet completion and image-completions)
