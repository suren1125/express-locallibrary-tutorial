const { DateTime } = require("luxon");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function () {
  // to avoid errors in case where an author does not have either a family name or first name
  // we want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}`;
  }

  return fullname;
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
  // we don't use an arrow function as we'll need this object
  return `/catalog/author/${this._id}`;
});

// Virtual for author's lifespan
AuthorSchema.virtual("lifespan").get(function () {
  const birth = this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toFormat("yyyy")
    : "";
  const death = this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toFormat("yyyy")
    : "";

  if (!birth && !death) return "";

  return `${birth} - ${death}`;
});

// For human-readable display:
// Format date of birth
AuthorSchema.virtual("date_of_birth_formatted").get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : "";
});

// Format date of death
AuthorSchema.virtual("date_of_death_formatted").get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : "";
});

// For form input (YYYY-MM-DD)
// HTML type="date" expects a string in YYYY-MM-DD
AuthorSchema.virtual("date_of_birth_yyyy_mm_dd").get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toISODate()
    : "";
});
AuthorSchema.virtual("date_of_death_yyyy_mm_dd").get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toISODate()
    : "";
});

module.exports = mongoose.model("Author", AuthorSchema);
