const mongoose = require("mongoose")

const ratingBook = mongoose.Schema({
  userId: { type: String, required: true },
  grade: { type: Number, required: true },
})

const bookSchema = mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: [ratingBook],
  averageRating: { type: Number, required: true },
})

module.exports = mongoose.model("Book", bookSchema)
