const mongoose = require("mongoose")
const express = require("express")
const path = require("path")

const bookRoutes = require("./routes/book")
const userRoutes = require("./routes/user")

const app = express()

console.log("connection : " + process.env.CONNECT_DB)
console.log("Token : " + process.env.SECRET_TOKEN)

mongoose
  .connect(process.env.CONNECT_DB)
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"))

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  )
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  )
  next()
})

app.use(express.json())

app.use("/images", express.static(path.join(__dirname, "images")))
app.use("/api/books", bookRoutes)
app.use("/api/auth", userRoutes)

module.exports = app
