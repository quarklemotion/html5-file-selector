## HTML5 File Selector Change Log

All notable changes to this project will be documented in this file.

### [v2.1.0] - 2018-05-18

- Remove babel-runtime dependency that was not necessary

### [v2.0.1] - 2018-05-16

- Fix entry is null if text is dragged onto the dropzone ( #3 )

### [v2.0.0] - 2018-05-16

- remove mime-types and mime-db dependency to reduce bundle size
- ensure `webkitRelativePath`, `lastModified`, and `lastModifiedDate` are copied/included from the File objects
- force memory copy of `entry.fullPath` to better guarantee it is available in the returned wrapped File objects

### [v1.0.2] - 2018-04-17

- check if file has name, required for react-dropzone pull-request #594 

### [v1.0.1] - 2017-02-20

- Initial version with drag/drop and file input selection support - allowing selection of both folders and files using chrome, firefox, and MS Edge browsers.
- Browsers that do not include folder selection support will return a File object in the format { type: '', name: 'folder name' }, and will need to be programmatically handled 
