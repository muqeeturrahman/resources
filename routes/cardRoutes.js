

const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { addCard,getCard,updateCard,deleteCard } = require("../controllers/cardController");

router.post("/card",auth,addCard)
router.get("/card",auth,getCard)
router.patch("/card/:id",auth,updateCard)
router.delete("/card/:id",auth,deleteCard)



module.exports = router;
