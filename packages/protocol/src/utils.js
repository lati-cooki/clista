function stripUndefined(object) {
  for (const key of Object.keys(object)) {
    if (object[key] === undefined) {
      delete object[key];
    }
  }
  return object;
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function indexBy(records, key) {
  return records.reduce((indexed, record) => {
    if (record[key]) {
      indexed[record[key]] = record;
    }
    return indexed;
  }, {});
}

function groupBy(records, key) {
  return records.reduce((grouped, record) => {
    const value = record[key];
    if (!value) {
      return grouped;
    }
    if (!grouped[value]) {
      grouped[value] = [];
    }
    grouped[value].push(record);
    return grouped;
  }, {});
}

function groupByByValues(records, key) {
  return records.reduce((grouped, record) => {
    for (const value of record[key] || []) {
      if (!grouped[value]) {
        grouped[value] = [];
      }
      grouped[value].push(record);
    }
    return grouped;
  }, {});
}

function normalizeType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function arrayValues(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [value];
}

function arrayOrEmpty(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [];
}

function normalizeString(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
}

module.exports = { arrayOrEmpty, arrayValues, groupBy, groupByByValues, indexBy, normalizeString, normalizeType, stripUndefined, unique };
