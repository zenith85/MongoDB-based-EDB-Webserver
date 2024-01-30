// models/description.js
const mongoose = require('mongoose');

//if the collection doesn't have structure, you can use tthe lines bellow
const descriptionSchema = new mongoose.Schema({
  Name: String,
  Service: String,
  Location: String,
  Origin: String,
});
const Description = mongoose.model('Description',descriptionSchema, 'Description');

//const Description = mongoose.model('Description', {},'Description');

module.exports = Description;
