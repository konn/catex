# Change Log

## [0.0.11] - 2018-12-05

- Provides a way to explicitly include dictionary defined in `generic-input-method`.
  You can now specify dictionaries shipped with `generic-input-method` by prefixing path with `$GIM`.
- Moves `greeks.json` back to `generic-input-method`
  - If you have custom greek settings and uses `defaults/greeks.json` alias,
    you have to use `$GIM/defaults/greeks.json` instead.

## [0.0.10] - 2018-11-30

### Fixed

- Auto-reloading for image-completion now works properly (again, sorry...).

## [0.0.9] - 2018-11-30

### Fixed

- Auto-reloading for image-completion now works properly.

## [0.0.8] - 2018-11-29

### Fixed

- Saving to the Global settings now also overwrites the workspace (folder) settings if exists.

## [0.0.7] - 2018-11-28

### Added

- Automatic settings update

### Fixed

- Fixes the bug that sometimes the on-line registration fails

## [0.0.6] - 2018-11-27

### Fixed

- Workaround for `event-stream` vulnerability

## [0.0.5]

### Fixed

- Escapes "\" in selection string.

## [0.0.4]

- Sanitises selection strings for command arguments;
  surrounding commands can now treat inline maths correctly.

## [0.0.3]

- Command argument prefix

## [0.0.2]

- Adds an extension dependency to `latex-support`.
- Mentions [LaTeX Workshop] in README.

[LaTeX Workshop]: https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop

## [0.0.1]

- Initial release
