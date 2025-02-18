// Example wrapper class around Set and persisting to sessionStorage
function SSet(key) {
  this.key = key;
  const data = sessionStorage.getItem(key);
  this.set = data ? new Set(JSON.parse(data)) : new Set();
}

// Setup a constructor and prototype chain to add methods
SSet.prototype.constructor = SSet;
SSet.prototype.save = function () {
  this.size = this.set.size;
  sessionStorage.setItem(this.key, JSON.stringify(Array.from(this.set)));
};
SSet.prototype.has = function (key) {
  return this.set.has(key);
};
SSet.prototype.clear = function () {
  this.set.clear();
  this.save();
};
SSet.prototype.add = function (value) {
  this.set.add(value);
  this.save();
};
SSet.prototype.delete = function (value) {
  this.set.delete(value);
  this.save();
};
SSet.prototype.forEach = function (cb) {
  this.set.forEach(cb);
};

// To inherit from SSet, we need to create a new constructor and prototype chain
function SSetExtended(key) {
  // Call to super constructor
  SSet.call(this, key);
}

// Inherit from SSet
SSetExtended.prototype = Object.create(SSet.prototype);
SSetExtended.prototype.constructor = SSetExtended;
SSetExtended.prototype.add = function (value) {
  // Call to super method
  SSet.prototype.add.call(this, value);
  console.log('Added', value);
};
