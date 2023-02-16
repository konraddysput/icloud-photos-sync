import {buildErrorStruct, ErrorStruct} from "../error-codes.js";

const name = `LibraryError`;
const prefix = `LIBRARY`;

export const NO_DISTANCE_TO_ROOT: ErrorStruct = buildErrorStruct(
    name, prefix, `NO_DISTANCE_TO_ROOT`, `Unable to determine distance to root, no link to root!`,
);

export const UNKNOWN_FILETYPE_DESCRIPTOR: ErrorStruct = buildErrorStruct(
    name, prefix, `UNKNOWN_FILE_TYPE_DESCRIPTOR`, `Unknown filetype descriptor, see GH issue 143`,
);

export const UNKNOWN_FILETYPE_EXTENSION: ErrorStruct = buildErrorStruct(
    name, prefix, `UNKNOWN_FILETYPE_EXTENSION`, `Unknown filetype extension, see GH issue 143`,
);

export const INVALID_FILE: ErrorStruct = buildErrorStruct(
    name, prefix, `INVALID_FILE`, `Found invalid file`,
);

export const DEAD_SYMLINK: ErrorStruct = buildErrorStruct(
    name, prefix, `DEAD_SYMLINK`, `Found dead symlink (removing it)`,
);

export const UNKNOWN_SYMLINK_ERROR: ErrorStruct = buildErrorStruct(
    name, prefix, `UNKNOWN_SYMLINK_ERROR`, `Unknown error while processing symlink`,
);

export const EXTRANEOUS_FILE: ErrorStruct = buildErrorStruct(
    name, prefix, `EXTRANEOUS_FILE`, `Extraneous file found while processing a folder`,
);

export const INVALID_ASSET: ErrorStruct = buildErrorStruct(
    name, prefix, `INVALID_ASSET`, `Unable to verify asset`,
);

export const NO_PARENT: ErrorStruct = buildErrorStruct(
    name, prefix, `NO_PARENT`, `Unable to find parent of album`,
);

export const MULTIPLE_MATCHES: ErrorStruct = buildErrorStruct(
    name, prefix, `MULTIPLE_MATCHES`, `Unable to find album: Multiple matches`,
);

export const EXISTS: ErrorStruct = buildErrorStruct(
    name, prefix, `EXISTS`, `Unable to create album: Already exists`,
);

export const LINK: ErrorStruct = buildErrorStruct(
    name, prefix, `LINK`, `Unable to link assets`,
);

export const FIND_PATH: ErrorStruct = buildErrorStruct(
    name, prefix, `FIND_PATH`, `Unable to find path`,
);

export const NOT_EMPTY: ErrorStruct = buildErrorStruct(
    name, prefix, `NOT_EMPTY`, `Album not empty`,
);

export const LOCK_ACQUISITION: ErrorStruct = buildErrorStruct(
    name, prefix, `LOCK_ACQUISITION`, `Unable to acquire library lock`,
);

export const LOCK_RELEASE: ErrorStruct = buildErrorStruct(
    name, prefix, `LOCK_RELEASE`, `Unable to release library lock`,
);

export const LOCKED: ErrorStruct = buildErrorStruct(
    name, prefix, `LOCKED`, `Library locked. Use --force (or FORCE env variable) to forcefully remove the lock`,
);