const _ = require('lodash');


const SIZE_PATTERN = /([0-9]{1,2}(\.5)?)/i;
const WIDTH_PATTERN = /Narrow|Wide|[A-Z]{1,3}/i;
const COMMENT_PATTERN = new RegExp(`(${SIZE_PATTERN.source}\\s*(${WIDTH_PATTERN.source}))`, 'i');

const WIDTH_ADJECTIVES = new Set(['NARROW', 'WIDE']);


class Listing {
  constructor(object) {
    if (object.kind != 'Listing') {
      throw new Error(`Expected 'Listing', got ${object.kind} instead`);
    }

    this.children = _.map(object.data.children, child => {
      return new Comment(child);
    });
    this.kind = object.kind;
    this.modhash = object.data.modhash;
  }
}

class Comment {
  constructor(object) {
    if (object.kind != 't1' && object.kind != 't3') {
      throw new Error(`Expected 't1' or 't3', got ${object.kind} instead`);
    }

    if (object.data.replies) {
      this.replies = new Listing(object.data.replies);
    } else {
      this.replies = null;
    }

    this.author = object.data.author;
    // t3 posts use `selftext`, while t3 uses `body` for
    // markdown and `body_html` for html..
    this.body = object.data.selftext || object.data.body || null;
    this.created_utc = object.data.created_utc;
    this.id = object.data.id;
    this.kind = object.kind;
    this.parent_id = object.data.parent_id || null;
  }
}

class BrannockSize {
  constructor(size, width) {
    this.size = parseFloat(size);
    this.width = width.toUpperCase();
  }

  toString() {
    if (WIDTH_ADJECTIVES.has(this.width)) {
      // Width is a word rather than a Brannock width,
      // so a space should be inserted between the numeric
      // size and the width, and be formatted nicely.
      return `${this.size} ${_.capitalize(this.width)}`;
    }

    return `${this.size}${this.width}`;
  }

  /**
   * Instantiate from a string giving a Brannock size.
   * @param {string} string - Brannock size as a string.
   * @return {BrannockSize} size - Modeled Brannock size.
   */
  static fromString(string) {
    let input_string = string.trim();
    let [match, ...rest] = SIZE_PATTERN.exec(input_string);
    let width = input_string.replace(match, '').trim();
    return new this(match, width);
  }

  /**
   * Instantiate from a Reddit comment containing a size.
   * @param {Comment} comment - Comment specifying a Brannock size.
   * @param {BrannockSize} size - Modeled Brannock size.
   */
  static from_comment(comment) {
    let md = comment.body;
    if (md === undefined) {
      throw new Error;
    }

    let match = COMMENT_PATTERN.exec(md);
    if (match === null) {
      throw new Error;
    }

    let [match_val, ...rest] = match;
    return this.fromString(match_val);
  }
}


module.exports = {
  BrannockSize: BrannockSize,
  Comment: Comment,
  Listing: Listing,
};
