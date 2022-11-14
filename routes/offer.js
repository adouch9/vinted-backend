const express = require("express"); //import framework pour le développement de serveur en nodeJs pour traiter les requêtes HTTP
const router = express.Router(); //function router() pour créer un nouvel objet routeur dans mon programme pour gérer la demande

const fileUpload = require("express-fileupload"); // middleware permettant de rendre les fichiers téléchargés accessibles depuis la req.files propriété.
const cloudinary = require("cloudinary"); // Cloudinary fournit une API sécurisée pour télécharger des fichiers multimédias à partir du code côté serveur
const isAuthenticated = require("../middlewares/isAuthenticated"); // Import de ma function isAuthentificated permettant d'authentifier un user avec son token

const Offer = require("../models/Offer"); //Import du models Offers.js

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`; //Encodage du fichier en tant que chaîne Base64
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log(req.headers.authorization);
      console.log(req.files);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });

      const image = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture) // image = upload de l'image sur cloudinary en utilisent la function convertToBase64
      );

      newOffer.product_image = image; //l'image dans l'objet new offer = image

      await newOffer.save(); // sauvegarde en BDD mongoDb
      console.log(newOffer);
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message }); // traiter les erreurs
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = {
        $gte: Number(req.query.priceMin),
      };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = {
          $lte: Number(req.query.priceMax),
        };
      }
    }

    const sort = {};

    if (req.query.sort === "price-desc") {
      sort.product_price = -1; // desc                                  //CONDITION POUR PRIX CROISSANT EST DECROISSANT AVEC LA METHODE .SORT SUR MON ELEMENT SORT
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1; // asc
    }

    let limit = 5;
    if (req.query.limit) {
      limit = req.query.limit;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const skip = (page - 1) * limit;

    const results = await Offer.find(filters) //j'ajoute tout les element sur mon tableau vide
      .sort(sort) // j'utilise la methode .sort pour remplir mon tableau vide
      .skip(skip)
      .limit(limit);
    //.select("product_name product_price -_id");  j'utilise la methode .select pour selectionner le name, price, id
    const count = await Offer.countDocuments(filters);
    res.json({ count: count, offers: results });

    // res.json(results);
  } catch (error) {
    res.status(400).json({ message: error.message }); // CATCH ERROR 400
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message }); // CATCH ERROR 400
  }
});

module.exports = router;
