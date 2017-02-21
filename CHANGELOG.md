## HTML5 File Selector Change Log

All notable changes to this project will be documented in this file.

### [v1.0.0] - 2017-02-20

- Initial version with drag/drop and file input selection support - allowing selection of both folders and files using chrome, firefox, and MS Edge browsers.
- Browsers that do not include folder selection support will return a File object in the format { type: '', name: 'folder name' }, and will need to be programmatically handled 
