import micromatch from 'micromatch';

const DEFAULT_FILES_TO_IGNORE = [
  '.DS_Store', // OSX indexing file
  '.ds_store',
  'Thumbs.db',  // Windows indexing file
  '.*~',
  '~$*',
  '.~lock.*',
  '~*.tmp',
  '*.~*',
  '._*',
  '.*.sw?',
  '.*.*sw?',
  '.TemporaryItems',
  '.Trashes',
  '.DocumentRevisions-V100',
  '.Trash-*',
  '.fseventd',
  '.apdisk',
  '.directory',
  '*.part',
  '*.filepart',
  '*.crdownload',
  '*.kate-swp',
  '*.gnucash.tmp-*',
  '.synkron.*',
  '.sync.ffs_db',
  '.symform',
  '.symform-store',
  '.fuse_hidden*',
  '*.unison',
  '.nfs*',
];

// map of common (mostly media types) mime types to use when the browser does not supply the mime type
const EXTENSION_TO_MIME_TYPE_MAP = {
  avi: 'video/avi',
  gif: 'image/gif',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  pdf: 'application/pdf',
  png: 'image/png',
  zip: 'application/zip'
};

function shouldIgnoreFile(file) {
  return micromatch.isMatch(file.name, DEFAULT_FILES_TO_IGNORE);
}

function copyString(aString) {
  return ` ${aString}`.slice(1);
}

function traverseDirectory(entry) {
  const reader = entry.createReader();
  // Resolved when the entire directory is traversed
  return new Promise((resolveDirectory) => {
    const iterationAttempts = [];
    const errorHandler = () => {};
    function readEntries() {
      // According to the FileSystem API spec, readEntries() must be called until
      // it calls the callback with an empty array.
      reader.readEntries((batchEntries) => {
        if (!batchEntries.length) {
          // Done iterating this particular directory
          resolveDirectory(Promise.all(iterationAttempts));
        } else {
          // Add a list of promises for each directory entry.  If the entry is itself
          // a directory, then that promise won't resolve until it is fully traversed.
          iterationAttempts.push(Promise.all(batchEntries.map((batchEntry) => {
            if (batchEntry.isDirectory) {
              return traverseDirectory(batchEntry);
            }
            return Promise.resolve(batchEntry);
          })));
          // Try calling readEntries() again for the same dir, according to spec
          readEntries();
        }
      }, errorHandler);
    }
    // initial call to recursive entry reader function
    readEntries();
  });
}

function traverseDirectoryHandle(listItem) {
  return new Promise(async (resolveDirectory, reject) => {
    const iterationAttempts = [];
    try {
      const directoryHandle = await listItem.getAsFileSystemHandle();
  
      async function* getFileHandlesRecursively(handle) {
        if (handle.kind === 'file') {
          yield handle;
        } else if (handle.kind === 'directory') {
          for await (const folderHandle of handle.values()) {
            yield*  getFileHandlesRecursively(folderHandle);
          }
        }
      };
  
      for await (const fileHandle of getFileHandlesRecursively(directoryHandle)) {
        iterationAttempts.push(packageFileHandle(fileHandle, directoryHandle));
      }
      resolveDirectory(iterationAttempts);
    } catch (e) {
      reject(e);
    }
  });
}

// package the file in an object that includes the fullPath from the file entry
// that would otherwise be lost
function packageFile(file, entry) {
  let fileTypeOverride = '';
  // handle some browsers sometimes missing mime types for dropped files
  const hasExtension = file.name && file.name.lastIndexOf('.') !== -1;
  if (hasExtension && !file.type) {
    const fileExtension = (file.name || '').split('.').pop();
    fileTypeOverride = EXTENSION_TO_MIME_TYPE_MAP[fileExtension];
  }
  return {
    fileObject: file, // provide access to the raw File object (required for uploading)
    fullPath: entry ? copyString(entry.fullPath) : (file.webkitRelativePath !== '' ? file.webkitRelativePath : `/${file.name}`),
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
    name: file.name,
    size: file.size,
    type: file.type ? file.type : fileTypeOverride,
    webkitRelativePath: file.webkitRelativePath
  };
}

