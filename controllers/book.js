const Book = require("../models/book")
const fs = require("fs")
const sharp = require("sharp")

function compression(req) {
  compressionEtape1(req)
  compressionEtape2(req)
}
function compressionEtape1(req) {
  const inputPath = req.file.path
  const outputPath = `images\\${req.file.filename}.webp`

  sharp(inputPath).toFormat("webp").webp({ quality: 20 }).toFile(outputPath)
}
function compressionEtape2(req) {
  sharp.cache(false)
  setTimeout(() => {
    fs.unlink(`images/${req.file.filename}`, (err) => {
      if (err) console.error(err)
    })
  }, 300)
}

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book)
  delete bookObject._id
  delete bookObject._userId
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }.webp`,
  })

  compression(req)

  book
    .save()
    .then(() => res.status(201).json({ message: "Livre enregistré !" }))
    .catch((error) => res.status(400).json({ error }))
}

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }.webp`,
      }
    : { ...req.body }

  delete bookObject._userId
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" })
      } else {
        if (req.file) {
          compression(req)
          const filename = book.imageUrl.split("/images/")[1]
          fs.unlink(`images/${filename}`, () => {})
        }
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Livre modifié!" }))
          .catch((error) => res.status(401).json({ error }))
      }
    })
    .catch((error) => {
      res.status(400).json({ error })
    })
}

exports.addNoteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      const existingRating = book.ratings.find(
        (rating) => rating.userId === req.body.userId
      )

      if (existingRating) {
        return res.status(400).json({ error: "Vous avez déjà noté ce livre." })
      }

      let newAverageRating = 0
      let i = 0
      book.ratings.forEach((notes) => {
        newAverageRating += notes.grade
        i++
      })
      newAverageRating += req.body.rating
      newAverageRating = newAverageRating / (i + 1)
      Book.updateOne(
        { _id: req.params.id },
        {
          $push: {
            ratings: { userId: req.body.userId, grade: req.body.rating },
          },
          averageRating: newAverageRating,
        }
      )
        .then(() => {
          Book.findOne({ _id: req.params.id }).then((book) =>
            res.status(200).json(book)
          )
        })
        .catch((error) => res.status(401).json({ error }))
    })
    .catch((error) => {
      res.status(400).json({ error })
    })
}

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" })
      } else {
        const filename = book.imageUrl.split("/images/")[1]
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Livre supprimé !" })
            })
            .catch((error) => res.status(401).json({ error }))
        })
      }
    })
    .catch((error) => {
      res.status(500).json({ error })
    })
}

exports.getBestBook = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }))
}

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(400).json({ error }))
}

exports.getAllBook = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }))
}
