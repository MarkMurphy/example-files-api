// Syntax
// Content-Range: <unit> <range-start>-<range-end>/<size>
// Content-Range: <unit> <range-start>-<range-end>/*
// Content-Range: <unit> */<size>

type ContentRange = {
  //  The unit in which ranges are specified
  unit: string;
  //  An integer indicating the beginning of the requested range
  rangeStart: number | null;
  //  An integer in the given unit indicating the end of the requested range
  rangeEnd: number | null;
  //  The total size of the document or null if unknown
  size: number | null;
};

export function parseContentRange(
  headerValue: string | null | undefined,
): ContentRange | null {
  if (!headerValue) {
    return null;
  }

  if (typeof headerValue !== 'string') {
    throw new Error('invalid argument');
  }

  // Check for presence of unit
  let matches = headerValue.match(/^(\w*) /);
  const unit = matches?.[1]!;

  // check for start-end/size header format
  matches = headerValue.match(/(\d+)-(\d+)\/(\d+|\*)/);
  if (matches) {
    return {
      unit,
      rangeStart: parseInt(matches[1]),
      rangeEnd: parseInt(matches[2]),
      size: matches[3] === '*' ? null : parseInt(matches[3]),
    };
  }

  // check for size header format
  matches = headerValue.match(/\/(\d+|\*)/);
  console.log(matches);
  if (matches) {
    return {
      unit,
      rangeStart: null,
      rangeEnd: null,
      size: matches[1] === '*' ? null : parseInt(matches[1]),
    };
  }

  return null;
}

function parseInt(value: string): number {
  return Number.parseInt(value, 10);
}