function packageFileHandle(fileHandle, folderHandle) {
  return new Promise(async (resolve) => {
    const file = await fileHandle.getFile();
    let fileData = packageFile(file);
    fileData.fileObject = fileHandle;
    
    if (folderHandle) {
      let pathArray = await folderHandle.resolve(fileHandle);
      const path = pathArray.join('/');
      fileData.fullPath = `/${folderHandle.name}/${path}`;
    }
    resolve(fileData);
  });
}

function getFile(entry) {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof entry.getAsFileSystemHandle === 'function') {
        const fileHandle = await entry.getAsFileSystemHandle();
        resolve(packageFileHandle(fileHandle));
      }
      if (typeof entry.getFile === 'function') {
        const file = entry.getFile();
        resolve(packageFileHandle(file));
      }
      if (typeof entry.file === 'function') {
        entry.file((file) => {
          resolve(packageFile(file, entry));
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

function handleFilePromises(promises, fileList) {
  return Promise.all(promises).then((files) => {
    files.forEach((file) => {
      if (!shouldIgnoreFile(file)) {
        fileList.push(file);
      }
    });
    return fileList;
  });
}

export function getDataTransferFiles(dataTransfer, fileHandle) {
  const dataTransferFiles = [];
  const folderPromises = [];
  const filePromises = [];

  [].slice.call(dataTransfer.items).forEach(async (listItem) => {
    if (typeof listItem.webkitGetAsEntry === 'function') {
      const entry = listItem.webkitGetAsEntry();

      if (!entry) return;
      fileHandle = fileHandle && typeof listItem.getAsFileSystemHandle === 'function';

      if (entry.isDirectory) {
        const promise = fileHandle ? traverseDirectoryHandle(listItem) : traverseDirectory(entry);
        folderPromises.push(promise);
      } else {
        const fileEntry = fileHandle ? listItem : entry;
        filePromises.push(getFile(fileEntry));
      }
    } else {
      dataTransferFiles.push(listItem);
    }
  });
  if (folderPromises.length) {
    return Promise.all(folderPromises).then((promises) => {
      if (fileHandle) {
        promises[0].forEach((promise) => {filePromises.push(promise);});
      } else {
        const flatten = (array) => array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
        const flattenedEntries = flatten(promises);
        // collect async promises to convert each fileEntry into a File object
        flattenedEntries.forEach((fileEntry) => {filePromises.push(getFile(fileEntry));});
      }

      return handleFilePromises(filePromises, dataTransferFiles);
    });
  } else if (filePromises.length) {
    return handleFilePromises(filePromises, dataTransferFiles);
  }
  return Promise.resolve(dataTransferFiles);
}
/**
 * This function should be called from both the onDrop event from your drag/drop
 * dropzone as well as from the HTML5 file selector input field onChange event
 * handler.  Pass the event object from the triggered event into this function.
 * Supports mix of files and folders dropped via drag/drop.
 *
 * Returns: an array of File objects, that includes all files within folders
 *   and subfolders of the dropped/selected items.
 */
export function getDroppedOrSelectedFiles(event, fileHandle = true) {
  const dataTransfer = event.dataTransfer;
  if (dataTransfer && dataTransfer.items) {
      return getDataTransferFiles(dataTransfer, fileHandle).then((fileList) => {
        return Promise.resolve(fileList);
      });
  }
  const files = [];
  const dragDropFileList = dataTransfer && dataTransfer.files;
  const inputFieldFileList = event.target && event.target.files;
  const fileList = dragDropFileList || inputFieldFileList || [];
  // convert the FileList to a simple array of File objects
  for (let i = 0; i < fileList.length; i++) {
    files.push(packageFile(fileList[i]));
  }
  return Promise.resolve(files);
}
