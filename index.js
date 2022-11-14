const express = require("express"); //import framework pour le développement de serveur en nodeJs pour traiter les requêtes HTTP
const mongoose = require("mongoose"); //Import BDD mongoose
const cloudinary = require("cloudinary").v2; // Cloudinary fournit une API sécurisée pour télécharger des fichiers multimédias à partir du code côté serveur
require("dotenv").config(); // activer dotenv dans notre code
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, //connection a cloudinary
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ error: "Cette route est inconnu au batayon" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
