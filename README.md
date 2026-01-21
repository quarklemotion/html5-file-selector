# HTML5 File Selector

A small helper for processing files dropped into the browser or selected via a file input. Supports recursive traversal of folders (via the File System Access API or the legacy Directory Entries API) and returns enriched file descriptors useful for uploads and client-side processing.

## Install

```bash
npm install html5-file-selector
```

## Usage

ESM import:
```js
import { getDroppedOrSelectedFiles } from 'html5-file-selector';
```

CommonJS:
```js
const { getDroppedOrSelectedFiles } = require('html5-file-selector');
```

Handle a drag/drop event:
```js
dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = await getDroppedOrSelectedFiles(e);
  console.log(files);
});
```

Handle a directory-enabled file input:
```html
<input id="fileInput" type="file" webkitdirectory multiple />
```
```js
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const files = await getDroppedOrSelectedFiles(e);
  console.log(files);
});
```

## API

- `getDroppedOrSelectedFiles(event, fileHandle = true)`  
  Process a `drop` or `change` event. Returns a `Promise` that resolves to an array of file descriptor objects.

- `getDataTransferFiles(dataTransfer, fileHandle)` (lower-level)  
  Processes a `DataTransfer` object; exported for advanced usage.

## Returned file object

Each item in the returned array is an object containing (at minimum):

- `fileObject`: the original `File` object or a file handle when using the File System Access API.
- `fullPath`: full path preserving directory structure (when available).
- `name`: filename.
- `size`: size in bytes.
- `type`: mime type (falls back to mapped types for common extensions).
- `lastModified`, `lastModifiedDate`
- `webkitRelativePath`: relative path when available.

See the implementation for exact fields: [src/Html5FileSelector.js](src/Html5FileSelector.js)

## Behavior & notes

- Recursively traverses folders dropped or selected.
- Uses the modern File System Access API when available; falls back to `webkitGetAsEntry`/Directory Entries API.
- Common system/editor files are ignored via a default ignore list.
- When browsers omit mime types, common extensions are mapped to sensible mime types.

## Browser support

Works best in modern Chromium-based browsers that support the File System Access API. Also supports browsers exposing `webkitGetAsEntry`. If neither advanced API is available, the module falls back to plain `FileList` handling.

## Development & tests

- Source: [src/Html5FileSelector.js](src/Html5FileSelector.js)  
- Tests: [test/Html5FileSelctorSpec.js](test/Html5FileSelctorSpec.js)  
Run tests (if defined in `package.json`):
```bash
npm test
```

## Contributing

Fork, run tests, and open a PR. Please include tests for new behavior.

## License

MIT — see [LICENSE.txt](LICENSE.txt)
```

To write this into README.md in the project root, run:

```bash
cat > README.md <<'EOF'
# HTML5 File Selector

A small helper for processing files dropped into the browser or selected via a file input. Supports recursive traversal of folders (via the File System Access API or the legacy Directory Entries API) and returns enriched file descriptors useful for uploads and client-side processing.

## Install

```bash
npm install html5-file-selector
```

## Usage

ESM import:
```js
import { getDroppedOrSelectedFiles } from 'html5-file-selector';
```

CommonJS:
```js
const { getDroppedOrSelectedFiles } = require('html5-file-selector');
```

Handle a drag/drop event:
```js
dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = await getDroppedOrSelectedFiles(e);
  console.log(files);
});
```

Handle a directory-enabled file input:
```html
<input id="fileInput" type="file" webkitdirectory multiple />
```
```js
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const files = await getDroppedOrSelectedFiles(e);
  console.log(files);
});
```

## API

- `getDroppedOrSelectedFiles(event, fileHandle = true)`  
  Process a `drop` or `change` event. Returns a `Promise` that resolves to an array of file descriptor objects.

- `getDataTransferFiles(dataTransfer, fileHandle)` (lower-level)  
  Processes a `DataTransfer` object; exported for advanced usage.

## Returned file object

Each item in the returned array is an object containing (at minimum):

- `fileObject`: the original `File` object or a file handle when using the File System Access API.
- `fullPath`: full path preserving directory structure (when available).
- `name`: filename.
- `size`: size in bytes.
- `type`: mime type (falls back to mapped types for common extensions).
- `lastModified`, `lastModifiedDate`
- `webkitRelativePath`: relative path when available.

See the implementation for exact fields: [src/Html5FileSelector.js](src/Html5FileSelector.js)

## Behavior & notes

- Recursively traverses folders dropped or selected.
- Uses the modern File System Access API when available; falls back to `webkitGetAsEntry`/Directory Entries API.
- Common system/editor files are ignored via a default ignore list.
- When browsers omit mime types, common extensions are mapped to sensible mime types.

## Browser support

Works best in modern Chromium-based browsers that support the File System Access API. Also supports browsers exposing `webkitGetAsEntry`. If neither advanced API is available, the module falls back to plain `FileList` handling.

## Development & tests

- Source: [src/Html5FileSelector.js](src/Html5FileSelector.js)  
- Tests: [test/Html5FileSelctorSpec.js](test/Html5FileSelctorSpec.js)  
Run tests (if defined in `package.json`):
```bash
npm test
```

## Contributing

Fork, run tests, and open a PR. Please include tests for new behavior.

## License

MIT — see [LICENSE.txt](LICENSE.txt)
